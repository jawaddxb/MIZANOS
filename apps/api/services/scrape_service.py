"""Web scraping service (Firecrawl integration)."""

import asyncio
import json
import logging

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.config import settings
from apps.api.utils.link_parser import (
    extract_contact_emails,
    extract_domain,
    extract_social_handles,
)

logger = logging.getLogger(__name__)

CRAWL_POLL_INTERVAL_S = 3
CRAWL_TIMEOUT_S = 120
CRAWL_MAX_CONTENT_CHARS = 50_000


class ScrapeService:
    """Web scraping using Firecrawl API."""

    FIRECRAWL_TIMEOUT_MS = 90_000
    FIRECRAWL_WAIT_FOR_MS = 3_000
    HTTPX_TIMEOUT_S = 180

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def crawl(self, url: str, limit: int = 25) -> str:
        """Deep-crawl a URL via Firecrawl v2, return aggregated markdown."""
        if not settings.firecrawl_api_key:
            raise ValueError("Firecrawl API key is not configured")

        headers = {"Authorization": f"Bearer {settings.firecrawl_api_key}"}

        async with httpx.AsyncClient(timeout=self.HTTPX_TIMEOUT_S) as client:
            resp = await client.post(
                "https://api.firecrawl.dev/v2/crawl",
                json={
                    "url": url,
                    "limit": limit,
                    "maxDiscoveryDepth": 3,
                    "scrapeOptions": {
                        "formats": ["markdown"],
                        "onlyMainContent": True,
                    },
                },
                headers=headers,
            )
            resp.raise_for_status()
            crawl_data = resp.json()

            crawl_id = crawl_data.get("id")
            if not crawl_id:
                raise ValueError("Firecrawl crawl did not return an ID")

            return await self._poll_crawl(client, crawl_id, headers)

    async def _poll_crawl(
        self, client: httpx.AsyncClient, crawl_id: str, headers: dict
    ) -> str:
        """Poll crawl status until completed or timeout."""
        elapsed = 0
        while elapsed < CRAWL_TIMEOUT_S:
            await asyncio.sleep(CRAWL_POLL_INTERVAL_S)
            elapsed += CRAWL_POLL_INTERVAL_S

            resp = await client.get(
                f"https://api.firecrawl.dev/v2/crawl/{crawl_id}",
                headers=headers,
            )
            resp.raise_for_status()
            result = resp.json()

            status = result.get("status")
            if status == "completed":
                return self._aggregate_crawl_pages(result.get("data", []))
            if status == "failed":
                raise ValueError(
                    f"Firecrawl crawl failed: {result.get('error', 'unknown')}"
                )

        logger.warning("Crawl %s timed out after %ds", crawl_id, CRAWL_TIMEOUT_S)
        raise ValueError("Firecrawl crawl timed out")

    @staticmethod
    def _aggregate_crawl_pages(pages: list[dict]) -> str:
        """Concatenate crawled page markdown with URL headers."""
        parts: list[str] = []
        total_chars = 0
        for page in pages:
            md = page.get("markdown", "")
            page_url = page.get("metadata", {}).get("sourceURL", "unknown")
            chunk = f"### Page: {page_url}\n\n{md}"
            if total_chars + len(chunk) > CRAWL_MAX_CONTENT_CHARS:
                remaining = CRAWL_MAX_CONTENT_CHARS - total_chars
                if remaining > 200:
                    parts.append(chunk[:remaining] + "\n\n[truncated]")
                break
            parts.append(chunk)
            total_chars += len(chunk)
        return "\n\n---\n\n".join(parts)

    async def scrape(self, url: str, mode: str = "single") -> dict:
        """Scrape a URL using Firecrawl, including screenshots and images."""
        if not settings.firecrawl_api_key:
            raise ValueError("Firecrawl API key is not configured")

        last_error: Exception | None = None
        for attempt in range(2):
            try:
                return await self._do_scrape(url)
            except httpx.TimeoutException as e:
                last_error = e
                logger.warning("Firecrawl timeout (attempt %d) for %s", attempt + 1, url)
            except httpx.HTTPStatusError as e:
                retryable = e.response.status_code in (408, 500, 502, 503, 504)
                if retryable and attempt == 0:
                    last_error = e
                    logger.warning(
                        "Firecrawl %d (attempt %d) for %s",
                        e.response.status_code, attempt + 1, url,
                    )
                else:
                    raise ValueError(
                        f"Firecrawl API error: {e.response.status_code}"
                    ) from e

            await asyncio.sleep(2 ** attempt)

        raise ValueError(
            "Scraping timed out after retries. Try a simpler page or a direct URL."
        ) from last_error

    async def _do_scrape(self, url: str) -> dict:
        """Execute a single Firecrawl scrape request."""
        async with httpx.AsyncClient(timeout=self.HTTPX_TIMEOUT_S) as client:
            resp = await client.post(
                "https://api.firecrawl.dev/v1/scrape",
                json={
                    "url": url,
                    "formats": ["markdown", "screenshot", "links"],
                    "timeout": self.FIRECRAWL_TIMEOUT_MS,
                    "waitFor": self.FIRECRAWL_WAIT_FOR_MS,
                },
                headers={
                    "Authorization": f"Bearer {settings.firecrawl_api_key}",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        if not data.get("success"):
            raise ValueError(
                data.get("error", "Firecrawl returned unsuccessful response")
            )

        scrape_data = data.get("data", {})
        metadata = scrape_data.get("metadata", {})
        images = self._extract_images(scrape_data, metadata, url)
        links = scrape_data.get("links", [])

        marketing = self.extract_marketing_data(url, links)

        return {
            "content": scrape_data.get("markdown", ""),
            "title": metadata.get("title"),
            "description": metadata.get("description"),
            "images": images,
            "screenshot": scrape_data.get("screenshot"),
            "logo": self._extract_logo(metadata, url),
            "links": links,
            "marketing": marketing,
        }

    @staticmethod
    def _extract_images(
        scrape_data: dict, metadata: dict, url: str
    ) -> list[str]:
        """Extract image URLs from scraped data."""
        images: list[str] = []

        # Screenshot from Firecrawl
        screenshot = scrape_data.get("screenshot")
        if screenshot:
            images.append(screenshot)

        # OG image from metadata
        og_image = metadata.get("og:image") or metadata.get("ogImage")
        if og_image:
            images.append(og_image)

        # Twitter card image
        twitter_image = metadata.get("twitter:image")
        if twitter_image:
            images.append(twitter_image)

        # Favicon / apple-touch-icon as fallback for logo
        for key in ("icon", "apple-touch-icon", "favicon"):
            val = metadata.get(key)
            if val:
                images.append(val)

        return list(dict.fromkeys(images))  # dedupe preserving order

    @staticmethod
    def extract_marketing_data(url: str, links: list[str]) -> dict:
        """Extract marketing-relevant data from URL and page links."""
        domain_info = extract_domain(url)
        social_handles = extract_social_handles(links)
        contact_emails = extract_contact_emails(links)

        return {
            "domain": domain_info,
            "socialHandles": social_handles,
            "contactEmails": contact_emails,
        }

    @staticmethod
    def _extract_logo(metadata: dict, url: str) -> str | None:
        """Try to find a logo URL from metadata."""
        # Prefer explicit logo fields
        for key in ("logo", "og:logo", "apple-touch-icon", "icon"):
            val = metadata.get(key)
            if val:
                return val

        # Fallback: OG image often serves as a brand logo
        og = metadata.get("og:image") or metadata.get("ogImage")
        if og:
            return og

        return None

    async def analyze_content(self, content: str, url: str) -> dict:
        """Use AI to extract structured product information from scraped markdown."""
        import openai

        api_key = settings.openrouter_api_key or settings.openai_api_key
        if not api_key:
            raise ValueError("No AI API key configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY.")

        base_url = "https://openrouter.ai/api/v1" if settings.openrouter_api_key else None
        model = "anthropic/claude-sonnet-4" if settings.openrouter_api_key else "gpt-4o"

        truncated = content[:8000]
        prompt = (
            f"Analyze the following website content from {url} and extract structured product information.\n\n"
            f"Content:\n{truncated}\n\n"
            "Respond ONLY with valid JSON (no markdown, no code fences):\n"
            '{"productName":"...","description":"...","features":["..."],'
            '"targetAudience":"...","pricingModel":"...","techIndicators":["..."],'
            '"contactEmail":"...or null","contactPhone":"...or null",'
            '"socialHandles":[{"platform":"twitter|linkedin|instagram|...","handle":"@example"}]}'
        )

        client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)
        response = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.choices[0].message.content or "{}"
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            logger.warning("Failed to parse AI analysis response as JSON")
            parsed = {}

        return {
            "productName": parsed.get("productName", ""),
            "description": parsed.get("description", ""),
            "features": parsed.get("features", []),
            "targetAudience": parsed.get("targetAudience", ""),
            "pricingModel": parsed.get("pricingModel", ""),
            "techIndicators": parsed.get("techIndicators", []),
            "contactEmail": parsed.get("contactEmail"),
            "contactPhone": parsed.get("contactPhone"),
            "socialHandles": parsed.get("socialHandles", []),
        }
