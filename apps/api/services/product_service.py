"""Product service."""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.product import Product
from apps.api.schemas.products import ProductCreate
from apps.api.services.base_service import BaseService


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
