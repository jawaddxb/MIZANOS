"""Port generator router — extract manifests and generate porting tasks."""

import shutil
import subprocess
import tempfile
from uuid import UUID

from fastapi import APIRouter, HTTPException

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.models.product import Product
from apps.api.schemas.lovable_manifest import LovableManifest
from apps.api.schemas.port_generator import ExtractRequest, GenerateRequest, GenerateResponse
from apps.api.services.lovable_extractor import LovableExtractor
from apps.api.services.port_task_generator import PortTaskGenerator

router = APIRouter()


@router.post("/extract", response_model=LovableManifest)
async def extract_manifest(
    body: ExtractRequest, user: CurrentUser
) -> LovableManifest:
    """Extract manifest from a Lovable project source path."""
    extractor = LovableExtractor()
    try:
        manifest = extractor.extract_manifest(body.source_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Extraction failed: {e}")
    return manifest


@router.post("/{product_id}/generate", response_model=GenerateResponse)
async def generate_tasks(
    product_id: UUID,
    body: GenerateRequest,
    db: DbSession,
    user: CurrentUser,
) -> GenerateResponse:
    """Generate porting tasks for a product from its Lovable source."""
    # Get product
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Resolve source path
    source_path = body.source_path
    temp_dir = None

    if not source_path:
        if not product.lovable_url:
            raise HTTPException(
                status_code=400,
                detail="No source_path provided and product has no lovable_url",
            )
        # Clone from lovable_url
        temp_dir = tempfile.mkdtemp()
        try:
            subprocess.run(
                ["git", "clone", "--depth", "1", product.lovable_url, temp_dir],
                check=True, capture_output=True, timeout=120,
            )
            source_path = temp_dir
        except subprocess.CalledProcessError as e:
            shutil.rmtree(temp_dir, ignore_errors=True)
            stderr = e.stderr.decode()[:200] if e.stderr else "unknown error"
            raise HTTPException(
                status_code=400,
                detail=f"Failed to clone {product.lovable_url}: {stderr}",
            )
        except subprocess.TimeoutExpired:
            shutil.rmtree(temp_dir, ignore_errors=True)
            raise HTTPException(
                status_code=400,
                detail=f"Clone timed out for {product.lovable_url}",
            )

    try:
        # Extract manifest
        extractor = LovableExtractor()
        manifest = extractor.extract_manifest(source_path)

        # Generate tasks
        generator = PortTaskGenerator(db)
        tasks = await generator.generate_tasks(manifest, product_id)

        return GenerateResponse(
            tasks_created=len(tasks),
            domains=manifest.domains,
            summary=manifest.summary.model_dump(),
        )
    finally:
        if temp_dir:
            shutil.rmtree(temp_dir, ignore_errors=True)
