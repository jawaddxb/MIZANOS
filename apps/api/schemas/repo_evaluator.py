"""Schemas for the standalone Repo Evaluator feature."""

from apps.api.schemas.base import BaseSchema


class TechStackInfo(BaseSchema):
    """Detected technology stack of a repository."""

    languages: list[str]
    frameworks: list[str]
    package_managers: list[str]
    databases: list[str]
    notable_deps: list[str]


class FileStats(BaseSchema):
    """LOC stats for a single file."""

    path: str
    loc: int
    language: str


class StructureInfo(BaseSchema):
    """Repository structure analysis results."""

    total_files: int
    total_loc: int
    files_over_300_loc: list[FileStats]
    hooks_over_150_loc: list[FileStats]
    directory_pattern: str  # "atomic", "feature-based", "flat", "mixed"
    has_barrel_files: bool


class PatternFinding(BaseSchema):
    """A single code pattern finding with severity assessment."""

    category: str  # "api_calls", "auth", "state_mgmt", "db_access", "css"
    pattern: str  # "raw_fetch", "repository_pattern", etc.
    occurrences: int
    example_files: list[str]
    severity: str  # "aligned", "needs_change", "critical"
    recommendation: str


class EvaluationDocument(BaseSchema):
    """A rendered markdown document section of the evaluation."""

    title: str
    slug: str
    content: str  # Markdown content
    order: int


class EvaluationResult(BaseSchema):
    """Complete evaluation output for a repository."""

    repo_path: str
    evaluated_at: str
    tech_stack: TechStackInfo
    structure: StructureInfo
    patterns: list[PatternFinding]
    has_lovable_project: bool
    documents: list[EvaluationDocument]
    summary_score: int  # 0-100 alignment score


class BrowseEntry(BaseSchema):
    """A single filesystem entry returned by the browse endpoint."""

    name: str
    path: str
    is_dir: bool


class BrowseResponse(BaseSchema):
    """Response for the directory browse endpoint."""

    current_path: str
    parent_path: str | None
    entries: list[BrowseEntry]


class EvaluateRequest(BaseSchema):
    """Request body for the evaluate endpoint."""

    repo_path: str
