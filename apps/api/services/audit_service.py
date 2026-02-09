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
