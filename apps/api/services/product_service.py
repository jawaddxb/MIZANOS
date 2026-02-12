"""Product service."""

from uuid import UUID

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.product import (
    Product,
    ProductEnvironment,
    ProductManagementNote,
    ProductMember,
    ProductPartnerNote,
)
from apps.api.schemas.products import (
    ManagementNoteCreate,
    PartnerNoteCreate,
    ProductCreate,
)
from apps.api.services.base_service import BaseService
from apps.api.services.product_constants import CHILD_TABLES_BY_PRODUCT_ID
from packages.common.utils.error_handlers import not_found


class ProductService(BaseService[Product]):
    """Product-specific business logic."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Product, session)

    async def delete(self, entity_id: UUID) -> None:
        """Delete a product and all child records.

        All 30 FK constraints on `products` use NO ACTION, so we must
        explicitly remove child rows before deleting the product itself.
        """
        product = await self.get_or_404(entity_id)
        session = self.repo.session
        pid = {"pid": product.id}

        for table in CHILD_TABLES_BY_PRODUCT_ID:
            await session.execute(
                text(f"DELETE FROM {table} WHERE product_id = :pid"), pid
            )

        # company_credentials uses linked_product_id instead of product_id
        await session.execute(
            text("DELETE FROM company_credentials WHERE linked_product_id = :pid"),
            pid,
        )

        await self.repo.delete(product)

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

    async def get_members(self, product_id: UUID) -> list[ProductMember]:
        """List members for a product."""
        stmt = (
            select(ProductMember)
            .where(ProductMember.product_id == product_id)
            .order_by(ProductMember.created_at.desc())
        )
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all())

    async def get_environments(
        self, product_id: UUID
    ) -> list[ProductEnvironment]:
        """List environments for a product."""
        stmt = (
            select(ProductEnvironment)
            .where(ProductEnvironment.product_id == product_id)
            .order_by(ProductEnvironment.created_at.desc())
        )
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all())

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

    # --- Environments ---

    async def upsert_environment(
        self, product_id: UUID, data
    ) -> ProductEnvironment:
        """Find-or-create environment by product_id + environment_type."""
        stmt = (
            select(ProductEnvironment)
            .where(
                ProductEnvironment.product_id == product_id,
                ProductEnvironment.environment_type == data.environment_type,
            )
        )
        result = await self.repo.session.execute(stmt)
        env = result.scalar_one_or_none()

        update_fields = data.model_dump(exclude_unset=True, exclude={"environment_type"})

        if env:
            for key, value in update_fields.items():
                setattr(env, key, value)
        else:
            env = ProductEnvironment(
                product_id=product_id,
                environment_type=data.environment_type,
                **update_fields,
            )
            self.repo.session.add(env)

        await self.repo.session.flush()
        await self.repo.session.refresh(env)
        return env

    async def delete_environment(
        self, product_id: UUID, env_type: str
    ) -> None:
        """Delete environment by product_id + environment_type."""
        stmt = (
            select(ProductEnvironment)
            .where(
                ProductEnvironment.product_id == product_id,
                ProductEnvironment.environment_type == env_type,
            )
        )
        result = await self.repo.session.execute(stmt)
        env = result.scalar_one_or_none()
        if not env:
            raise not_found("ProductEnvironment")
        await self.repo.session.delete(env)
        await self.repo.session.flush()

    # --- Specification Features & Sources ---

    async def get_specification_features(self, product_id: UUID) -> list:
        from apps.api.models.specification import SpecificationFeature
        stmt = (
            select(SpecificationFeature)
            .where(SpecificationFeature.product_id == product_id)
            .order_by(SpecificationFeature.sort_order)
        )
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all())

    async def get_specification_sources(self, product_id: UUID) -> list:
        from apps.api.models.specification import SpecificationSource
        stmt = (
            select(SpecificationSource)
            .where(SpecificationSource.product_id == product_id)
            .order_by(SpecificationSource.created_at.desc())
        )
        result = await self.repo.session.execute(stmt)
        return list(result.scalars().all())

    async def create_specification_source(self, product_id: UUID, data) -> object:
        from apps.api.models.specification import SpecificationSource
        source = SpecificationSource(
            product_id=product_id,
            **data.model_dump(exclude_unset=True),
        )
        self.repo.session.add(source)
        await self.repo.session.flush()
        await self.repo.session.refresh(source)
        return source

    async def delete_specification_source(self, source_id: UUID) -> None:
        from apps.api.models.specification import SpecificationSource
        stmt = select(SpecificationSource).where(SpecificationSource.id == source_id)
        result = await self.repo.session.execute(stmt)
        source = result.scalar_one_or_none()
        if not source:
            raise not_found("SpecificationSource")
        await self.repo.session.delete(source)
        await self.repo.session.flush()
