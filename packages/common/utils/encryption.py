"""Shared Fernet encryption helper."""

import base64
import hashlib

from cryptography.fernet import Fernet

from apps.api.config import settings


def get_fernet() -> Fernet:
    """Derive a valid Fernet key from the configured encryption key."""
    raw = settings.credential_encryption_key.encode()
    derived = hashlib.sha256(raw).digest()
    key = base64.urlsafe_b64encode(derived)
    return Fernet(key)
