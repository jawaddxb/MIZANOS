"""API key service — create, authenticate, manage."""

import hashlib
import secrets
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.api_key import ApiKey
from packages.common.utils.encryption import get_fernet
from packages.common.utils.error_handlers import not_found

KEY_PREFIX = "mizan_key_"


class ApiKeyService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_key(self, label: str, profile_id: UUID) -> tuple[ApiKey, str]:
        """Generate a new API key. Returns (model, raw_key). Raw key shown once."""
        raw_key = KEY_PREFIX + secrets.token_hex(32)
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        key_encrypted = get_fernet().encrypt(raw_key.encode()).decode()
        key_prefix = raw_key[:18]

        api_key = ApiKey(
            label=label,
            key_hash=key_hash,
            key_encrypted=key_encrypted,
            key_prefix=key_prefix,
            created_by=profile_id,
            is_active=True,
        )
        self.session.add(api_key)
        await self.session.flush()
        await self.session.refresh(api_key)
        return api_key, raw_key

    async def authenticate_by_key(self, raw_key: str) -> ApiKey | None:
        """Look up an active API key by hash. Updates last_used_at."""
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        stmt = select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active == True)  # noqa: E712
        result = await self.session.execute(stmt)
        api_key = result.scalar_one_or_none()
        if api_key:
            api_key.last_used_at = datetime.now(timezone.utc)
            await self.session.flush()
        return api_key

    async def list_keys(self, profile_id: UUID) -> list[ApiKey]:
        stmt = (
            select(ApiKey)
            .where(ApiKey.created_by == profile_id)
            .order_by(ApiKey.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_key(self, key_id: UUID, label: str | None = None, is_active: bool | None = None) -> ApiKey:
        api_key = await self.session.get(ApiKey, key_id)
        if not api_key:
            not_found("API Key")
        if label is not None:
            api_key.label = label
        if is_active is not None:
            api_key.is_active = is_active
        await self.session.flush()
        await self.session.refresh(api_key)
        return api_key

    async def reveal_key(self, key_id: UUID) -> str:
        """Decrypt and return the raw API key."""
        api_key = await self.session.get(ApiKey, key_id)
        if not api_key:
            not_found("API Key")
        return get_fernet().decrypt(api_key.key_encrypted.encode()).decode()

    async def delete_key(self, key_id: UUID) -> None:
        api_key = await self.session.get(ApiKey, key_id)
        if not api_key:
            not_found("API Key")
        await self.session.delete(api_key)
        await self.session.flush()
