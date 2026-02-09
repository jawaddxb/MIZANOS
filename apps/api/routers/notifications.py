"""Notifications router."""

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.notifications import MarkReadRequest, NotificationResponse
from apps.api.schemas.base import MessageResponse
from apps.api.services.notification_service import NotificationService

router = APIRouter()


def get_service(db: DbSession) -> NotificationService:
    return NotificationService(db)


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(
    user: CurrentUser,
    service: NotificationService = Depends(get_service),
) -> list[NotificationResponse]:
    return await service.get_for_user(user["id"])


@router.get("/unread/count")
async def unread_count(
    user: CurrentUser,
    service: NotificationService = Depends(get_service),
) -> dict[str, int]:
    count = await service.count_unread(user["id"])
    return {"count": count}


@router.post("/mark-read", response_model=MessageResponse)
async def mark_read(
    body: MarkReadRequest,
    user: CurrentUser,
    service: NotificationService = Depends(get_service),
) -> MessageResponse:
    await service.mark_as_read(body.notification_ids, user["id"])
    return MessageResponse(message="Notifications marked as read")


@router.post("/mark-all-read", response_model=MessageResponse)
async def mark_all_read(
    user: CurrentUser,
    service: NotificationService = Depends(get_service),
) -> MessageResponse:
    await service.mark_all_read(user["id"])
    return MessageResponse(message="All notifications marked as read")


@router.get("/preferences")
async def get_preferences(
    user: CurrentUser,
    service: NotificationService = Depends(get_service),
):
    return await service.get_preferences(user["id"])


@router.patch("/preferences")
async def update_preferences(
    body: dict,
    user: CurrentUser,
    service: NotificationService = Depends(get_service),
):
    return await service.update_preferences(user["id"], body)
