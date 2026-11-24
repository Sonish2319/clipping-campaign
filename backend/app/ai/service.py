import json
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.core.config import settings
from app.ai.base import BaseLLMProvider
from app.ai.gemini_provider import GeminiLLMProvider
from app.ai.ollama_provider import OllamaLLMProvider
from app.ai.vector_store import vector_store
from app.ai.prompts import SYSTEM_PROMPT
from app.ai.tools import (
    AVAILABLE_TOOLS_DEFINITIONS,
    execute_get_active_campaigns,
    execute_get_campaign_details,
    execute_get_top_leaderboard,
    execute_get_my_submissions,
)


class AIService:
    """
    Orchestrates Agentic Hybrid RAG with Google Gemini and Ollama.
    Handles semantic vector search, deterministic DB tool invocation, and streaming.
    """

    def __init__(self):
        self.provider: BaseLLMProvider = self._load_provider()

    def _load_provider(self) -> BaseLLMProvider:
        provider_name = (settings.LLM_PROVIDER or "gemini").lower()
        if provider_name == "ollama":
            return OllamaLLMProvider()
        return GeminiLLMProvider()

    async def execute_tool(self, tool_name: str, args: Dict[str, Any], current_user_id: Optional[int] = None) -> Any:
        """Execute tool and return structured JSON result."""
        if tool_name == "get_active_campaigns":
            return execute_get_active_campaigns(
                category=args.get("category"),
                min_reward=args.get("min_reward"),
                limit=args.get("limit", 5),
            )
        elif tool_name == "get_campaign_details":
            return execute_get_campaign_details(args.get("identifier", ""))
        elif tool_name == "get_top_leaderboard":
            return execute_get_top_leaderboard(limit=args.get("limit", 5))
        elif tool_name == "get_my_submissions_status":
            return execute_get_my_submissions(user_id=current_user_id or 0)
        elif tool_name == "search_policies":
            query = args.get("query", "")
            query_vector = await self.provider.get_embedding(query)
            results = await vector_store.search("marketplace_policies", query_vector, limit=3)
            return [
                {
                    "title": r.get("payload", {}).get("title", "Policy Section"),
                    "category": r.get("payload", {}).get("category", "General"),
                    "text": r.get("payload", {}).get("text", ""),
                    "score": round(r.get("score", 0.0), 3),
                }
                for r in results
            ]
        else:
            return {"error": f"Unknown tool: {tool_name}"}

    async def stream_chat(
        self,
        messages: List[Dict[str, Any]],
        current_user_id: Optional[int] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream chat completion. Automatically intercepts tool calls, runs them,
        and streams the final synthesized answer.
        """
        self.provider = self._load_provider()

        current_messages = list(messages)
        tool_calls_detected = []

        # First pass: see if LLM wants to respond with tokens or request a tool call
        async for chunk in self.provider.generate_stream(
            messages=current_messages,
            tools=AVAILABLE_TOOLS_DEFINITIONS,
            system_prompt=SYSTEM_PROMPT,
        ):
            if chunk["type"] == "token":
                yield chunk
            elif chunk["type"] == "tool_call":
                tool_calls_detected.append(chunk)
            elif chunk["type"] == "error":
                yield chunk

        # If LLM requested tools, execute them and generate second-stage synthesis
        if tool_calls_detected:
            yield {
                "type": "status",
                "content": f"Searching platform knowledge & live database...",
            }

            assistant_tool_calls = []
            tool_response_messages = []
            raw_parts = []

            for tc in tool_calls_detected:
                fn_name = tc["name"]
                fn_args = tc.get("args", {})
                call_id = tc.get("id", f"call_{fn_name}")

                if "raw_part" in tc:
                    raw_parts.append(tc["raw_part"])

                assistant_tool_calls.append({
                    "id": call_id,
                    "type": "function",
                    "raw_part": tc.get("raw_part"),
                    "function": {
                        "name": fn_name,
                        "arguments": json.dumps(fn_args),
                    },
                })

                # Execute tool
                tool_output = await self.execute_tool(fn_name, fn_args, current_user_id)

                tool_response_messages.append({
                    "role": "tool",
                    "tool_call_id": call_id,
                    "name": fn_name,
                    "content": json.dumps(tool_output),
                })

            current_messages.append({
                "role": "assistant",
                "content": "",
                "tool_calls": assistant_tool_calls,
                "raw_parts": raw_parts if raw_parts else None,
            })
            current_messages.extend(tool_response_messages)

            # Second generation: Synthesize the final answer using retrieved data
            async for second_chunk in self.provider.generate_stream(
                messages=current_messages,
                tools=None,
                system_prompt=SYSTEM_PROMPT,
            ):
                if second_chunk["type"] == "token":
                    yield second_chunk
                elif second_chunk["type"] == "error":
                    yield second_chunk


# Global AI Service instance
ai_service = AIService()
