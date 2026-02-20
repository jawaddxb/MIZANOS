"""Web scraping router (Firecrawl integration)."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.scrape import ScrapeAnalyzeRequest, ScrapeAnalyzeResponse, ScrapeRequest, ScrapeResponse
from apps.api.services.scrape_service import ScrapeService

logger = logging.getLogger(__name__)

router = APIRouter()


def get_service(db: DbSession) -> ScrapeService:
    return ScrapeService(db)


@router.post("", response_model=ScrapeResponse)
async def scrape_url(
    body: ScrapeRequest,
    user: CurrentUser,
    service: ScrapeService = Depends(get_service),
):
    """Scrape a URL for content extraction."""
    try:
        return await service.scrape(body.url, body.mode)
    except ValueError as exc:
        logger.warning("Scrape failed for %s: %s", body.url, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected scrape error for %s", body.url)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while scraping the website",
        ) from exc


@router.post("/analyze", response_model=ScrapeAnalyzeResponse)
async def analyze_scraped_content(
    body: ScrapeAnalyzeRequest,
    user: CurrentUser,
    service: ScrapeService = Depends(get_service),
):
    """Analyze scraped content to extract structured product info."""
    try:
        return await service.analyze_content(body.content, body.url)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Analysis failed for %s", body.url)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze scraped content",
        ) from exc
