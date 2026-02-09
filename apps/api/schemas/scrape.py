"""Web scraping schemas."""

from apps.api.schemas.base import BaseSchema


class ScrapeRequest(BaseSchema):
    """Web scraping request."""

    url: str
    mode: str = "single"


class ScrapeResponse(BaseSchema):
    """Scraping result."""

    content: str
    title: str | None = None
    description: str | None = None
    images: list[str] = []
    screenshot: str | None = None
    logo: str | None = None
