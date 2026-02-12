"""Structure analyzer — evaluates directory layout, LOC, and organization."""

from pathlib import Path

from apps.api.schemas.repo_evaluator import FileStats, StructureInfo

_SKIP_DIRS = {"node_modules", ".git", "__pycache__", ".venv", "venv",
              "dist", "build", ".next", ".nuxt", "target", "vendor",
              ".cache", "coverage", ".turbo",
              "infra", "scripts", "alembic"}

_CODE_EXTS: dict[str, str] = {
    ".py": "Python", ".ts": "TypeScript", ".tsx": "TypeScript",
    ".js": "JavaScript", ".jsx": "JavaScript", ".rb": "Ruby",
    ".go": "Go", ".rs": "Rust", ".java": "Java", ".kt": "Kotlin",
    ".php": "PHP", ".cs": "C#", ".swift": "Swift", ".dart": "Dart",
    ".vue": "Vue", ".svelte": "Svelte", ".css": "CSS",
    ".scss": "SCSS", ".html": "HTML",
}

# Atomic design directory names
_ATOMIC_DIRS = {"atoms", "molecules", "organisms", "templates"}


class StructureAnalyzer:
    """Evaluates repository file structure against Mizan Flow conventions."""

    def analyze(self, repo_path: Path) -> StructureInfo:
        files = self._collect_source_files(repo_path)
        total_loc = 0
        over_300: list[FileStats] = []
        hooks_over_150: list[FileStats] = []

        for file_path, lang in files:
            loc = self._count_loc(file_path)
            total_loc += loc
            rel_path = str(file_path.relative_to(repo_path))

            if loc > 300:
                over_300.append(FileStats(path=rel_path, loc=loc, language=lang))

            if self._is_hook_file(file_path) and loc > 150:
                hooks_over_150.append(
                    FileStats(path=rel_path, loc=loc, language=lang),
                )

        dir_pattern = self._detect_directory_pattern(repo_path)
        has_barrels = self._check_barrel_files(repo_path)

        return StructureInfo(
            total_files=len(files),
            total_loc=total_loc,
            files_over_300_loc=sorted(over_300, key=lambda f: f.loc, reverse=True),
            hooks_over_150_loc=sorted(
                hooks_over_150, key=lambda f: f.loc, reverse=True,
            ),
            directory_pattern=dir_pattern,
            has_barrel_files=has_barrels,
        )

    def _collect_source_files(
        self, repo_path: Path,
    ) -> list[tuple[Path, str]]:
        """Collect source files with their detected language."""
        result: list[tuple[Path, str]] = []
        for item in repo_path.rglob("*"):
            if any(skip in item.parts for skip in _SKIP_DIRS):
                continue
            if not item.is_file():
                continue
            lang = _CODE_EXTS.get(item.suffix.lower())
            if lang:
                result.append((item, lang))
        return result

    def _count_loc(self, file_path: Path) -> int:
        """Count non-empty, non-comment lines."""
        try:
            lines = file_path.read_text(errors="replace").splitlines()
        except (PermissionError, OSError):
            return 0
        count = 0
        for line in lines:
            stripped = line.strip()
            if stripped and not stripped.startswith(("//", "#", "/*", "*", "<!--")):
                count += 1
        return count

    def _is_hook_file(self, file_path: Path) -> bool:
        """Check if a file is a React/Vue hook (use*.ts/tsx pattern)."""
        name = file_path.stem.lower()
        return name.startswith("use") and file_path.suffix in {".ts", ".tsx", ".js"}

    def _detect_directory_pattern(self, repo_path: Path) -> str:
        """Detect the component organization pattern used."""
        # Collect all src/components directories (supports monorepos)
        comp_dirs = self._find_component_dirs(repo_path)

        if not comp_dirs:
            # Check for feature-based layout in any src/ directory
            src_dirs = self._find_src_dirs(repo_path)
            for src_dir in src_dirs:
                subdirs = {d.name for d in src_dir.iterdir() if d.is_dir()}
                feature_indicators = {"features", "modules", "domains", "pages"}
                if subdirs & feature_indicators:
                    return "feature-based"
            return "flat"

        # Check each components dir for atomic or feature-based layout
        best_pattern = "flat"
        for comp_dir in comp_dirs:
            child_dirs = {d.name for d in comp_dir.iterdir() if d.is_dir()}

            atomic_overlap = child_dirs & _ATOMIC_DIRS
            if len(atomic_overlap) >= 2:
                return "atomic"

            if child_dirs and not atomic_overlap:
                generic = {"ui", "common", "shared", "layout", "forms"}
                if not child_dirs.issubset(generic):
                    best_pattern = "feature-based"

            if len(child_dirs) > 1 and best_pattern == "flat":
                best_pattern = "mixed"

        return best_pattern

    def _find_component_dirs(self, repo_path: Path) -> list[Path]:
        """Find all src/components directories, handling monorepo layouts."""
        result: list[Path] = []
        for src_dir in self._find_src_dirs(repo_path):
            comp_dir = src_dir / "components"
            if comp_dir.exists() and comp_dir.is_dir():
                result.append(comp_dir)
        return result

    def _find_src_dirs(self, repo_path: Path) -> list[Path]:
        """Find all src/ directories, including nested monorepo ones."""
        result: list[Path] = []
        for item in repo_path.rglob("src"):
            if any(skip in item.parts for skip in _SKIP_DIRS):
                continue
            if item.is_dir():
                result.append(item)
        return result

    def _check_barrel_files(self, repo_path: Path) -> bool:
        """Check if the project uses barrel/index files for exports."""
        # Check TypeScript/JavaScript index files across all src/ dirs
        index_count = sum(
            1 for f in repo_path.rglob("index.ts*")
            if not any(skip in f.parts for skip in _SKIP_DIRS)
        )
        if index_count >= 3:
            return True

        # Check Python __init__.py barrels
        init_count = sum(
            1 for f in repo_path.rglob("__init__.py")
            if not any(skip in f.parts for skip in _SKIP_DIRS)
        )
        return init_count >= 3
