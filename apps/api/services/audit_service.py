"""Audit service."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.audit import Audit
from apps.api.services.base_service import BaseService


class AuditService(BaseService[Audit]):
    """Audit business logic."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Audit, session)

    async def get_by_product(self, product_id: UUID) -> list[Audit]:
        stmt = (
            select(Audit)
            .where(Audit.product_id == product_id)
            .order_by(Audit.run_at.desc())
        )
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all())

    async def run_audit(self, product_id: UUID, user_id: str) -> Audit:
        """Run a new audit for a product.

        Currently creates a placeholder audit record. Full audit logic
        (QA scoring, repo analysis, compliance checks) is not yet implemented.
        """
        audit = Audit(
            product_id=product_id,
            created_by=user_id,
            overall_score=0,
            categories={"note": "Audit engine not yet implemented"},
            issues={"pending": "Full audit logic coming soon"},
        )
        return await self.repo.create(audit)

    async def compare(self, product_id: UUID) -> dict:
        """Compare the latest two audits for a product."""
        stmt = (
            select(Audit)
            .where(Audit.product_id == product_id)
            .order_by(Audit.run_at.desc())
            .limit(2)
        )
        result = await self.repo.session.execute(stmt)
        audits = list(result.scalars().all())

        if len(audits) == 0:
            return {
                "product_id": product_id,
                "current": None,
                "previous": None,
                "score_diff": 0,
                "categories_diff": {},
                "has_comparison": False,
            }

        current = audits[0]
        previous = audits[1] if len(audits) > 1 else None
        score_diff = 0.0
        categories_diff: dict = {}

        if previous:
            score_diff = current.overall_score - previous.overall_score
            all_keys = set(current.categories.keys()) | set(
                previous.categories.keys()
            )
            for key in all_keys:
                cur_val = current.categories.get(key)
                prev_val = previous.categories.get(key)
                if isinstance(cur_val, (int, float)) and isinstance(
                    prev_val, (int, float)
                ):
                    categories_diff[key] = cur_val - prev_val

        return {
            "product_id": product_id,
            "current": current,
            "previous": previous,
            "score_diff": score_diff,
            "categories_diff": categories_diff,
            "has_comparison": previous is not None,
        }
