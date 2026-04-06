"""Auto-seed standard checklist templates on startup."""

import logging
from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.checklist_template import ChecklistTemplate, ChecklistTemplateItem
from packages.common.db.session import async_session_factory

logger = logging.getLogger(__name__)

DEVELOPMENT_ITEMS: list[tuple[str, str]] = [
    # Code Quality & Principles
    ("Apply KISS: simplify logic before shipping, avoid clever code", "Code Quality & Principles"),
    ("Apply DRY: extract shared logic into reusable utilities/modules", "Code Quality & Principles"),
    ("Follow SOLID principles strictly across all classes and modules", "Code Quality & Principles"),
    ("Apply YAGNI: build only what is needed now, not hypothetical futures", "Code Quality & Principles"),
    ("Enforce separation of concerns: one module, one responsibility", "Code Quality & Principles"),
    ("Use meaningful, self-documenting names for variables and functions", "Code Quality & Principles"),
    ("Prefer early returns and guard clauses over deep nesting", "Code Quality & Principles"),
    ("Delete dead code immediately; no commented-out blocks", "Code Quality & Principles"),
    # Architecture & Design
    ("Design for modularity: clear boundaries between components", "Architecture & Design"),
    ("Use dependency injection; depend on abstractions, not concretions", "Architecture & Design"),
    ("Apply appropriate design patterns (factory, strategy, observer)", "Architecture & Design"),
    ("Design RESTful APIs with consistent naming, versioning, and status codes", "Architecture & Design"),
    ("Separate configuration from code using environment variables", "Architecture & Design"),
    ("Use layered architecture: presentation, business logic, data access", "Architecture & Design"),
    ("Define clear contracts/interfaces between services and modules", "Architecture & Design"),
    ("Favor composition over inheritance", "Architecture & Design"),
    # Version Control & Git
    ("Use a branching strategy (GitFlow, trunk-based, or GitHub Flow)", "Version Control & Git"),
    ("Write conventional commit messages: type(scope): summary", "Version Control & Git"),
    ("Keep commits atomic: one logical change per commit", "Version Control & Git"),
    ("Require pull request reviews before merging to main", "Version Control & Git"),
    ("Protect main/master branch with branch protection rules", "Version Control & Git"),
    ("Never commit secrets, credentials, or .env files", "Version Control & Git"),
    ("Use .gitignore aggressively for build artifacts and dependencies", "Version Control & Git"),
    ("Tag releases with semantic versioning (vMAJOR.MINOR.PATCH)", "Version Control & Git"),
    # Security
    ("Address OWASP Top 10: injection, XSS, CSRF, IDOR", "Security"),
    ("Validate and sanitize all user inputs server-side", "Security"),
    ("Hash passwords with bcrypt (min 12 rounds), never store plaintext", "Security"),
    ("Use HTTPS only; set secure, httpOnly, sameSite on cookies", "Security"),
    ("Store secrets in environment variables or a vault, never in code", "Security"),
    ("Apply principle of least privilege on all roles and permissions", "Security"),
    ("Rate-limit auth endpoints; return 429 with Retry-After header", "Security"),
    ("Implement CSP headers and disable unnecessary HTTP methods", "Security"),
    # Testing
    ("Write unit tests for all business logic and pure functions", "Testing"),
    ("Write integration tests for API endpoints and service interactions", "Testing"),
    ("Write E2E tests for critical user flows", "Testing"),
    ("Mock external dependencies (DB, APIs, queues) in unit tests", "Testing"),
    ("Enforce minimum meaningful code coverage threshold (e.g., 80%)", "Testing"),
    ("Tests must be deterministic: no flaky or order-dependent tests", "Testing"),
    ("Mirror source structure in /tests directory", "Testing"),
    ("Cover happy path, edge cases, and failure scenarios", "Testing"),
    # Performance
    ("Profile before optimizing; measure, don't guess", "Performance"),
    ("Add indexes on foreign keys and frequently queried columns", "Performance"),
    ("Implement caching for expensive operations", "Performance"),
    ("Use lazy loading for non-critical resources and modules", "Performance"),
    ("Paginate all list queries; no unbounded SELECT * in production", "Performance"),
    ("Avoid N+1 queries; use joins or batch fetching", "Performance"),
    ("Set timeouts on all external calls (HTTP, DB, cache)", "Performance"),
    ("Compress API responses and static assets (gzip/brotli)", "Performance"),
    # Documentation
    ("Maintain a clear README with setup, run, and deploy instructions", "Documentation"),
    ("Document all API endpoints with request/response examples", "Documentation"),
    ("Use inline comments only to explain 'why', never 'what'", "Documentation"),
    ("Keep an Architecture Decision Record (ADR) for major decisions", "Documentation"),
    ("Document environment variables with descriptions and defaults", "Documentation"),
    ("Maintain a CHANGELOG for each release", "Documentation"),
    ("Add JSDoc/docstrings to public functions and interfaces", "Documentation"),
    # Error Handling & Logging
    ("Use structured logging (JSON) with consistent log levels", "Error Handling & Logging"),
    ("Never swallow errors silently; log or propagate every exception", "Error Handling & Logging"),
    ("Implement global error boundaries/handlers in every service", "Error Handling & Logging"),
    ("Include correlation/request IDs in all log entries", "Error Handling & Logging"),
    ("Set up monitoring and alerting (uptime, error rate, latency)", "Error Handling & Logging"),
    ("Log sufficient context for debugging without leaking PII", "Error Handling & Logging"),
    ("Handle promise rejections and async errors explicitly", "Error Handling & Logging"),
    ("Return consistent error response format from all API endpoints", "Error Handling & Logging"),
    # CI/CD & DevOps
    ("Automate builds, tests, and linting on every push/PR", "CI/CD & DevOps"),
    ("Use multi-stage Docker builds; run as non-root user", "CI/CD & DevOps"),
    ("Pin dependency versions and base image versions", "CI/CD & DevOps"),
    ("Separate environments: dev, staging, production", "CI/CD & DevOps"),
    ("Implement automated rollback on deployment failure", "CI/CD & DevOps"),
    ("Use infrastructure as code (Terraform, Pulumi, etc.)", "CI/CD & DevOps"),
    ("Implement graceful shutdown: drain in-flight requests on exit", "CI/CD & DevOps"),
    ("Scan dependencies for known vulnerabilities (npm audit, Snyk)", "CI/CD & DevOps"),
    # Database
    ("Use safe, idempotent migrations (CREATE IF NOT EXISTS pattern)", "Database"),
    ("Use parameterized queries only; never interpolate user input", "Database"),
    ("Use transactions for multi-row/multi-table operations", "Database"),
    ("Use connection pooling; never one connection per request", "Database"),
    ("Set query timeouts; never let a query run indefinitely", "Database"),
    ("Prefer soft deletes where data history matters", "Database"),
    ("Backup databases on automated schedule with tested restores", "Database"),
    ("Normalize schema properly; denormalize only with justification", "Database"),
    # Code Review
    ("Review for correctness, readability, and maintainability", "Code Review"),
    ("Verify no hardcoded secrets, credentials, or magic numbers", "Code Review"),
    ("Check for proper error handling and edge case coverage", "Code Review"),
    ("Ensure new code has accompanying tests", "Code Review"),
    ("Validate naming conventions and project style guide adherence", "Code Review"),
    ("Look for performance issues: N+1 queries, missing indexes", "Code Review"),
    ("Confirm no unnecessary dependencies were added", "Code Review"),
    ("Use automated linters/formatters to enforce style before review", "Code Review"),
    # Accessibility & UX
    ("Meet WCAG 2.1 AA compliance at minimum", "Accessibility & UX"),
    ("Use semantic HTML elements (nav, main, article, button)", "Accessibility & UX"),
    ("Ensure all interactive elements are keyboard navigable", "Accessibility & UX"),
    ("Provide alt text for all images and ARIA labels where needed", "Accessibility & UX"),
    ("Test responsive design across mobile, tablet, and desktop", "Accessibility & UX"),
    ("Verify cross-browser compatibility (Chrome, Firefox, Safari, Edge)", "Accessibility & UX"),
    ("Ensure color contrast ratios meet accessibility standards", "Accessibility & UX"),
    ("Support screen readers and assistive technologies", "Accessibility & UX"),
]


