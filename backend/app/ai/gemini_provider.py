import json
import httpx
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.ai.base import BaseLLMProvider
from app.ai.tools import AVAILABLE_TOOLS_DEFINITIONS
from app.core.config import settings


class GeminiLLMProvider(BaseLLMProvider):
    """
    Google Gemini Provider using direct async REST streaming.
    Supports native tool calling, thought signatures, and gemini-embedding-001.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        raw_model = model or settings.GEMINI_MODEL or "gemini-3-flash-preview"
        # Sanitize deprecated gemini-1.5 / 2.5 names
        if "1.5" in raw_model or "2.5" in raw_model:
            self.model = "gemini-3-flash-preview"
        else:
            self.model = raw_model
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    def _convert_tools_to_gemini(self, tools: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Convert standard OpenAI-style function definitions to Gemini tool format."""
        function_declarations = []
        for t in tools:
            fn = t.get("function", {})
            function_declarations.append({
                "name": fn.get("name"),
                "description": fn.get("description"),
                "parameters": fn.get("parameters"),
            })
        return [{"functionDeclarations": function_declarations}]

    def _format_messages_to_gemini(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Format chat messages into Gemini contents format."""
        contents = []
        for msg in messages:
            role = msg.get("role")
            content = msg.get("content", "")

            if role == "assistant":
                if msg.get("raw_parts"):
                    contents.append({"role": "model", "parts": msg["raw_parts"]})
                elif msg.get("tool_calls"):
                    parts = []
                    for tc in msg["tool_calls"]:
                        if tc.get("raw_part"):
                            parts.append(tc["raw_part"])
                        else:
                            fn_args = tc["function"]["arguments"]
                            if isinstance(fn_args, str):
                                try:
                                    fn_args = json.loads(fn_args)
                                except Exception:
                                    fn_args = {}
                            parts.append({
                                "functionCall": {
                                    "name": tc["function"]["name"],
                                    "args": fn_args
                                }
                            })
                    contents.append({"role": "model", "parts": parts})
                else:
                    contents.append({"role": "model", "parts": [{"text": content}]})
            elif role == "tool":
                fn_name = msg.get("name", "tool_result")
                tool_res_content = content
                if isinstance(tool_res_content, str):
                    try:
                        tool_res_content = json.loads(tool_res_content)
                    except Exception:
                        pass
                # In Gemini 3.x, functionResponse is submitted under role "user"
                contents.append({
                    "role": "user",
                    "parts": [{
                        "functionResponse": {
                            "name": fn_name,
                            "response": {"result": tool_res_content}
                        }
                    }]
                })
            else:
                contents.append({"role": "user", "parts": [{"text": content}]})
        return contents

    async def generate_stream(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream responses token-by-token or yield tool calls.
        """
        if not self.api_key:
            yield {
                "type": "token",
                "content": "⚠️ *Gemini API key is not configured in `.env` (GEMINI_API_KEY).* You can configure your key or switch to local Ollama via `LLM_PROVIDER=ollama`.",
            }
            return

        gemini_tools = self._convert_tools_to_gemini(tools or AVAILABLE_TOOLS_DEFINITIONS)
        contents = self._format_messages_to_gemini(messages)

        request_body: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.4,
                "topP": 0.95,
            },
        }

        if system_prompt:
            request_body["systemInstruction"] = {
                "parts": [{"text": system_prompt}]
            }

        if gemini_tools and gemini_tools[0].get("functionDeclarations"):
            request_body["tools"] = gemini_tools

        candidate_models = [self.model, "gemini-3-flash-preview", "gemini-flash-latest"]
        seen_models = set()
        models_to_try = []
        for m in candidate_models:
            if m not in seen_models:
                seen_models.add(m)
                models_to_try.append(m)

        for attempt_model in models_to_try:
            url = f"{self.base_url}/models/{attempt_model}:streamGenerateContent?key={self.api_key}"
            async with httpx.AsyncClient(timeout=30.0) as client:
                async with client.stream("POST", url, json=request_body) as response:
                    if response.status_code == 200:
                        buffer = ""
                        async for chunk in response.aiter_text():
                            buffer += chunk
                            while True:
                                trimmed = buffer.strip()
                                if trimmed.startswith("["):
                                    trimmed = trimmed[1:].strip()
                                if trimmed.startswith(","):
                                    trimmed = trimmed[1:].strip()
                                if trimmed.startswith("]"):
                                    trimmed = trimmed[1:].strip()
                                    buffer = trimmed
                                    break
                                if not trimmed:
                                    buffer = ""
                                    break

                                try:
                                    decoder = json.JSONDecoder()
                                    obj, idx = decoder.raw_decode(trimmed)
                                    buffer = trimmed[idx:]

                                    candidates = obj.get("candidates", [])
                                    if candidates:
                                        first_cand = candidates[0]
                                        parts = first_cand.get("content", {}).get("parts", [])
                                        for p in parts:
                                            if "text" in p and p["text"]:
                                                yield {"type": "token", "content": p["text"]}
                                            elif "functionCall" in p:
                                                fn_call = p["functionCall"]
                                                yield {
                                                    "type": "tool_call",
                                                    "name": fn_call.get("name"),
                                                    "args": fn_call.get("args", {}),
                                                    "id": fn_call.get("id") or f"call_{fn_call.get('name')}",
                                                    "raw_part": p,
                                                }
                                except json.JSONDecodeError:
                                    break
                        return
                    elif response.status_code in (404, 503):
                        continue
                    else:
                        err_body = await response.aread()
                        yield {
                            "type": "error",
                            "content": f"Gemini API Error ({response.status_code}): {err_body.decode('utf-8', errors='ignore')}",
                        }
                        return

        yield {
            "type": "error",
            "content": "All Gemini candidate models returned 404 or 503. Please verify model availability on your Google AI Studio account.",
        }

    async def get_embedding(self, text: str) -> List[float]:
        """
        Compute text embedding using gemini-embedding-001 (768 dimensions).
        """
        if not self.api_key:
            import hashlib
            seed = int(hashlib.sha256(text.encode("utf-8")).hexdigest()[:8], 16)
            import random
            rng = random.Random(seed)
            return [rng.uniform(-1.0, 1.0) for _ in range(768)]

        url = f"{self.base_url}/models/gemini-embedding-001:embedContent?key={self.api_key}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    url,
                    json={
                        "model": "models/gemini-embedding-001",
                        "content": {"parts": [{"text": text}]},
                        "outputDimensionality": 768
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    return data.get("embedding", {}).get("values", [0.0] * 768)
        except Exception:
            pass

        return [0.0] * 768
