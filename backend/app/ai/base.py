from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, List, Optional


class BaseLLMProvider(ABC):
    """
    Abstract interface for AI LLM providers (Google Gemini & Ollama).
    """

    @abstractmethod
    async def generate_stream(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream LLM responses. Yields events like:
        {"type": "token", "content": "..."}
        {"type": "tool_call", "name": "...", "args": {...}, "id": "..."}
        """
        pass

    @abstractmethod
    async def get_embedding(self, text: str) -> List[float]:
        """
        Generate dense vector embedding (768 dimensions) for semantic retrieval.
        """
        pass