GTM_ITEMS: list[tuple[str, str]] = [
    # Market Research & Positioning
    ("Define target audience and ideal customer profile (ICP)", "Market Research & Positioning"),
    ("Conduct competitive analysis and identify differentiators", "Market Research & Positioning"),
    ("Define unique value proposition (UVP)", "Market Research & Positioning"),
    ("Validate product-market fit with customer interviews", "Market Research & Positioning"),
    ("Identify key market segments and prioritize", "Market Research & Positioning"),
    ("Research pricing benchmarks in the target market", "Market Research & Positioning"),
    ("Document buyer personas with pain points and motivations", "Market Research & Positioning"),
    # Product Readiness
    ("Core features complete and tested for launch", "Product Readiness"),
    ("Product demo or walkthrough video created", "Product Readiness"),
    ("Onboarding flow tested and optimized for new users", "Product Readiness"),
    ("Help documentation and FAQ published", "Product Readiness"),
    ("Known bugs triaged with no critical or blocker issues open", "Product Readiness"),
    ("Performance tested under expected launch traffic", "Product Readiness"),
    ("Mobile responsiveness verified", "Product Readiness"),
    # Pricing & Packaging
    ("Pricing model defined (freemium, subscription, one-time, usage-based)", "Pricing & Packaging"),
    ("Pricing tiers and feature gates finalized", "Pricing & Packaging"),
    ("Free trial or demo strategy decided", "Pricing & Packaging"),
    ("Payment integration tested end-to-end", "Pricing & Packaging"),
    ("Billing page and invoice templates ready", "Pricing & Packaging"),
    ("Refund and cancellation policy documented", "Pricing & Packaging"),
    # Branding & Messaging
    ("Brand guidelines finalized (logo, colors, typography, tone)", "Branding & Messaging"),
    ("Tagline and elevator pitch finalized", "Branding & Messaging"),
    ("Key messaging framework documented for each persona", "Branding & Messaging"),
    ("Case studies or testimonials collected (minimum 2)", "Branding & Messaging"),
    ("Press kit and media assets prepared", "Branding & Messaging"),
    ("Social media profiles created and branded", "Branding & Messaging"),
    # Website & Landing Pages
    ("Landing page live with clear CTA and value proposition", "Website & Landing Pages"),
    ("SEO meta tags, OG tags, and structured data configured", "Website & Landing Pages"),
    ("Analytics tracking installed (Google Analytics, Mixpanel, etc.)", "Website & Landing Pages"),
    ("Conversion tracking set up for signups and purchases", "Website & Landing Pages"),
    ("A/B test variants prepared for key landing pages", "Website & Landing Pages"),
    ("Mobile and cross-browser testing complete", "Website & Landing Pages"),
    ("Page load speed under 3 seconds", "Website & Landing Pages"),
    ("Privacy policy and terms of service published", "Website & Landing Pages"),
    ("Cookie consent banner implemented", "Website & Landing Pages"),
    # Content & SEO
    ("Launch blog post drafted and scheduled", "Content & SEO"),
    ("Product announcement email drafted", "Content & SEO"),
    ("SEO keyword strategy defined for top 10 target keywords", "Content & SEO"),
    ("Content calendar created for first 90 days post-launch", "Content & SEO"),
    ("Social media launch posts scheduled", "Content & SEO"),
    ("Video content (demo, explainer, testimonial) produced", "Content & SEO"),
    # Sales Enablement
    ("Sales deck and pitch materials finalized", "Sales Enablement"),
    ("Product one-pager or battle card created", "Sales Enablement"),
    ("Objection handling guide documented", "Sales Enablement"),
    ("CRM pipeline stages configured", "Sales Enablement"),
    ("Lead scoring criteria defined", "Sales Enablement"),
    ("Sales team trained on product features and positioning", "Sales Enablement"),
    ("Demo script prepared and rehearsed", "Sales Enablement"),
    # Launch Operations
    ("Launch date and timeline confirmed with all stakeholders", "Launch Operations"),
    ("Launch checklist reviewed and signed off by team leads", "Launch Operations"),
    ("Rollback plan documented in case of critical issues", "Launch Operations"),
    ("Customer support team briefed and ready", "Launch Operations"),
    ("Monitoring and alerting configured for launch day", "Launch Operations"),
    ("Internal communication plan for launch updates", "Launch Operations"),
    ("Post-launch retrospective meeting scheduled", "Launch Operations"),
    # Metrics & Analytics
    ("KPIs defined for launch success (signups, revenue, activation rate)", "Metrics & Analytics"),
    ("Dashboard built to track launch metrics in real-time", "Metrics & Analytics"),
    ("Funnel tracking set up (visit to signup to activation to paid)", "Metrics & Analytics"),
    ("Customer feedback collection mechanism in place (survey, NPS)", "Metrics & Analytics"),
    ("Weekly reporting cadence established for first 30 days", "Metrics & Analytics"),
    ("Churn tracking and early warning alerts configured", "Metrics & Analytics"),
    # Legal & Compliance
    ("Terms of service reviewed by legal", "Legal & Compliance"),
    ("Privacy policy compliant with GDPR and CCPA", "Legal & Compliance"),
    ("Data processing agreements ready for enterprise customers", "Legal & Compliance"),
    ("Trademark and IP protections filed if needed", "Legal & Compliance"),
    ("Export compliance reviewed for target markets", "Legal & Compliance"),
    ("Accessibility (WCAG 2.1 AA) audit completed", "Legal & Compliance"),
]

