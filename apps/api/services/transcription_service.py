"""Audio transcription service using OpenAI Whisper or OpenRouter multimodal."""

import base64
import logging

import openai

from apps.api.config import settings

logger = logging.getLogger(__name__)

_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
_OPENROUTER_AUDIO_MODEL = "google/gemini-2.0-flash-001"


class TranscriptionService:
    """Transcribe audio files via OpenAI Whisper or OpenRouter multimodal."""

    def __init__(self) -> None:
        if settings.openai_api_key:
            self._mode = "openai"
            self._client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        elif settings.openrouter_api_key:
            self._mode = "openrouter"
            self._client = openai.AsyncOpenAI(
                api_key=settings.openrouter_api_key,
                base_url=_OPENROUTER_BASE_URL,
            )
        else:
            raise ValueError(
                "No API key configured for transcription. "
                "Set OPENAI_API_KEY or OPENROUTER_API_KEY in your environment."
            )

    async def transcribe(self, audio_file: bytes, filename: str) -> str:
        """Transcribe audio bytes and return the text."""
        if self._mode == "openai":
            return await self._transcribe_whisper(audio_file, filename)
        return await self._transcribe_multimodal(audio_file, filename)

    async def _transcribe_whisper(self, audio_file: bytes, filename: str) -> str:
        """Transcribe via OpenAI Whisper endpoint."""
        try:
            response = await self._client.audio.transcriptions.create(
                model="whisper-1",
                file=(filename, audio_file),
            )
            return response.text
        except openai.APIError as e:
            logger.exception("Whisper API error")
            raise ValueError(f"Transcription failed: {e}") from e

    async def _transcribe_multimodal(self, audio_file: bytes, filename: str) -> str:
        """Transcribe via OpenRouter chat completions with audio input."""
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "webm"
        mime_map = {
            "webm": "audio/webm", "mp3": "audio/mpeg", "wav": "audio/wav",
            "m4a": "audio/mp4", "ogg": "audio/ogg", "flac": "audio/flac",
        }
        mime = mime_map.get(ext, "audio/webm")
        b64 = base64.b64encode(audio_file).decode()
        data_url = f"data:{mime};base64,{b64}"

        try:
            response = await self._client.chat.completions.create(
                model=_OPENROUTER_AUDIO_MODEL,
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Transcribe the following audio exactly as spoken. "
                                "Return ONLY the transcription text, nothing else."
                            ),
                        },
                        {
                            "type": "input_audio",
                            "input_audio": {"data": b64, "format": ext},
                        },
                    ],
                }],
            )
            return response.choices[0].message.content or ""
        except openai.APIError as e:
            logger.exception("OpenRouter audio transcription error")
            raise ValueError(f"Transcription failed: {e}") from e
