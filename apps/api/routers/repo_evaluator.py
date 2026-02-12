"""Repo evaluator router — evaluate any repository against Mizan Flow."""

from pathlib import Path

from fastapi import APIRouter, HTTPException

from apps.api.schemas.repo_evaluator import (
    BrowseEntry,
    BrowseResponse,
    EvaluateRequest,
    EvaluationResult,
)
from apps.api.services.repo_evaluator import RepoEvaluator

router = APIRouter()


@router.get("/browse", response_model=BrowseResponse)
async def browse_directory(path: str | None = None) -> BrowseResponse:
    """List directories at the given path for repo selection."""
    target = Path(path).expanduser().resolve() if path else Path.home()

    if not target.is_dir():
        raise HTTPException(status_code=404, detail="Directory not found")

    parent_path = str(target.parent) if target != target.parent else None

    entries: list[BrowseEntry] = []
    try:
        for item in sorted(target.iterdir(), key=lambda p: p.name.lower()):
            if item.name.startswith("."):
                continue
            if not item.is_dir():
                continue
            entries.append(
                BrowseEntry(name=item.name, path=str(item), is_dir=True)
            )
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")

    return BrowseResponse(
        current_path=str(target),
        parent_path=parent_path,
        entries=entries,
    )


@router.post("/evaluate", response_model=EvaluationResult)
async def evaluate_repo(body: EvaluateRequest) -> EvaluationResult:
    """Evaluate a repository against Mizan Flow conventions."""
    evaluator = RepoEvaluator()
    try:
        result = evaluator.evaluate(body.repo_path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Evaluation failed: {e}")
    return result
