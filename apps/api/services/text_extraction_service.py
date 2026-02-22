"""Text extraction from binary documents (PDF, DOCX)."""

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

EXTRACTABLE_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def can_extract_text(content_type: str, file_name: str) -> bool:
    """Return ``True`` when text can be extracted from this file type."""
    name_lower = file_name.lower()
    return (
        content_type in EXTRACTABLE_TYPES
        or name_lower.endswith(".pdf")
        or name_lower.endswith(".docx")
    )


def extract_text(content: bytes, file_name: str) -> str:
    """Extract text from PDF or DOCX bytes.  Returns ``""`` on failure."""
    name_lower = file_name.lower()
    try:
        if name_lower.endswith(".pdf"):
            return _extract_pdf(content)
        if name_lower.endswith(".docx"):
            return _extract_docx(content)
    except Exception:
        logger.warning("Text extraction failed for %s", file_name, exc_info=True)
    return ""


def _extract_pdf(content: bytes) -> str:
    import io

    import pdfplumber  # noqa: WPS433

    pages: list[str] = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
    return "\n\n".join(pages)


def _extract_docx(content: bytes) -> str:
    import io

    from docx import Document  # noqa: WPS433

    doc = Document(io.BytesIO(content))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)
