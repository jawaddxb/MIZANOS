"""Specification service."""

import json
import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.config import settings
from apps.api.models.specification import Specification, SpecificationFeature
from apps.api.schemas.specifications import SpecFeatureCreate, SpecificationCreate
from apps.api.services.base_service import BaseService

logger = logging.getLogger(__name__)


class SpecificationService(BaseService[Specification]):
    """Specification business logic."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Specification, session)

    async def get_by_product(self, product_id: UUID) -> list[Specification]:
        stmt = (
            select(Specification)
            .where(Specification.product_id == product_id)
            .order_by(Specification.version.desc())
        )
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all())

    async def create_spec(self, data: SpecificationCreate) -> Specification:
        spec = Specification(**data.model_dump())
        return await self.repo.create(spec)

    async def get_features(self, spec_id: UUID) -> list[SpecificationFeature]:
        stmt = (
            select(SpecificationFeature)
            .where(SpecificationFeature.specification_id == spec_id)
            .order_by(SpecificationFeature.sort_order)
        )
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all())

    async def create_feature(self, data: SpecFeatureCreate) -> SpecificationFeature:
        feature = SpecificationFeature(**data.model_dump())
        self.repo.session.add(feature)
        await self.repo.session.flush()
        await self.repo.session.refresh(feature)
        return feature

    async def generate_specification(self, product_id: UUID) -> dict:
        """Generate specification using AI."""
        prompt = (
            "Generate a product specification. "
            "Return ONLY valid JSON with keys: summary (string), features (array of strings), "
            "techStack (array of strings), qaChecklist (array of strings). No markdown."
        )

        try:
            import openai

            api_key = settings.openrouter_api_key or settings.openai_api_key
            if not api_key:
                raise HTTPException(
                    status_code=400,
                    detail="No AI API key configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY.",
                )

            base_url = "https://openrouter.ai/api/v1" if settings.openrouter_api_key else None
            model = "anthropic/claude-sonnet-4" if settings.openrouter_api_key else "gpt-4o"

            client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)
            response = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
            )

            content = response.choices[0].message.content or "{}"
            spec_data = json.loads(content)

            # Determine next version
            existing = await self.get_by_product(product_id)
            next_version = (existing[0].version + 1) if existing else 1

            spec = Specification(
                product_id=product_id,
                content=spec_data,
                version=next_version,
            )
            self.repo.session.add(spec)
            await self.repo.session.flush()
            await self.repo.session.refresh(spec)

            return {
                "message": "Specification generated",
                "product_id": str(product_id),
                "specification_id": str(spec.id),
                "content": spec_data,
            }

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
