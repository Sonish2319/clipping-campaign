import json
from typing import Optional, List
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.api.deps import oauth2_scheme
from app.core.security import decode_token
from app.models.user import User
from app.ai.service import ai_service
from app.ai.vector_store import vector_store

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Extract user if valid Bearer token is provided, else returns None."""
    if not token:
        return None
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return db.query(User).filter(User.id == int(user_id)).first()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


@router.post("/chat")
async def chat_with_assistant(
    payload: ChatRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Streaming chat endpoint with Server-Sent Events (SSE).
    Uses Agentic Hybrid RAG (Qdrant semantic search + MySQL tools).
    """
    # Build full message history
    formatted_messages = []
    for h in payload.history or []:
        formatted_messages.append({"role": h.role, "content": h.content})

    # Append latest user message
    formatted_messages.append({"role": "user", "content": payload.message})

    user_id = current_user.id if current_user else None

    async def event_generator():
        try:
            async for chunk in ai_service.stream_chat(
                messages=formatted_messages,
                current_user_id=user_id,
            ):
                chunk_json = json.dumps(chunk)
                yield f"data: {chunk_json}\n\n"
        except Exception as e:
            err_json = json.dumps({"type": "error", "content": f"AI Engine error: {str(e)}"})
            yield f"data: {err_json}\n\n"
        finally:
            yield "data: {\"type\": \"done\"}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/health")
async def ai_health():
    """Returns AI subsystem status, Qdrant connectivity, and active provider."""
    qdrant_ok = await vector_store.is_healthy()
    return {
        "status": "healthy" if qdrant_ok else "degraded",
        "provider": settings.LLM_PROVIDER,
        "qdrant_connected": qdrant_ok,
        "qdrant_host": settings.QDRANT_HOST,
        "qdrant_port": settings.QDRANT_PORT,
    }
