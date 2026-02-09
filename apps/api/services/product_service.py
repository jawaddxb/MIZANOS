"""Product service."""

from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.product import (
    Product,
    ProductManagementNote,
    ProductPartnerNote,
)
from apps.api.schemas.products import (
    ManagementNoteCreate,
    PartnerNoteCreate,
    ProductCreate,
)
from apps.api.services.base_service import BaseService
from packages.common.utils.error_handlers import not_found


class ProductService(BaseService[Product]):
    """Product-specific business logic."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Product, session)

    async def list_products(
        self,
        *,
        page: int = 1,
        page_size: int = 50,
        status: str | None = None,
        search: str | None = None,
    ) -> dict:
        """List products with filtering."""
        stmt = select(Product)

        if status:
            stmt = stmt.where(Product.status == status)
        if search:
            stmt = stmt.where(Product.name.ilike(f"%{search}%"))

        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.repo.session.execute(count_stmt)).scalar_one()

        # Paginate
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = await self.repo.session.execute(stmt)
        data = list(result.scalars().all())

        return {
            "data": data,
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    async def create_product(self, data: ProductCreate) -> Product:
        """Create a new product."""
        product = Product(**data.model_dump())
        return await self.repo.create(product)

    # --- Management Notes ---

    async def get_management_notes(
        self, product_id: UUID
    ) -> list[ProductManagementNote]:
        """List management notes for a product."""
        stmt = (
            select(ProductManagementNote)
            .where(ProductManagementNote.product_id == product_id)
            .order_by(
                ProductManagementNote.is_pinned.desc(),
                ProductManagementNote.created_at.desc(),
            )
        )
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all())

    async def create_management_note(
        self, product_id: UUID, data: ManagementNoteCreate
    ) -> ProductManagementNote:
        """Create a management note."""
        note = ProductManagementNote(
            product_id=product_id, **data.model_dump()
        )
        self.repo.session.add(note)
        await self.repo.session.flush()
        await self.repo.session.refresh(note)
        return note

    async def delete_management_note(self, note_id: UUID) -> None:
        """Delete a management note."""
        note = await self.repo.session.get(
            ProductManagementNote, note_id
        )
        if note is None:
            raise not_found("ProductManagementNote")
        await self.repo.session.delete(note)
        await self.repo.session.flush()

    async def toggle_management_note_pin(
        self, note_id: UUID
    ) -> ProductManagementNote:
        """Toggle the is_pinned flag on a management note."""
        note = await self.repo.session.get(
            ProductManagementNote, note_id
        )
        if note is None:
            raise not_found("ProductManagementNote")
        note.is_pinned = not note.is_pinned
        await self.repo.session.flush()
        await self.repo.session.refresh(note)
        return note

    # --- Partner Notes ---

    async def get_partner_notes(
        self, product_id: UUID
    ) -> list[ProductPartnerNote]:
        """List partner notes for a product."""
        stmt = (
            select(ProductPartnerNote)
            .where(ProductPartnerNote.product_id == product_id)
            .order_by(ProductPartnerNote.created_at.desc())
        )
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all())

    async def create_partner_note(
        self, product_id: UUID, data: PartnerNoteCreate
    ) -> ProductPartnerNote:
        """Create a partner note."""
        note = ProductPartnerNote(
            product_id=product_id, **data.model_dump()
        )
        self.repo.session.add(note)
        await self.repo.session.flush()
        await self.repo.session.refresh(note)
        return note

    async def delete_partner_note(self, note_id: UUID) -> None:
        """Delete a partner note."""
        note = await self.repo.session.get(
            ProductPartnerNote, note_id
        )
        if note is None:
            raise not_found("ProductPartnerNote")
        await self.repo.session.delete(note)
        await self.repo.session.flush()
