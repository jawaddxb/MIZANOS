"""Repo Evaluator orchestrator — coordinates analyzers and report builder."""

from datetime import datetime, timezone
from pathlib import Path

from apps.api.schemas.repo_evaluator import EvaluationResult
from apps.api.services.analyzers import (
    CodePatternAnalyzer,
    StructureAnalyzer,
    TechStackAnalyzer,
)
from apps.api.services.evaluation_report_builder import EvaluationReportBuilder


class RepoEvaluator:
    """Evaluates any git repository against Mizan Flow conventions."""

    def evaluate(self, repo_path: str) -> EvaluationResult:
        path = Path(repo_path)
        if not path.exists() or not path.is_dir():
            raise FileNotFoundError(f"Repository not found: {repo_path}")

        tech = TechStackAnalyzer().analyze(path)
        structure = StructureAnalyzer().analyze(path)
        patterns = CodePatternAnalyzer().analyze(path, tech)

        has_lovable = self._detect_lovable(path)
        lovable_manifest = None
        if has_lovable:
            lovable_manifest = self._extract_lovable_manifest(repo_path)

        score = self._compute_alignment_score(structure, patterns)
        documents = EvaluationReportBuilder().build(
            tech, structure, patterns, score, lovable_manifest,
        )

        return EvaluationResult(
            repo_path=repo_path,
            evaluated_at=datetime.now(timezone.utc).isoformat(),
            tech_stack=tech,
            structure=structure,
            patterns=patterns,
            has_lovable_project=has_lovable,
            documents=documents,
            summary_score=score,
        )

    def _detect_lovable(self, path: Path) -> bool:
        """Check if the repo is a Lovable/Supabase project."""
        supabase_dir = path / "src" / "integrations" / "supabase"
        if supabase_dir.exists():
            return True
        pkg_json = path / "package.json"
        if pkg_json.exists():
            try:
                content = pkg_json.read_text()
                return "@supabase/supabase-js" in content
            except (UnicodeDecodeError, PermissionError):
                pass
        return False

    def _extract_lovable_manifest(self, repo_path: str) -> object | None:
        """Call the existing LovableExtractor if available."""
        try:
            from apps.api.services.lovable_extractor import LovableExtractor
            return LovableExtractor().extract_manifest(repo_path)
        except Exception:
            return None

    def _compute_alignment_score(
        self, structure: object, patterns: list[object],
    ) -> int:
        """Compute a 0-100 alignment score based on structure and patterns."""
        score = 100

        # Structure penalties
        dir_pattern = getattr(structure, "directory_pattern", "flat")
        if dir_pattern == "flat":
            score -= 20
        elif dir_pattern == "mixed":
            score -= 10
        elif dir_pattern == "feature-based":
            score -= 5

        if not getattr(structure, "has_barrel_files", False):
            score -= 10

        files_over = getattr(structure, "files_over_300_loc", [])
        hooks_over = getattr(structure, "hooks_over_150_loc", [])
        score -= min(len(files_over) * 2, 15)
        score -= min(len(hooks_over) * 3, 15)

        # Pattern penalties
        for p in patterns:
            severity = getattr(p, "severity", "aligned")
            occurrences = getattr(p, "occurrences", 0)
            if severity == "critical":
                score -= min(occurrences, 10)
            elif severity == "needs_change":
                score -= min(occurrences // 2, 5)

        return max(0, min(100, score))
