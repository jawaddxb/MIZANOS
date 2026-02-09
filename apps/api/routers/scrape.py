"""Web scraping router (Firecrawl integration)."""

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.scrape import ScrapeRequest, ScrapeResponse
from apps.api.services.scrape_service import ScrapeService

router = APIRouter()


def get_service(db: DbSession) -> ScrapeService:
    return ScrapeService(db)


@router.post("", response_model=ScrapeResponse)
async def scrape_url(body: ScrapeRequest, user: CurrentUser = None, service: ScrapeService = Depends(get_service)):
    """Scrape a URL for content extraction."""
    return await service.scrape(body.url, body.mode)
