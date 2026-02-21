"""Product notification settings router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.product_notification_settings import (
    ProductNotificationSettingResponse,
    ProductNotificationSettingUpdate,
)
from apps.api.services.product_notification_service import (
    ProductNotificationSettingService,
)

router = APIRouter()


def get_service(db: DbSession) -> ProductNotificationSettingService:
    return ProductNotificationSettingService(db)


@router.get(
    "/{product_id}/notification-settings",
    response_model=ProductNotificationSettingResponse,
)
async def get_notification_settings(
    product_id: UUID,
    user: CurrentUser,
    service: ProductNotificationSettingService = Depends(get_service),
):
    return await service.get_setting(product_id)


@router.patch(
    "/{product_id}/notification-settings",
    response_model=ProductNotificationSettingResponse,
)
async def update_notification_settings(
    product_id: UUID,
    body: ProductNotificationSettingUpdate,
    user: CurrentUser,
    service: ProductNotificationSettingService = Depends(get_service),
):
    return await service.update_setting(
        product_id, body.email_enabled, user
    )
