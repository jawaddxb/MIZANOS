"""AI service with LLM integration and SSE streaming."""

from collections.abc import AsyncIterator
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.config import settings
from apps.api.models.ai import AIChatMessage, AIChatSession


class AIService:
    """AI chat with streaming responses."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    @staticmethod
    def _get_llm_config() -> tuple[str, str | None, str]:
        """Return (api_key, base_url, model) or raise with actionable message."""
        api_key = settings.openrouter_api_key or settings.openai_api_key
        if not api_key:
            raise ValueError(
                "No LLM API key configured. Set OPENROUTER_API_KEY or "
                "OPENAI_API_KEY in your environment to enable AI features."
            )
        base_url = (
            "https://openrouter.ai/api/v1"
            if settings.openrouter_api_key
            else None
        )
        model = (
            "anthropic/claude-sonnet-4"
            if settings.openrouter_api_key
            else "gpt-4o"
        )
        return api_key, base_url, model

    async def get_sessions(self, user_id: str) -> list[AIChatSession]:
        stmt = (
            select(AIChatSession)
            .where(AIChatSession.user_id == user_id)
            .order_by(AIChatSession.updated_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_session(
        self, user_id: str, product_id: UUID | None = None
    ) -> AIChatSession:
        chat_session = AIChatSession(user_id=user_id, product_id=product_id)
        self.session.add(chat_session)
        await self.session.flush()
        await self.session.refresh(chat_session)
        return chat_session

    async def get_messages(self, session_id: UUID, user_id: str) -> list[AIChatMessage]:
        # Verify the session belongs to this user
        session_stmt = select(AIChatSession).where(
            AIChatSession.id == session_id,
            AIChatSession.user_id == user_id,
        )
        session_result = await self.session.execute(session_stmt)
        if not session_result.scalar_one_or_none():
            return []

        stmt = (
            select(AIChatMessage)
            .where(AIChatMessage.session_id == session_id)
            .order_by(AIChatMessage.created_at)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    def _build_user_content(
        content: str, images: list[str] | None = None,
    ) -> str | list[dict]:
        """Build user message content — plain string or multimodal parts."""
        if not images:
            return content
        parts: list[dict] = [{"type": "text", "text": content}]
        for img in images:
            parts.append({"type": "image_url", "image_url": {"url": img}})
        return parts

    async def send_and_respond(
        self,
        session_id: UUID,
        content: str,
        user_id: str,
        images: list[str] | None = None,
    ) -> AIChatMessage:
        """Send a message and get a non-streaming AI response."""
        import logging
        logger = logging.getLogger(__name__)

        # Verify session ownership
        session_stmt = select(AIChatSession).where(
            AIChatSession.id == session_id,
            AIChatSession.user_id == user_id,
        )
        session_result = await self.session.execute(session_stmt)
        if not session_result.scalar_one_or_none():
            raise ValueError("Session not found")

        # Save user message
        user_msg = AIChatMessage(
            session_id=session_id, role="user", content=content
        )
        self.session.add(user_msg)
        await self.session.flush()

        # Call LLM (non-streaming)
        full_response = ""
        try:
            import openai

            api_key, base_url, model = self._get_llm_config()
            client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)

            user_content = self._build_user_content(content, images)
            messages: list[dict] = [
                {
                    "role": "system",
                    "content": (
                        "You are Mizan, an AI assistant for product lifecycle management. "
                        "When the user's message contains instructions to return JSON, "
                        "respond with ONLY valid JSON — no markdown fences, no explanation."
                    ),
                },
                {"role": "user", "content": user_content},
            ]

            response = await client.chat.completions.create(
                model=model,
                messages=messages,
            )
            full_response = response.choices[0].message.content or ""

        except ValueError as e:
            full_response = str(e)
        except Exception:
            logger.exception("LLM response error")
            full_response = "Sorry, an error occurred while generating a response."

        # Save and return assistant message
        assistant_msg = AIChatMessage(
            session_id=session_id, role="assistant", content=full_response
        )
        self.session.add(assistant_msg)
        await self.session.flush()
        await self.session.refresh(assistant_msg)
        return assistant_msg

    async def stream_response(
        self, session_id: UUID, content: str, user_id: str
    ) -> AsyncIterator[str]:
        """Stream AI response as SSE events."""
        # Verify session ownership
        session_stmt = select(AIChatSession).where(
            AIChatSession.id == session_id,
            AIChatSession.user_id == user_id,
        )
        session_result = await self.session.execute(session_stmt)
        if not session_result.scalar_one_or_none():
            yield "data: Error: Session not found\n\n"
            yield "data: [DONE]\n\n"
            return

        # Save user message
        user_msg = AIChatMessage(
            session_id=session_id, role="user", content=content
        )
        self.session.add(user_msg)
        await self.session.flush()

        # Stream from LLM (OpenRouter or OpenAI)
        full_response = ""
        try:
            import openai

            api_key, base_url, model = self._get_llm_config()

            messages: list[dict[str, str]] = [
                {
                    "role": "system",
                    "content": (
                        "You are Mizan, an AI assistant for product lifecycle management. "
                        "When the user's message contains instructions to return JSON, "
                        "respond with ONLY valid JSON — no markdown fences, no explanation."
                    ),
                },
                {"role": "user", "content": content},
            ]

            client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)
            stream = await client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True,
            )

            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    full_response += delta
                    yield f"data: {delta}\n\n"

        except ValueError as e:
            full_response = str(e)
            yield f"data: {full_response}\n\n"
        except Exception:
            import logging
            logging.getLogger(__name__).exception("LLM streaming error")
            full_response = "Sorry, an error occurred while generating a response."
            yield f"data: {full_response}\n\n"

        # Save assistant message
        assistant_msg = AIChatMessage(
            session_id=session_id, role="assistant", content=full_response
        )
        self.session.add(assistant_msg)
        await self.session.flush()

        yield "data: [DONE]\n\n"
