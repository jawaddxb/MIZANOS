"""Code pattern analyzer — detects API calls, auth, state, DB, CSS patterns."""

import re
from pathlib import Path

from apps.api.schemas.repo_evaluator import PatternFinding, TechStackInfo

_SKIP_DIRS = {"node_modules", ".git", "__pycache__", ".venv", "venv",
              "dist", "build", ".next", ".nuxt", "target", "vendor"}

# Files/directories that should not be scanned for patterns because they
# describe or analyze patterns rather than use them.
_SKIP_META_FILES = {"analyzers", "claude_prompt_builder", "lovable_extractor"}

# Pattern definitions: (regex, pattern_name, severity, recommendation)
_API_PATTERNS: list[tuple[str, str, str, str]] = [
    (r'\bfetch\s*\(', "raw_fetch",
     "needs_change", "Replace raw fetch() with repository pattern methods"),
    (r'\baxios\s*\.\s*(get|post|put|patch|delete)\s*\(',
     "raw_axios", "needs_change",
     "Move axios calls to a repository layer for separation of concerns"),
    (r'class\s+\w+Repository\b', "repository_pattern",
     "aligned", "Repository pattern detected — already aligned"),
    (r'\$\.ajax\s*\(', "jquery_ajax",
     "critical", "Replace jQuery AJAX with modern fetch or axios via repository"),
    (r'\.from\s*\(\s*["\']', "supabase_client",
     "critical", "Replace Supabase .from() calls with repository pattern"),
]

_AUTH_PATTERNS: list[tuple[str, str, str, str]] = [
    (r'supabase\.auth\.', "supabase_auth",
     "critical", "Replace with JWT auth via AuthContext and CurrentUser dependency"),
    (r'firebase\.auth\(\)', "firebase_auth",
     "needs_change", "Replace Firebase Auth with JWT-based auth service"),
    (r'(useAuth|AuthContext|AuthProvider)', "auth_context",
     "aligned", "Auth context/provider pattern detected"),
    (r'jwt\.(sign|verify|decode)', "jwt_direct",
     "aligned", "JWT handling detected — verify it uses service layer"),
    (r'(passport|OAuth2|openid)', "oauth",
     "aligned", "OAuth/OpenID pattern detected"),
    (r'(req|request|express)\.session\s*\.\s*(get|set|destroy)', "session_auth",
     "needs_change", "Session-based auth may need JWT migration for API"),
]

_STATE_PATTERNS: list[tuple[str, str, str, str]] = [
    (r'(createStore|configureStore|createSlice)', "redux",
     "needs_change", "Consider lighter state management if Redux is overly complex"),
    (r'\bcreate\s*\(\s*\(set\b', "zustand",
     "aligned", "Zustand state management detected"),
    (r'\buseContext\s*\(', "react_context",
     "aligned", "React Context pattern detected"),
    (r'\b(atom|useAtom)\s*\(', "jotai",
     "aligned", "Jotai atomic state detected"),
    (r'(observable|makeAutoObservable)', "mobx",
     "needs_change", "MobX detected — consider migration to simpler state"),
]

_DB_PATTERNS: list[tuple[str, str, str, str]] = [
    (r'\b(SELECT\s[^\n]+FROM\s+\w|INSERT\s+INTO\s+\w|UPDATE\s+\w+\s+SET\s|DELETE\s+FROM\s+\w)',
     "raw_sql",
     "needs_change", "Replace raw SQL with ORM queries for type safety"),
    (r'prisma\.\w+\.(find|create|update|delete)', "prisma_orm",
     "aligned", "Prisma ORM pattern detected"),
    (r'(drizzle|eq\(|and\(|or\()', "drizzle_orm",
     "aligned", "Drizzle ORM pattern detected"),
    (r'session\.(query|execute|add|delete)', "sqlalchemy",
     "aligned", "SQLAlchemy session pattern detected"),
    (r'\.objects\.(filter|get|create|all)', "django_orm",
     "aligned", "Django ORM pattern detected"),
]

