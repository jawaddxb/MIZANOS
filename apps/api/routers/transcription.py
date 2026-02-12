"""Audio transcription router."""

from fastapi import APIRouter, HTTPException, UploadFile

from apps.api.dependencies import CurrentUser
from apps.api.services.transcription_service import TranscriptionService

router = APIRouter()


@router.post("")
async def transcribe_audio(file: UploadFile, user: CurrentUser = None):
    """Transcribe an uploaded audio file using OpenAI Whisper."""
    content_type = file.content_type or ""
    if not content_type.startswith("audio/"):
        raise HTTPException(
            status_code=400,
            detail=f"Expected audio file, got {content_type}",
        )

    try:
        service = TranscriptionService()
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    try:
        text = await service.transcribe(audio_bytes, file.filename or "audio.webm")
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    return {"transcription": text}