QA_ITEMS: list[tuple[str, str]] = [
    # Functional Testing
    ("All core features work as per requirements/spec", "Functional Testing"),
    ("Form validations enforce required fields and correct formats", "Functional Testing"),
    ("Error messages are clear, user-friendly, and actionable", "Functional Testing"),
    ("Navigation flows work correctly across all pages", "Functional Testing"),
    ("Search and filter functionality returns accurate results", "Functional Testing"),
    ("CRUD operations work without data loss", "Functional Testing"),
    ("File upload/download works with supported formats and size limits", "Functional Testing"),
    ("Pagination and sorting work correctly on all list views", "Functional Testing"),
    # Authentication & Authorization
    ("Login/logout flow works correctly", "Authentication & Authorization"),
    ("Password reset and account recovery flow works", "Authentication & Authorization"),
    ("Session timeout and token refresh work as expected", "Authentication & Authorization"),
    ("Role-based access control restricts unauthorized actions", "Authentication & Authorization"),
    ("Protected routes redirect unauthenticated users to login", "Authentication & Authorization"),
    # UI/UX
    ("Responsive design works on mobile, tablet, and desktop", "UI/UX"),
    ("Dark/light mode renders correctly across all pages", "UI/UX"),
    ("Loading states and spinners display during async operations", "UI/UX"),
    ("Empty states show meaningful messages with call-to-action", "UI/UX"),
    ("Toast notifications display for success, error, and warning actions", "UI/UX"),
    ("Modals and dialogs open, close, and submit correctly", "UI/UX"),
    ("No broken images, icons, or missing assets", "UI/UX"),
    # Performance
    ("Pages load within 3 seconds on standard connections", "Performance"),
    ("No unnecessary API calls or duplicate network requests", "Performance"),
    ("Large lists use pagination or virtual scrolling", "Performance"),
    ("Images and assets are optimized for web delivery", "Performance"),
    ("No memory leaks on long-running sessions", "Performance"),
    # Security
    ("No sensitive data exposed in browser console or network tab", "Security"),
    ("API endpoints validate and sanitize all user inputs", "Security"),
    ("No hardcoded secrets, API keys, or credentials in frontend code", "Security"),
    ("HTTPS enforced on all environments", "Security"),
    ("CORS policy configured correctly for allowed origins", "Security"),
    # Cross-Browser & Compatibility
    ("Works on Chrome, Firefox, Safari, and Edge (latest 2 versions)", "Cross-Browser & Compatibility"),
    ("No layout breaks or JS errors on any supported browser", "Cross-Browser & Compatibility"),
    ("Works on iOS Safari and Android Chrome", "Cross-Browser & Compatibility"),
    # Data Integrity
    ("Database transactions maintain consistency (no partial saves)", "Data Integrity"),
    ("Concurrent edits do not cause data corruption or silent overwrites", "Data Integrity"),
    ("Deleted records do not leave orphaned data or broken references", "Data Integrity"),
    ("Date/time values display correctly across timezones", "Data Integrity"),
    # Error Handling
    ("API failures show user-friendly error messages (not raw stack traces)", "Error Handling"),
    ("Network disconnection is handled gracefully with retry option", "Error Handling"),
    ("404 pages display for invalid routes", "Error Handling"),
    ("Rate limiting returns proper 429 responses with retry guidance", "Error Handling"),
    # Deployment & Environment
    ("Environment variables are set correctly (no dev values in production)", "Deployment & Environment"),
    ("Database migrations run successfully without data loss", "Deployment & Environment"),
    ("Health check endpoint returns 200 OK", "Deployment & Environment"),
    ("Logs capture errors with sufficient context for debugging", "Deployment & Environment"),
]


