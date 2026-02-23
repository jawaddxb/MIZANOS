"""Build prompt context and parse responses for specification generation."""

import json

_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg"}

_SPEC_FORMAT = {
    "summary": "High-level product summary",
    "functionalSpec": {
        "userStories": ["As a [user], I want [goal] so that [benefit]"],
        "businessRules": ["Rule describing business logic"],
        "acceptanceCriteria": ["Testable acceptance criterion"],
    },
    "technicalSpec": {
        "architecture": "Description of system architecture",
        "dataModels": ["Model/entity description"],
        "integrations": ["External service or API integration"],
        "nonFunctionalRequirements": [
            "Performance, security, or scalability requirement"
        ],
    },
    "features": [
        {
            "name": "Feature name",
            "description": "What this feature does and why it matters",
            "acceptance_criteria": ["Criterion 1", "Criterion 2"],
        }
    ],
    "techStack": ["Technology name"],
    "qaChecklist": ["QA test or check item"],
}


def _is_image_source(src) -> bool:
    """Check if a source is an image file."""
    if src.file_name:
        ext = "." + src.file_name.rsplit(".", 1)[-1].lower() if "." in src.file_name else ""
        if ext in _IMAGE_EXTENSIONS:
            return True
    return False


def build_source_context(
    sources: list,
    product_name: str,
    pillar: str | None,
) -> tuple[str, list[str]]:
    """Build context string and image file paths from saved sources.

    Returns (text_context, image_file_paths).
    """
    parts: list[str] = []
    image_paths: list[str] = []

    for src in sources:
        source_type = src.source_type or "unknown"
        header = f"[{source_type.upper()} SOURCE]"

        if source_type == "website" and src.url:
            header = f"[WEBSITE: {src.url}]"
            lines = [header]
            if src.ai_summary:
                summary = src.ai_summary
                if isinstance(summary, dict):
                    for k, v in summary.items():
                        lines.append(f"  {k}: {v}")
                else:
                    lines.append(f"  Summary: {summary}")
            if src.branding and isinstance(src.branding, dict):
                for k, v in src.branding.items():
                    lines.append(f"  Branding {k}: {v}")
            if src.raw_content:
                lines.append(src.raw_content[:2000])
            parts.append("\n".join(lines))

        elif source_type in ("paste", "markdown"):
            lines = [header]
            if src.raw_content:
                lines.append(src.raw_content[:2000])
            parts.append("\n".join(lines))

        elif source_type == "document":
            if _is_image_source(src) and src.file_url and not src.raw_content:
                image_paths.append(src.file_url)
                parts.append(f"[IMAGE: {src.file_name or 'image'}]")
            else:
                lines = [header]
                if src.file_name:
                    lines.append(f"File: {src.file_name}")
                if src.raw_content:
                    lines.append(src.raw_content[:2000])
                parts.append("\n".join(lines))

        elif source_type == "audio":
            lines = [header]
            if src.transcription:
                lines.append(f"Transcription: {src.transcription[:2000]}")
            parts.append("\n".join(lines))

        else:
            lines = [header]
            if src.url:
                lines.append(f"URL: {src.url}")
            if src.raw_content:
                lines.append(src.raw_content[:2000])
            if src.transcription:
                lines.append(f"Transcription: {src.transcription[:2000]}")
            parts.append("\n".join(lines))

    source_block = "\n\n".join(parts) if parts else "(no source material)"
    text_context = (
        f"Project: {product_name}\n"
        f"Pillar: {pillar or 'N/A'}\n\n"
        f"Source Material:\n{source_block}"
    )
    return text_context, image_paths


def build_spec_prompt(
    product_name: str,
    context: str,
    custom_instructions: str | None = None,
    has_images: bool = False,
) -> str:
    """Build the LLM prompt for spec generation."""
    spec_format = json.dumps(_SPEC_FORMAT)
    instruction_block = ""
    if custom_instructions:
        instruction_block = (
            f"\n\nCustom Instructions from the user:\n{custom_instructions}\n"
        )
    image_block = ""
    if has_images:
        image_block = (
            "\n\nThe attached images are uploaded source documents. "
            "Analyze their content and incorporate relevant details "
            "into the specification.\n"
        )
    return (
        f'Generate a detailed product specification for "{product_name}".\n\n'
        f"{context}"
        f"{instruction_block}"
        f"{image_block}\n\n"
        "Respond ONLY with valid JSON (no markdown, no code fences) "
        f"in this exact format:\n{spec_format}"
    )


def parse_spec_response(content: str) -> dict:
    """Parse LLM response JSON with fallback defaults."""
    raw = json.loads(content)
    return {
        "summary": raw.get("summary", ""),
        "functionalSpec": raw.get("functionalSpec", {
            "userStories": [], "businessRules": [], "acceptanceCriteria": [],
        }),
        "technicalSpec": raw.get("technicalSpec", {
            "architecture": "", "dataModels": [], "integrations": [],
            "nonFunctionalRequirements": [],
        }),
        "features": raw.get("features", []),
        "techStack": raw.get("techStack", []),
        "qaChecklist": raw.get("qaChecklist", []),
    }
