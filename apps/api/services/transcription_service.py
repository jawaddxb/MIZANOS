"""Audio transcription service using OpenAI Whisper API."""

import logging

import openai

from apps.api.config import settings

logger = logging.getLogger(__name__)


class TranscriptionService:
    """Transcribe audio files via OpenAI Whisper."""

    def __init__(self) -> None:
        api_key = settings.openai_api_key
        if not api_key:
            raise ValueError(
                "OpenAI API key is required for transcription. "
                "Set OPENAI_API_KEY in your environment."
            )
        self.client = openai.AsyncOpenAI(api_key=api_key)

    async def transcribe(self, audio_file: bytes, filename: str) -> str:
        """Transcribe audio bytes and return the text."""
        try:
            response = await self.client.audio.transcriptions.create(
                model="whisper-1",
                file=(filename, audio_file),
            )
            return response.text
        except openai.APIError as e:
            logger.exception("Whisper API error")
            raise ValueError(f"Transcription failed: {e}") from e
