"""AI specification generation service."""

import json
import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.config import settings
from apps.api.models.product import Product
from apps.api.models.specification import (
    Specification,
    SpecificationFeature,
    SpecificationSource,
)
from apps.api.services.spec_source_context import (
    build_source_context,
    build_spec_prompt,
    parse_spec_response,
)
from apps.api.services.specification_service import SpecificationService

logger = logging.getLogger(__name__)


class SpecGenerationService:
    """Handles AI-powered specification generation."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self._spec_service = SpecificationService(session)

    async def generate_specification(
        self, product_id: UUID, custom_instructions: str | None = None,
    ) -> dict:
        """Generate specification using AI, incorporating saved sources."""
        product_result = await self.session.execute(
            select(Product).where(Product.id == product_id)
        )
        product = product_result.scalar_one_or_none()
        product_name = product.name if product else "Untitled Project"
        pillar = getattr(product, "pillar", None)

        sources_result = await self.session.execute(
            select(SpecificationSource).where(
                SpecificationSource.product_id == product_id
            )
        )
        sources = list(sources_result.scalars().all())

        context = build_source_context(sources, product_name, pillar)
        prompt = build_spec_prompt(product_name, context, custom_instructions)

        try:
            spec_data = await self._call_ai(prompt)
            return await self._save_spec(
                product_id, spec_data, custom_instructions
            )
        except HTTPException:
            raise
        except json.JSONDecodeError:
            logger.exception("Failed to parse LLM response as JSON")
            raise HTTPException(
                status_code=502,
                detail="AI returned invalid JSON. Please try again.",
            )
        except Exception:
            logger.exception("Specification generation failed")
            raise HTTPException(
                status_code=502,
                detail="Specification generation failed. Please try again.",
            )

    async def _call_ai(self, prompt: str) -> dict:
        """Send prompt to LLM and parse response."""
        import openai

        api_key = settings.openrouter_api_key or settings.openai_api_key
        if not api_key:
            raise HTTPException(
                status_code=400,
                detail="No AI API key configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY.",
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

        client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)
        response = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
        )

        content = response.choices[0].message.content or "{}"
        return parse_spec_response(content)

    async def _save_spec(
        self,
        product_id: UUID,
        spec_data: dict,
        custom_instructions: str | None,
    ) -> dict:
        """Persist spec and feature rows, return response dict."""
        existing = await self._spec_service.get_by_product(product_id)
        next_version = (existing[0].version + 1) if existing else 1

        spec = Specification(
            product_id=product_id,
            content=spec_data,
            version=next_version,
            custom_instructions=custom_instructions,
        )
        self.session.add(spec)
        await self.session.flush()
        await self.session.refresh(spec)

        raw_features = spec_data.get("features", [])
        for idx, feat in enumerate(raw_features):
            if isinstance(feat, dict):
                name = feat.get("name") or feat.get("title") or str(feat)
                desc = feat.get("description")
                criteria = feat.get("acceptance_criteria")
                priority = feat.get("priority", "medium")
            else:
                name = str(feat)
                desc = None
                criteria = None
                priority = "medium"

            feature = SpecificationFeature(
                product_id=product_id,
                specification_id=spec.id,
                name=name,
                description=desc,
                acceptance_criteria=criteria,
                priority=priority,
                sort_order=idx,
            )
            self.session.add(feature)
        await self.session.flush()

        return {
            "message": "Specification generated",
            "product_id": str(product_id),
            "specification_id": str(spec.id),
            "content": spec_data,
        }
