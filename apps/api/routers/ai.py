"""AI chat router with SSE streaming."""

from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.ai import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionResponse,
    SendMessageBody,
)
from apps.api.services.ai_service import AIService

router = APIRouter()


def get_service(db: DbSession) -> AIService:
    return AIService(db)


@router.get("/chat/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(user: CurrentUser, service: AIService = Depends(get_service)):
    return await service.get_sessions(user.id)


@router.post("/chat/sessions", response_model=ChatSessionResponse, status_code=201)
async def create_session(body: ChatSessionCreate, user: CurrentUser, service: AIService = Depends(get_service)):
    return await service.create_session(user.id, body.product_id)


@router.get("/chat/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
async def list_messages(session_id: UUID, user: CurrentUser, service: AIService = Depends(get_service)):
    return await service.get_messages(session_id, user.id)


@router.post("/chat/sessions/{session_id}/messages", response_model=ChatMessageResponse, status_code=201)
async def send_message(session_id: UUID, body: SendMessageBody, user: CurrentUser, service: AIService = Depends(get_service)):
    """Send a message and get a non-streaming AI response."""
    return await service.send_and_respond(session_id, body.content, user.id)


@router.post("/chat", response_class=StreamingResponse)
async def chat(body: ChatMessageCreate, user: CurrentUser, service: AIService = Depends(get_service)):
    """Send message and receive SSE streaming response."""
    stream = service.stream_response(body.session_id, body.content, user.id)
    return StreamingResponse(stream, media_type="text/event-stream")
