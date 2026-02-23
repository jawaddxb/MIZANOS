"""seed ai org settings

Revision ID: 113092e3e8ea
Revises: b2c3d4e5f6a7
Create Date: 2026-02-24 00:00:00.000000
"""
import json
from typing import Sequence, Union
from uuid import uuid4

from alembic import op
import sqlalchemy as sa

revision: str = "113092e3e8ea"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_AI_MODEL_CONFIG = {
    "provider": "openrouter",
    "model": "anthropic/claude-sonnet-4",
    "fallback_model": "gpt-4o",
    "temperature": 0.7,
    "max_tokens": 4096,
}

_AI_SYSTEM_PROMPTS = {
    "chat": (
        "You are Mizan, an AI assistant for product lifecycle management. "
        "When the user's message contains instructions to return JSON, "
        "respond with ONLY valid JSON — no markdown fences, no explanation."
    ),
    "spec_generation_rules": (
        "IMPORTANT rules for the 'features' array:\n"
        "- Each feature 'name' must be concise (3-6 words). "
        "Do NOT cram details into the name.\n"
        "- Each feature 'description' MUST be unique and detailed "
        "(2-3 sentences explaining what it does, why it matters, "
        "and key implementation considerations).\n"
        "- Each feature 'acceptance_criteria' MUST contain 2-4 specific, "
        "testable criteria unique to that feature. "
        "Do NOT use generic criteria.\n"
        "- Each feature MUST have a 'priority' field "
        "(one of: 'high', 'medium', 'low').\n"
    ),
    "qa_check": (
        "Generate a QA checklist for a software product. "
        "Return ONLY a JSON array of objects with keys: title, category, description. "
        "Categories should be: functionality, performance, security, accessibility, ux. "
        "Generate 8-12 items. No markdown, just valid JSON array."
    ),
    "system_docs": {
        "functional_spec": (
            "You are a technical writer. Generate a comprehensive functional specification "
            "in Markdown format. Include: executive summary, feature catalog with descriptions, "
            "user stories, data models, user flows, API endpoints, business rules, and "
            "acceptance criteria. Base everything on the provided source material."
        ),
        "implementation_spec": (
            "You are a software architect. Generate an implementation specification "
            "in Markdown format. Include: architecture overview, technology stack analysis, "
            "code patterns and conventions, layer descriptions, data layer design, API "
            "structure, dependency map, and development guidelines. Base everything on the "
            "provided source material."
        ),
        "deployment_docs": (
            "You are a DevOps engineer. Generate deployment documentation "
            "in Markdown format. Include: prerequisites, setup guide, environment "
            "configuration, build and deploy steps, CI/CD pipeline recommendations, "
            "monitoring setup, scaling considerations, and troubleshooting guide. "
            "Base everything on the provided source material."
        ),
    },
}

org_settings = sa.table(
    "org_settings",
    sa.column("id", sa.dialects.postgresql.UUID),
    sa.column("key", sa.String),
    sa.column("value", sa.dialects.postgresql.JSONB),
    sa.column("updated_at", sa.DateTime(timezone=True)),
)


def upgrade() -> None:
    conn = op.get_bind()
    for key, value in (
        ("ai_model_config", _AI_MODEL_CONFIG),
        ("ai_system_prompts", _AI_SYSTEM_PROMPTS),
    ):
        exists = conn.execute(
            sa.select(org_settings.c.id).where(org_settings.c.key == key)
        ).first()
        if not exists:
            op.execute(
                org_settings.insert().values(
                    id=str(uuid4()),
                    key=key,
                    value=sa.type_coerce(value, sa.dialects.postgresql.JSONB),
                    updated_at=sa.func.now(),
                )
            )


def downgrade() -> None:
    op.execute(
        org_settings.delete().where(
            org_settings.c.key.in_(["ai_model_config", "ai_system_prompts"])
        )
    )