async def seed_checklist(session: AsyncSession, name: str, template_type: str, description: str, items: list[tuple[str, str]]) -> None:
    """Create a checklist template if it doesn't exist."""
    stmt = select(ChecklistTemplate).where(
        ChecklistTemplate.template_type == template_type,
        ChecklistTemplate.name == name,
    )
    result = await session.execute(stmt)
    if result.scalar_one_or_none():
        return

    template = ChecklistTemplate(
        name=name,
        template_type=template_type,
        description=description,
        is_active=True,
    )
    session.add(template)
    await session.flush()

    for i, (title, category) in enumerate(items):
        item = ChecklistTemplateItem(
            template_id=template.id,
            title=title,
            category=category,
            default_status="new",
            sort_order=i,
        )
        session.add(item)

    await session.flush()
    logger.info("Seeded %s with %d items", name, len(items))


async def seed_development_checklist(session: AsyncSession) -> None:
    """Create the Development Standard Checklist if it doesn't exist."""
    stmt = select(ChecklistTemplate).where(
        ChecklistTemplate.template_type == "development",
        ChecklistTemplate.name == "Development Standard Checklist",
    )
    result = await session.execute(stmt)
    if result.scalar_one_or_none():
        return  # Already exists

    now = datetime.now(timezone.utc)
    template = ChecklistTemplate(
        name="Development Standard Checklist",
        template_type="development",
        description="General development standards and principles to be followed for every project",
        is_active=True,
    )
    session.add(template)
    await session.flush()

    for i, (title, category) in enumerate(DEVELOPMENT_ITEMS):
        item = ChecklistTemplateItem(
            template_id=template.id,
            title=title,
            category=category,
            default_status="new",
            sort_order=i + 1,
        )
        session.add(item)

    await session.flush()
    logger.info("Seeded Development Standard Checklist with %d items", len(DEVELOPMENT_ITEMS))


async def run_checklist_seeds() -> None:
    """Run all checklist seeds. Called from app lifespan."""
    async with async_session_factory() as session:
        await seed_development_checklist(session)
        await seed_checklist(
            session,
            name="GTM Standard Checklist",
            template_type="gtm",
            description="Go-to-market standards for every product launch",
            items=GTM_ITEMS,
        )
        await seed_checklist(
            session,
            name="QA Standard Checklist",
            template_type="qa",
            description="General QA standards to be followed for every project",
            items=QA_ITEMS,
        )
        await session.commit()
