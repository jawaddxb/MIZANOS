"""Specification service."""

import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.product import Product
from apps.api.models.specification import Specification, SpecificationFeature
from apps.api.models.task import Task
from apps.api.schemas.specifications import (
    ImportFeatureRequest,
    SpecFeatureCreate,
    SpecificationCreate,
)
from apps.api.services.base_service import BaseService
from apps.api.services.task_description_builder import build_task_description
from packages.common.utils.error_handlers import not_found

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

    async def get_library_features(self) -> list[dict]:
        """Get all reusable features with product names and import counts."""
        stmt = (
            select(
                SpecificationFeature,
                Product.name.label("product_name"),
                func.count(SpecificationFeature.id)
                .filter(
                    SpecificationFeature.source_feature_id
                    == SpecificationFeature.id
                )
                .label("import_count"),
            )
            .join(Product, SpecificationFeature.product_id == Product.id)
            .where(SpecificationFeature.is_reusable.is_(True))
            .group_by(SpecificationFeature.id, Product.name)
            .order_by(SpecificationFeature.reusable_category)
        )
        result = await self.repo.session.execute(stmt)
        rows = result.all()

        features = []
        for feature, product_name, _ in rows:
            # Count imports separately for accuracy
            count_stmt = select(func.count()).where(
                SpecificationFeature.source_feature_id == feature.id
            )
            count_result = await self.repo.session.execute(count_stmt)
            import_count = count_result.scalar_one()

            feature_dict = {
                "id": feature.id,
                "name": feature.name,
                "description": feature.description,
                "priority": feature.priority,
                "acceptance_criteria": feature.acceptance_criteria,
                "is_reusable": feature.is_reusable,
                "reusable_category": feature.reusable_category,
                "github_path": feature.github_path,
                "sort_order": feature.sort_order,
                "specification_id": feature.specification_id,
                "product_id": feature.product_id,
                "task_id": feature.task_id,
                "source_feature_id": feature.source_feature_id,
                "source_product_id": feature.source_product_id,
                "created_at": feature.created_at,
                "product_name": product_name,
                "import_count": import_count,
            }
            features.append(feature_dict)
        return features

    async def mark_feature_reusable(
        self, feature_id: UUID, reusable_category: str
    ) -> SpecificationFeature:
        """Mark a feature as reusable with a category."""
        feature = await self._get_feature_or_404(feature_id)
        feature.is_reusable = True
        feature.reusable_category = reusable_category
        await self.repo.session.flush()
        await self.repo.session.refresh(feature)
        return feature

    async def import_feature(
        self, feature_id: UUID, data: ImportFeatureRequest
    ) -> SpecificationFeature:
        """Copy a reusable feature to a target product."""
        source = await self._get_feature_or_404(feature_id)
        imported = SpecificationFeature(
            product_id=data.target_product_id,
            specification_id=data.target_specification_id,
            name=source.name,
            description=source.description,
            status=source.status,
            priority=source.priority,
            sort_order=0,
            acceptance_criteria=source.acceptance_criteria,
            source_feature_id=source.id,
            source_product_id=source.product_id,
        )
        self.repo.session.add(imported)
        await self.repo.session.flush()
        await self.repo.session.refresh(imported)
        return imported

    async def get_import_count(self, feature_id: UUID) -> int:
        """Count how many features were imported from this feature."""
        stmt = select(func.count()).where(
            SpecificationFeature.source_feature_id == feature_id
        )
        result = await self.repo.session.execute(stmt)
        return result.scalar_one()

    async def queue_feature(self, feature_id: UUID) -> SpecificationFeature:
        """Create a task from feature data and link it."""
        feature = await self._get_feature_or_404(feature_id)
        spec_content = await self._get_spec_content(feature.specification_id)
        description = build_task_description(feature, spec_content)
        task = Task(
            product_id=feature.product_id,
            title=feature.name,
            description=description,
            status="todo",
            priority=feature.priority,
            pillar="development",
            is_draft=True,
            generation_source="specification",
        )
        self.repo.session.add(task)
        await self.repo.session.flush()
        await self.repo.session.refresh(task)

        feature.task_id = task.id
        await self.repo.session.flush()
        await self.repo.session.refresh(feature)
        return feature

    async def unqueue_feature(
        self, feature_id: UUID
    ) -> SpecificationFeature:
        """Remove task link from feature."""
        feature = await self._get_feature_or_404(feature_id)
        feature.task_id = None
        await self.repo.session.flush()
        await self.repo.session.refresh(feature)
        return feature

    async def _get_feature_or_404(
        self, feature_id: UUID
    ) -> SpecificationFeature:
        """Fetch a feature by ID or raise 404."""
        result = await self.repo.session.get(
            SpecificationFeature, feature_id
        )
        if result is None:
            raise not_found("SpecificationFeature")
        return result

    async def _get_spec_content(
        self, spec_id: UUID | None
    ) -> dict | None:
        """Fetch spec content dict for task description building."""
        if not spec_id:
            return None
        spec = await self.repo.session.get(Specification, spec_id)
        return spec.content if spec else None

    async def generate_tasks_from_spec(self, product_id: UUID) -> list:
        """Create tasks from the latest specification's features."""
        specs = await self.get_by_product(product_id)
        if not specs:
            raise HTTPException(
                status_code=400,
                detail="No specification found. Generate a spec first.",
            )

        latest_spec = specs[0]
        features = await self._get_or_create_features(latest_spec)

        if not features:
            raise HTTPException(
                status_code=400,
                detail="No features found in specification.",
            )

        spec_content = latest_spec.content
        tasks: list[Task] = []
        for feature in features:
            description = build_task_description(feature, spec_content)
            task = Task(
                product_id=product_id,
                title=feature.name,
                description=description,
                status="backlog",
                priority=feature.priority or "medium",
                pillar="development",
                generation_source="specification",
                is_draft=True,
            )
            self.repo.session.add(task)
            tasks.append(task)

        await self.repo.session.flush()
        for i, task in enumerate(tasks):
            await self.repo.session.refresh(task)
            if i < len(features):
                features[i].task_id = task.id

        await self.repo.session.flush()
        return tasks

    async def _get_or_create_features(
        self, spec: Specification
    ) -> list[SpecificationFeature]:
        """Get feature rows, creating them from spec content if missing."""
        stmt = (
            select(SpecificationFeature)
            .where(SpecificationFeature.specification_id == spec.id)
            .order_by(SpecificationFeature.sort_order)
        )
        result = await self.repo.session.execute(stmt)
        features = list(result.scalars().all())
        if features:
            return features

        raw = (spec.content or {}).get("features", [])
        if not raw:
            return []

        for idx, feat in enumerate(raw):
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
                product_id=spec.product_id,
                specification_id=spec.id,
                name=name,
                description=desc,
                acceptance_criteria=criteria,
                priority=priority,
                sort_order=idx,
            )
            self.repo.session.add(feature)
            features.append(feature)

        await self.repo.session.flush()
        return features

