"""Build prompt context and parse responses for specification generation."""

import json


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
    "features": ["Feature name or description"],
    "techStack": ["Technology name"],
    "qaChecklist": ["QA test or check item"],
}


def build_source_context(
    sources: list,
    product_name: str,
    pillar: str | None,
) -> str:
    """Build a context string from saved specification sources."""
    parts: list[str] = []
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
    return (
        f"Project: {product_name}\n"
        f"Pillar: {pillar or 'N/A'}\n\n"
        f"Source Material:\n{source_block}"
    )


def build_spec_prompt(product_name: str, context: str) -> str:
    """Build the LLM prompt for spec generation."""
    spec_format = json.dumps(_SPEC_FORMAT)
    return (
        f'Generate a detailed product specification for "{product_name}".\n\n'
        f"{context}\n\n"
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
