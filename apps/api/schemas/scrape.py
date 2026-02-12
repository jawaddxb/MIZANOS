"""Web scraping schemas."""

from apps.api.schemas.base import BaseSchema


class ScrapeRequest(BaseSchema):
    """Web scraping request."""

    url: str
    mode: str = "single"


class ExtractedDomainInfo(BaseSchema):
    """Domain info extracted from URL."""

    domain: str
    ssl_status: str
    is_secured: bool


class ExtractedSocialHandle(BaseSchema):
    """Social handle extracted from links."""

    platform: str
    handle: str
    url: str | None = None


class ExtractedMarketingData(BaseSchema):
    """Marketing data extracted from scrape."""

    domain: ExtractedDomainInfo
    socialHandles: list[ExtractedSocialHandle] = []
    contactEmails: list[str] = []


class ScrapeResponse(BaseSchema):
    """Scraping result."""

    content: str
    title: str | None = None
    description: str | None = None
    images: list[str] = []
    screenshot: str | None = None
    logo: str | None = None
    links: list[str] = []
    marketing: ExtractedMarketingData | None = None


class ScrapeAnalyzeRequest(BaseSchema):
    """Request to analyze scraped content."""

    content: str
    url: str


class AISocialHandle(BaseSchema):
    """Social handle extracted by AI from content text."""

    platform: str
    handle: str


class ScrapeAnalyzeResponse(BaseSchema):
    """Structured product analysis from scraped content."""

    productName: str = ""
    description: str = ""
    features: list[str] = []
    targetAudience: str = ""
    pricingModel: str = ""
    techIndicators: list[str] = []
    contactEmail: str | None = None
    contactPhone: str | None = None
    socialHandles: list[AISocialHandle] = []
