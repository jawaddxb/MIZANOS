"""Product notification settings schemas."""

from uuid import UUID

from apps.api.schemas.base import BaseSchema


class ProductNotificationSettingResponse(BaseSchema):
    """Product notification setting response."""

    product_id: UUID
    email_enabled: bool


class ProductNotificationSettingUpdate(BaseSchema):
    """Product notification setting update."""

    email_enabled: bool