_CSS_PATTERNS: list[tuple[str, str, str, str]] = [
    (r'#[0-9a-fA-F]{3,8}\b', "hardcoded_hex",
     "needs_change", "Replace hardcoded hex colors with CSS variables or Tailwind"),
    (r'rgb[a]?\s*\(', "hardcoded_rgb",
     "needs_change", "Replace hardcoded RGB values with theme tokens"),
    (r'\bclassName\s*=.*\b(bg-|text-|border-)', "tailwind_classes",
     "aligned", "Tailwind CSS classes detected"),
    (r'styled\s*[\.(]', "styled_components",
     "needs_change", "Consider migrating styled-components to Tailwind CSS"),
    (r'(var\(--|\$[a-z])', "css_variables",
     "aligned", "CSS variables/SCSS variables detected"),
]

_TS_PATTERNS: list[tuple[str, str, str, str]] = [
    (r':\s*any\b', "typescript_any",
     "critical", "Replace `any` types with explicit TypeScript types"),
]

# Files to skip for specific patterns to avoid false positives.
# CSS theme files legitimately contain hex colors; migration/config files
# contain SQL keywords in non-query contexts.
_PATTERN_SKIP_FILES: dict[str, set[str]] = {
    "hardcoded_hex": {
        "globals.css", "tailwind.config", "theme", "variables.css",
        "variables.scss",
    },
    "raw_sql": {
        "alembic", "migrations", "CLAUDE.md", ".md",
    },
    "raw_fetch": {
        "repository", "AuthContext",
    },
    "hardcoded_rgb": {
        "layout/",
    },
}


class CodePatternAnalyzer:
    """Scans source files for code patterns and evaluates alignment."""

    def analyze(
        self, repo_path: Path, tech_stack: TechStackInfo,
    ) -> list[PatternFinding]:
        """Run all pattern checks and return findings."""
        findings: list[PatternFinding] = []
        files = self._collect_scannable_files(repo_path)
        file_contents = self._read_files(repo_path, files)

        pattern_groups = [
            ("api_calls", _API_PATTERNS),
            ("auth", _AUTH_PATTERNS),
            ("state_mgmt", _STATE_PATTERNS),
            ("db_access", _DB_PATTERNS),
            ("css", _CSS_PATTERNS),
        ]

        # Only check TS patterns if TypeScript is in the stack
        if "TypeScript" in tech_stack.languages:
            pattern_groups.append(("typescript", _TS_PATTERNS))

        for category, patterns in pattern_groups:
            for regex, name, severity, recommendation in patterns:
                compiled = re.compile(regex, re.IGNORECASE)
                skip = _PATTERN_SKIP_FILES.get(name)
                matches = self._scan_pattern(
                    compiled, file_contents, skip_files=skip,
                )
                if matches:
                    findings.append(PatternFinding(
                        category=category,
                        pattern=name,
                        occurrences=sum(c for _, c in matches),
                        example_files=[f for f, _ in matches[:5]],
                        severity=severity,
                        recommendation=recommendation,
                    ))

        return findings

    def _collect_scannable_files(self, repo_path: Path) -> list[Path]:
        """Collect source files worth scanning for patterns."""
        exts = {".py", ".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte",
                ".rb", ".go", ".rs", ".java", ".kt", ".php", ".css", ".scss"}
        result: list[Path] = []
        for item in repo_path.rglob("*"):
            if any(skip in item.parts for skip in _SKIP_DIRS):
                continue
            if any(meta in part for part in item.parts for meta in _SKIP_META_FILES):
                continue
            if item.is_file() and item.suffix.lower() in exts:
                result.append(item)
        return result

    def _read_files(
        self, repo_path: Path, files: list[Path],
    ) -> list[tuple[str, str]]:
        """Read files and return (relative_path, content) pairs."""
        result: list[tuple[str, str]] = []
        for f in files:
            try:
                content = f.read_text(errors="replace")
                rel = str(f.relative_to(repo_path))
                result.append((rel, content))
            except (PermissionError, OSError):
                continue
        return result

    def _scan_pattern(
        self, compiled: re.Pattern[str],
        file_contents: list[tuple[str, str]],
        *,
        skip_files: set[str] | None = None,
    ) -> list[tuple[str, int]]:
        """Scan all files for a pattern, return (file, count) pairs."""
        matches: list[tuple[str, int]] = []
        for rel_path, content in file_contents:
            if skip_files and any(s in rel_path for s in skip_files):
                continue
            found = compiled.findall(content)
            if found:
                matches.append((rel_path, len(found)))
        return matches
