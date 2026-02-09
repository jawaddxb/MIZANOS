"""Web scraping service (Firecrawl integration)."""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.config import settings


class ScrapeService:
    """Web scraping using Firecrawl API."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def scrape(self, url: str, mode: str = "single") -> dict:
        """Scrape a URL using Firecrawl, including screenshots and images."""
        if not settings.firecrawl_api_key:
            raise ValueError("Firecrawl API key is not configured")

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "https://api.firecrawl.dev/v1/scrape",
                    json={
                        "url": url,
                        "formats": ["markdown", "screenshot", "links"],
                    },
                    headers={
                        "Authorization": f"Bearer {settings.firecrawl_api_key}",
                    },
                    timeout=60,
                )
                resp.raise_for_status()
                data = resp.json()

            if not data.get("success"):
                raise ValueError(
                    data.get("error", "Firecrawl returned unsuccessful response")
                )

            scrape_data = data.get("data", {})
            metadata = scrape_data.get("metadata", {})

            # Extract images from metadata and links
            images = self._extract_images(scrape_data, metadata, url)

            return {
                "content": scrape_data.get("markdown", ""),
                "title": metadata.get("title"),
                "description": metadata.get("description"),
                "images": images,
                "screenshot": scrape_data.get("screenshot"),
                "logo": self._extract_logo(metadata, url),
            }
        except httpx.HTTPStatusError as e:
            raise ValueError(
                f"Firecrawl API error: {e.response.status_code}"
            ) from e
        except httpx.RequestError as e:
            raise ValueError(
                f"Failed to reach Firecrawl API: {e}"
            ) from e

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
