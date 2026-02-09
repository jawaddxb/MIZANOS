"""Mizan Flow API - FastAPI Application Entry Point."""

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.api.config import settings
from apps.api.middleware.logging import LoggingMiddleware
from apps.api.middleware.security_headers import SecurityHeadersMiddleware
from apps.api.routers import (
    auth,
    products,
    tasks,
    task_templates,
    qa,
    documents,
    notifications,
    ai,
    github,
    audit,
    marketing,
    knowledge,
    vault,
    team,
    settings as settings_router,
    specifications,
    scrape,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan: startup and shutdown events."""
    yield


app = FastAPI(
    title="Mizan Flow API",
    version="0.1.0",
    description="Product Lifecycle Management Platform",
    lifespan=lifespan,
)

# Middleware stack (order matters - last added runs first)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(qa.router, prefix="/qa", tags=["qa"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(github.router, prefix="/github", tags=["github"])
app.include_router(audit.router, prefix="/audits", tags=["audit"])
app.include_router(marketing.router, prefix="/marketing", tags=["marketing"])
app.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
app.include_router(vault.router, prefix="/vault", tags=["vault"])
app.include_router(team.router, prefix="/team", tags=["team"])
app.include_router(settings_router.router, prefix="/settings", tags=["settings"])
app.include_router(specifications.router, prefix="/specifications", tags=["specifications"])
app.include_router(task_templates.router, prefix="/task-templates", tags=["task-templates"])
app.include_router(scrape.router, prefix="/scrape", tags=["scrape"])


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
