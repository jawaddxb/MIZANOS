"""Google Cloud Storage service with local filesystem fallback."""

import json
import logging
import uuid as uuid_mod
from pathlib import Path

from apps.api.config import settings

logger = logging.getLogger(__name__)

_LOCAL_UPLOAD_DIR = Path("uploads")


def _get_gcs_client():
    """Lazily initialise GCS client.  Returns ``None`` when not configured."""
    if not settings.gcs_bucket_name:
        return None
    try:
        from google.cloud import storage  # noqa: WPS433

        if settings.gcs_credentials_json:
            info = json.loads(settings.gcs_credentials_json)
            return storage.Client.from_service_account_info(info)
        if settings.gcs_credentials_path:
            return storage.Client.from_service_account_json(
                settings.gcs_credentials_path
            )
        return storage.Client(project=settings.gcs_project_id)
    except Exception:
        logger.warning("GCS client init failed – using local fallback", exc_info=True)
        return None


class GCSStorageService:
    """Upload / download files to GCS or the local filesystem."""

    def __init__(self) -> None:
        self._client = _get_gcs_client()

    @property
    def is_gcs_available(self) -> bool:
        return self._client is not None and bool(settings.gcs_bucket_name)

    async def upload_file(
        self,
        content: bytes,
        destination_path: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        """Upload *content* and return the resulting file URL."""
        if self.is_gcs_available:
            return self._upload_to_gcs(content, destination_path, content_type)
        return self._upload_to_local(content, destination_path)

    def _upload_to_gcs(self, content: bytes, path: str, content_type: str) -> str:
        bucket = self._client.bucket(settings.gcs_bucket_name)
        blob = bucket.blob(path)
        blob.upload_from_string(content, content_type=content_type)
        return f"gs://{settings.gcs_bucket_name}/{path}"

    def _upload_to_local(self, content: bytes, path: str) -> str:
        dest = _LOCAL_UPLOAD_DIR / path
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(content)
        return f"/uploads/{path}"

    def generate_signed_url(self, file_path: str, expiration_minutes: int = 60) -> str:
        """Return a temporary download URL (signed for GCS, absolute for local)."""
        if not self.is_gcs_available:
            return f"{settings.api_base_url.rstrip('/')}{file_path}"
        from datetime import timedelta

        bucket = self._client.bucket(settings.gcs_bucket_name)
        blob = bucket.blob(file_path)
        return blob.generate_signed_url(expiration=timedelta(minutes=expiration_minutes))

    @staticmethod
    def build_source_path(product_id: str, file_name: str) -> str:
        """Convention: ``sources/{product_id}/{uuid8}_{original_name}``."""
        unique = uuid_mod.uuid4().hex[:8]
        safe_name = Path(file_name).name or "file.bin"
        return f"sources/{product_id}/{unique}_{safe_name}"
