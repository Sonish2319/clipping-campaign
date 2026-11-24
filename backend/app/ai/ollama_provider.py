import json
import httpx
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.ai.base import BaseLLMProvider
from app.ai.tools import AVAILABLE_TOOLS_DEFINITIONS
from app.core.config import settings


class OllamaLLMProvider(BaseLLMProvider):
    """
    Ollama Local LLM Provider using standard OpenAI-compatible API.
    Connects to http://localhost:11434/v1 by default.
    """

    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL or "llama3.1:latest"

    async def generate_stream(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream completions from local Ollama OpenAI-compatible endpoint.
        """
        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})
        formatted_messages.extend(messages)

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": formatted_messages,
            "stream": True,
        }

        if tools:
            payload["tools"] = tools

        url = f"{self.base_url}/chat/completions"

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", url, json=payload) as response:
                    if response.status_code != 200:
                        err = await response.aread()
                        yield {
                            "type": "error",
                            "content": f"Ollama Error ({response.status_code}): {err.decode('utf-8', errors='ignore')}. Make sure Ollama is running (`ollama serve`).",
                        }
                        return

                    async for line in response.aiter_lines():
                        if not line or not line.startswith("data: "):
                            continue
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break

                        try:
                            chunk = json.loads(data_str)
                            choices = chunk.get("choices", [])
                            if not choices:
                                continue
                            delta = choices[0].get("delta", {})

                            if "content" in delta and delta["content"]:
                                yield {"type": "token", "content": delta["content"]}

                            if "tool_calls" in delta:
                                for tc in delta["tool_calls"]:
                                    yield {
                                        "type": "tool_call",
                                        "name": tc["function"]["name"],
                                        "args": json.loads(tc["function"]["arguments"]) if isinstance(tc["function"]["arguments"], str) else tc["function"]["arguments"],
                                        "id": tc.get("id", "call_ollama"),
                                    }
                        except Exception:
                            continue
        except httpx.ConnectError:
            yield {
                "type": "error",
                "content": "❌ Could not connect to local Ollama server at " + self.base_url + ". Ensure Ollama is running (`ollama serve`) and the model is pulled (`ollama pull " + self.model + "`).",
            }

    async def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding from Ollama (/v1/embeddings or /api/embeddings).
        """
        url = f"{self.base_url}/embeddings"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    url,
                    json={
                        "model": "nomic-embed-text",
                        "input": text,
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    embed_data = data.get("data", [])
                    if embed_data:
                        return embed_data[0].get("embedding", [0.0] * 768)
        except Exception:
            pass

        # Deterministic fallback vector
        import hashlib
        seed = int(hashlib.sha256(text.encode("utf-8")).hexdigest()[:8], 16)
        import random
        rng = random.Random(seed)
        return [rng.uniform(-1.0, 1.0) for _ in range(768)]
