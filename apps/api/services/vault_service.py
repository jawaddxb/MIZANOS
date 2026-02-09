"""Vault service with credential encryption."""

import base64
import hashlib
from uuid import UUID

from cryptography.fernet import Fernet
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.config import settings
from apps.api.models.vault import CompanyCredential
from apps.api.schemas.vault import CredentialCreate, CredentialUpdate
from apps.api.services.base_service import BaseService


def _get_fernet() -> Fernet:
    """Derive a valid Fernet key from the configured encryption key."""
    raw = settings.credential_encryption_key.encode()
    # Derive a 32-byte key via SHA-256, then base64-encode for Fernet
    derived = hashlib.sha256(raw).digest()
    key = base64.urlsafe_b64encode(derived)
    return Fernet(key)


class VaultService(BaseService[CompanyCredential]):
    """Credential vault with encryption."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(CompanyCredential, session)

    async def list_credentials(self, *, category: str | None = None) -> list[CompanyCredential]:
        stmt = select(CompanyCredential)
        if category:
            stmt = stmt.where(CompanyCredential.category == category)
        stmt = stmt.order_by(CompanyCredential.label)
        result = await self.repo.session.execute(stmt)
        creds = list(result.scalars().all())
        for cred in creds:
            self._decrypt_fields(cred)
        return creds

    async def create_credential(self, data: CredentialCreate, user_id: str) -> CompanyCredential:
        fields = data.model_dump()
        mapped = self._map_and_encrypt(fields)
        cred = CompanyCredential(
            **mapped,
            created_by=user_id,
        )
        return await self.repo.create(cred)

    async def update_credential(
        self, cred_id: UUID, data: CredentialUpdate, user_id: str
    ) -> CompanyCredential:
        updates = data.model_dump(exclude_unset=True)
        mapped = self._map_and_encrypt(updates)
        mapped["last_modified_by"] = user_id
        return await self.repo.update(
            await self.get_or_404(cred_id), mapped
        )

    _SENSITIVE_MAP = {
        "username": "username_encrypted",
        "email": "email_encrypted",
        "password": "password_encrypted",
        "api_secret": "api_secret_encrypted",
        "notes": "notes_encrypted",
    }

    def _map_and_encrypt(self, fields: dict) -> dict:
        """Map schema field names to _encrypted columns and encrypt values."""
        f = _get_fernet()
        result: dict = {}
        for key, value in fields.items():
            if key in self._SENSITIVE_MAP:
                mapped_key = self._SENSITIVE_MAP[key]
                if value is not None:
                    result[mapped_key] = f.encrypt(str(value).encode()).decode()
                else:
                    result[mapped_key] = None
            else:
                result[key] = value
        return result

    @staticmethod
    def _decrypt_fields(cred: CompanyCredential) -> None:
        """Decrypt encrypted columns in-place for API responses."""
        f = _get_fernet()
        for col_name in VaultService._SENSITIVE_MAP.values():
            val = getattr(cred, col_name, None)
            if val is not None:
                try:
                    decrypted = f.decrypt(val.encode()).decode()
                    setattr(cred, col_name, decrypted)
                except Exception:
                    pass  # Already plaintext (legacy data) — leave as-is
