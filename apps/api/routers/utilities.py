"""Utility endpoints (text extraction, etc.)."""

from fastapi import APIRouter, HTTPException, UploadFile

from apps.api.dependencies import CurrentUser
from apps.api.services.text_extraction_service import can_extract_text, extract_text

router = APIRouter()


@router.post("/extract-text")
async def extract_text_from_file(file: UploadFile, user: CurrentUser):
    """Extract text content from an uploaded PDF or DOCX file."""
    content_type = file.content_type or ""
    file_name = file.filename or "unknown"

    if not can_extract_text(content_type, file_name):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot extract text from {file_name} ({content_type}). "
            "Supported formats: PDF, DOCX.",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file")

    text = extract_text(file_bytes, file_name)
    if not text:
        raise HTTPException(
            status_code=422,
            detail="Could not extract any text from the file.",
        )

    return {"text": text, "file_name": file_name}
