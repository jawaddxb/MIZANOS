"""Deployment checklist service."""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.deployment import DeploymentChecklistItem
from packages.common.utils.error_handlers import not_found

DEFAULT_CHECKLIST = [
    {"item_key": "repo_setup", "title": "Repository setup", "category": "infrastructure"},
    {"item_key": "ci_cd", "title": "CI/CD pipeline configured", "category": "infrastructure"},
    {"item_key": "env_vars", "title": "Environment variables set", "category": "infrastructure"},
    {"item_key": "domain_dns", "title": "Domain & DNS configured", "category": "infrastructure"},
    {"item_key": "ssl_cert", "title": "SSL certificate active", "category": "security"},
    {"item_key": "auth_setup", "title": "Authentication configured", "category": "security"},
    {"item_key": "monitoring", "title": "Monitoring & alerts", "category": "operations"},
    {"item_key": "backup", "title": "Backup strategy", "category": "operations"},
    {"item_key": "docs", "title": "Documentation complete", "category": "quality"},
    {"item_key": "qa_pass", "title": "QA sign-off", "category": "quality"},
]


class ChecklistService:
    """Deployment checklist business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_checklist(
        self, product_id: UUID
    ) -> list[DeploymentChecklistItem]:
        stmt = (
            select(DeploymentChecklistItem)
            .where(DeploymentChecklistItem.product_id == product_id)
            .order_by(DeploymentChecklistItem.order_index)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def seed_checklist(self, product_id: UUID) -> list[DeploymentChecklistItem]:
        existing = await self.get_checklist(product_id)
        if existing:
            return existing
        items = []
        for idx, item_data in enumerate(DEFAULT_CHECKLIST):
            item = DeploymentChecklistItem(
                product_id=product_id,
                order_index=idx,
                **item_data,
            )
            self.session.add(item)
            items.append(item)
        await self.session.flush()
        for item in items:
            await self.session.refresh(item)
        return items

    async def update_item(
        self, item_id: UUID, data: dict
    ) -> DeploymentChecklistItem:
        item = await self.session.get(DeploymentChecklistItem, item_id)
        if not item:
            raise not_found("DeploymentChecklistItem")
        for key, value in data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        if "is_checked" in data and data["is_checked"]:
            item.checked_at = datetime.now(timezone.utc)
        await self.session.flush()
        await self.session.refresh(item)
        return item
