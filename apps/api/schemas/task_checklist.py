"""Task checklist schemas."""

from uuid import UUID

from pydantic import BaseModel


class ChecklistItemCreate(BaseModel):
    title: str
    assignee_id: UUID | None = None


class ChecklistItemUpdate(BaseModel):
    title: str | None = None
    is_checked: bool | None = None
    assignee_id: UUID | None = None
    sort_order: int | None = None


class ChecklistItemResponse(BaseModel):
    id: UUID
    task_id: UUID
    title: str
    is_checked: bool
    assignee_id: UUID | None
    assignee_name: str | None = None
    sort_order: int
    created_at: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_assignee(cls, item) -> "ChecklistItemResponse":
        return cls(
            id=item.id,
            task_id=item.task_id,
            title=item.title,
            is_checked=item.is_checked,
            assignee_id=item.assignee_id,
            assignee_name=item.assignee.full_name if item.assignee else None,
            sort_order=item.sort_order,
            created_at=item.created_at.isoformat(),
        )
