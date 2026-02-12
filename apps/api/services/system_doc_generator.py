"""System document generator — AI-powered living documentation."""

import json
import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.config import settings
from apps.api.models.product import Product
from apps.api.models.specification import Specification, SpecificationSource
from apps.api.models.system_document import SystemDocument
from apps.api.services.scrape_service import ScrapeService
from apps.api.services.spec_source_context import build_source_context

logger = logging.getLogger(__name__)

_SYSTEM_PROMPTS = {
    "functional_spec": (
        "You are a technical writer. Generate a comprehensive functional specification "
        "in Markdown format. Include: executive summary, feature catalog with descriptions, "
        "user stories, data models, user flows, API endpoints, business rules, and "
        "acceptance criteria. Base everything on the provided source material."
    ),
    "implementation_spec": (
        "You are a software architect. Generate an implementation specification "
        "in Markdown format. Include: architecture overview, technology stack analysis, "
        "code patterns and conventions, layer descriptions, data layer design, API "
        "structure, dependency map, and development guidelines. Base everything on the "
        "provided source material."
    ),
    "deployment_docs": (
        "You are a DevOps engineer. Generate deployment documentation "
        "in Markdown format. Include: prerequisites, setup guide, environment "
        "configuration, build and deploy steps, CI/CD pipeline recommendations, "
        "monitoring setup, scaling considerations, and troubleshooting guide. "
        "Base everything on the provided source material."
    ),
}

_DOC_TITLES = {
    "functional_spec": "Functional Specification",
    "implementation_spec": "Implementation Specification",
    "deployment_docs": "Deployment Documentation",
}


class SystemDocGenerator:
    """Generates and regenerates system documents using LLM."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def generate_all(self, product_id: UUID) -> list[SystemDocument]:
        """Generate all 3 document types with real context."""
        context = await self._gather_context(product_id)
        docs = []
        for doc_type in ("functional_spec", "implementation_spec", "deployment_docs"):
            doc = await self._generate_doc(product_id, doc_type, context)
            docs.append(doc)
        return docs

    async def regenerate_from_github(
        self, product_id: UUID, commit_sha: str | None = None
    ) -> list[SystemDocument]:
        """Regenerate documents from current state (context + crawl)."""
        context = await self._gather_context(product_id)
        if commit_sha:
            context += f"\n\nLatest commit: {commit_sha}"

        docs = []
        for doc_type in ("functional_spec", "implementation_spec", "deployment_docs"):
            doc = await self._generate_doc(product_id, doc_type, context)
            docs.append(doc)
        return docs

    async def _generate_doc(
        self, product_id: UUID, doc_type: str, context: str
    ) -> SystemDocument:
        """Generate a single document type."""
        version = await self._get_next_version(product_id, doc_type)
        content = await self._call_llm(
            _SYSTEM_PROMPTS[doc_type],
            f"Generate the {_DOC_TITLES[doc_type].lower()} based on this context:\n\n"
            f"{context}",
        )
        doc = SystemDocument(
            product_id=product_id,
            doc_type=doc_type,
            title=_DOC_TITLES[doc_type],
            content=content,
            version=version,
            generation_source="ai_generated",
            source_metadata={"context_length": len(context)},
            generated_at=datetime.now(timezone.utc),
        )
        self.session.add(doc)
        await self.session.flush()
        await self.session.refresh(doc)
        return doc

    async def _gather_context(self, product_id: UUID) -> str:
        """Gather all available context for document generation."""
        parts: list[str] = []

        # 1. Product info
        product = await self.session.get(Product, product_id)
        product_name = product.name if product else "Unknown Product"
        pillar = product.pillar if product else None
        repo_url = product.repository_url if product else None

        parts.append(f"Project: {product_name}")
        parts.append(f"Pillar: {pillar or 'N/A'}")
        if repo_url:
            parts.append(f"Repository: {repo_url}")

        # 2. Specification sources
        source_ctx = await self._build_source_section(product_id, product_name, pillar)
        if source_ctx:
            parts.append(f"\n## Specification Sources\n{source_ctx}")

        # 3. Latest specification content
        spec_section = await self._build_spec_section(product_id)
        if spec_section:
            parts.append(f"\n## Generated Specification\n{spec_section}")

        # 4. GitHub crawl (if repository_url exists)
        if repo_url:
            crawled = await self._crawl_repo(repo_url)
            if crawled:
                parts.append(f"\n## Repository Documentation (Crawled)\n{crawled}")

        return "\n".join(parts)

    async def _build_source_section(
        self, product_id: UUID, product_name: str, pillar: str | None
    ) -> str:
        """Query SpecificationSource rows and build context string."""
        stmt = select(SpecificationSource).where(
            SpecificationSource.product_id == product_id
        )
        result = await self.session.execute(stmt)
        sources = list(result.scalars().all())
        if not sources:
            return ""
        return build_source_context(sources, product_name, pillar)

    async def _build_spec_section(self, product_id: UUID) -> str:
        """Extract key fields from the latest Specification JSON."""
        stmt = (
            select(Specification)
            .where(Specification.product_id == product_id)
            .order_by(Specification.version.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        spec = result.scalar_one_or_none()
        if not spec or not spec.content:
            return ""

        content = spec.content
        lines: list[str] = []
        if content.get("summary"):
            lines.append(f"Summary: {content['summary']}")
        if content.get("features"):
            lines.append(f"Features: {json.dumps(content['features'])}")
        if content.get("techStack"):
            lines.append(f"Tech Stack: {json.dumps(content['techStack'])}")
        if content.get("functionalSpec"):
            lines.append(
                f"Functional Spec: {json.dumps(content['functionalSpec'])[:3000]}"
            )
        if content.get("technicalSpec"):
            lines.append(
                f"Technical Spec: {json.dumps(content['technicalSpec'])[:3000]}"
            )
        return "\n".join(lines)

    async def _crawl_repo(self, repo_url: str) -> str:
        """Crawl repo URL via Firecrawl; return empty string on failure."""
        try:
            scraper = ScrapeService(self.session)
            return await scraper.crawl(repo_url, limit=25)
        except Exception:
            logger.exception("GitHub crawl failed for %s, continuing without", repo_url)
            return ""

    async def _call_llm(self, system_prompt: str, user_prompt: str) -> str:
        """Call LLM for document generation."""
        import openai

        api_key = settings.openrouter_api_key or settings.openai_api_key
        if not api_key:
            raise ValueError(
                "No LLM API key configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY."
            )
        base_url = (
            "https://openrouter.ai/api/v1"
            if settings.openrouter_api_key
            else None
        )
        model = (
            "anthropic/claude-sonnet-4"
            if settings.openrouter_api_key
            else "gpt-4o"
        )

        client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.choices[0].message.content or ""

    async def _get_next_version(self, product_id: UUID, doc_type: str) -> int:
        """Get the next version number for a document type."""
        stmt = select(sa_func.max(SystemDocument.version)).where(
            SystemDocument.product_id == product_id,
            SystemDocument.doc_type == doc_type,
        )
        result = await self.session.execute(stmt)
        max_version = result.scalar_one_or_none()
        return (max_version or 0) + 1
