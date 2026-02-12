"""Tech stack analyzer — detects languages, frameworks, and dependencies."""

import json
from pathlib import Path

from apps.api.schemas.repo_evaluator import TechStackInfo

# Extension → language mapping
_EXT_LANG: dict[str, str] = {
    ".py": "Python", ".ts": "TypeScript", ".tsx": "TypeScript",
    ".js": "JavaScript", ".jsx": "JavaScript", ".rb": "Ruby",
    ".go": "Go", ".rs": "Rust", ".java": "Java", ".kt": "Kotlin",
    ".php": "PHP", ".cs": "C#", ".swift": "Swift", ".dart": "Dart",
    ".vue": "Vue", ".svelte": "Svelte",
}

# Framework detection: (file_to_check, dep_key_or_none, framework_name)
_JS_FRAMEWORK_DEPS: dict[str, str] = {
    "next": "Next.js", "react": "React", "vue": "Vue.js",
    "nuxt": "Nuxt", "@angular/core": "Angular", "svelte": "Svelte",
    "express": "Express", "fastify": "Fastify", "koa": "Koa",
    "hono": "Hono", "remix": "Remix", "gatsby": "Gatsby",
    "astro": "Astro", "@nestjs/core": "NestJS",
}

_PY_FRAMEWORK_MARKERS: dict[str, str] = {
    "fastapi": "FastAPI", "django": "Django", "flask": "Flask",
    "starlette": "Starlette", "tornado": "Tornado",
    "sanic": "Sanic", "aiohttp": "aiohttp",
}

_DB_DEPS: dict[str, str] = {
    "prisma": "PostgreSQL (Prisma)", "drizzle-orm": "PostgreSQL (Drizzle)",
    "@supabase/supabase-js": "Supabase (PostgreSQL)",
    "mongoose": "MongoDB", "mongodb": "MongoDB",
    "firebase": "Firebase", "typeorm": "PostgreSQL (TypeORM)",
    "sequelize": "PostgreSQL (Sequelize)", "knex": "SQL (Knex)",
    "sqlalchemy": "SQLAlchemy", "psycopg2": "PostgreSQL",
    "asyncpg": "PostgreSQL", "pymongo": "MongoDB",
    "django": "PostgreSQL (Django ORM)", "peewee": "SQL (Peewee)",
    "tortoise-orm": "SQL (Tortoise)", "redis": "Redis",
}

_NOTABLE_DEPS: set[str] = {
    "tailwindcss", "@tanstack/react-query", "zustand", "jotai",
    "redux", "@reduxjs/toolkit", "mobx", "axios", "zod",
    "react-hook-form", "formik", "stripe", "socket.io",
    "graphql", "@apollo/client", "trpc", "shadcn",
    "radix-ui", "headlessui", "chakra-ui", "material-ui",
    "styled-components", "emotion", "sass", "less",
}

_SKIP_DIRS = {"node_modules", ".git", "__pycache__", ".venv", "venv",
              "dist", "build", ".next", ".nuxt", "target", "vendor"}


class TechStackAnalyzer:
    """Detects the technology stack of a repository."""

    def analyze(self, repo_path: Path) -> TechStackInfo:
        languages = self._detect_languages(repo_path)
        frameworks, pkg_managers, databases, notable = self._detect_from_manifests(repo_path)
        return TechStackInfo(
            languages=languages,
            frameworks=frameworks,
            package_managers=pkg_managers,
            databases=databases,
            notable_deps=notable,
        )

    def _detect_languages(self, repo_path: Path) -> list[str]:
        """Detect languages by file extension distribution."""
        counts: dict[str, int] = {}
        for f in self._walk_files(repo_path):
            lang = _EXT_LANG.get(f.suffix.lower())
            if lang:
                counts[lang] = counts.get(lang, 0) + 1
        return sorted(counts, key=counts.get, reverse=True)  # type: ignore[arg-type]

    def _detect_from_manifests(
        self, repo_path: Path,
    ) -> tuple[list[str], list[str], list[str], list[str]]:
        """Detect frameworks, package managers, databases, notable deps."""
        frameworks: list[str] = []
        pkg_managers: list[str] = []
        databases: list[str] = []
        notable: list[str] = []

        # JavaScript/TypeScript ecosystem
        pkg_json = repo_path / "package.json"
        if pkg_json.exists():
            pkg_managers.append("npm/yarn/pnpm")
            self._scan_package_json(pkg_json, frameworks, databases, notable)

        # Python ecosystem
        if (repo_path / "requirements.txt").exists():
            pkg_managers.append("pip")
            self._scan_requirements(
                repo_path / "requirements.txt", frameworks, databases,
            )
        if (repo_path / "pyproject.toml").exists():
            pkg_managers.append("pyproject.toml")
            self._scan_pyproject(repo_path / "pyproject.toml", frameworks, databases)
        if (repo_path / "Pipfile").exists():
            pkg_managers.append("Pipfile")

        # Other ecosystems
        if (repo_path / "Cargo.toml").exists():
            pkg_managers.append("Cargo")
        if (repo_path / "go.mod").exists():
            pkg_managers.append("Go modules")
        if (repo_path / "Gemfile").exists():
            pkg_managers.append("Bundler")
            frameworks.append("Ruby on Rails")
        if (repo_path / "composer.json").exists():
            pkg_managers.append("Composer")
            frameworks.append("PHP")

        # Detect DB from env files
        self._scan_env_for_db(repo_path, databases)

        return (
            list(dict.fromkeys(frameworks)),
            list(dict.fromkeys(pkg_managers)),
            list(dict.fromkeys(databases)),
            list(dict.fromkeys(notable)),
        )

    def _scan_package_json(
        self, path: Path, frameworks: list[str],
        databases: list[str], notable: list[str],
    ) -> None:
        try:
            data = json.loads(path.read_text())
        except (json.JSONDecodeError, UnicodeDecodeError):
            return
        all_deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
        for dep, fw_name in _JS_FRAMEWORK_DEPS.items():
            if dep in all_deps:
                frameworks.append(fw_name)
        for dep, db_name in _DB_DEPS.items():
            if dep in all_deps:
                databases.append(db_name)
        for dep in all_deps:
            if dep in _NOTABLE_DEPS or dep.startswith("@radix-ui/"):
                notable.append(dep)

    def _scan_requirements(
        self, path: Path, frameworks: list[str], databases: list[str],
    ) -> None:
        try:
            content = path.read_text().lower()
        except (UnicodeDecodeError, PermissionError):
            return
        for dep, fw_name in _PY_FRAMEWORK_MARKERS.items():
            if dep in content:
                frameworks.append(fw_name)
        for dep, db_name in _DB_DEPS.items():
            if dep in content:
                databases.append(db_name)

    def _scan_pyproject(
        self, path: Path, frameworks: list[str], databases: list[str],
    ) -> None:
        try:
            content = path.read_text().lower()
        except (UnicodeDecodeError, PermissionError):
            return
        for dep, fw_name in _PY_FRAMEWORK_MARKERS.items():
            if dep in content:
                frameworks.append(fw_name)
        for dep, db_name in _DB_DEPS.items():
            if dep in content:
                databases.append(db_name)

    def _scan_env_for_db(self, repo_path: Path, databases: list[str]) -> None:
        """Look for database connection strings in .env files."""
        db_markers = {
            "DATABASE_URL": "PostgreSQL", "MONGO": "MongoDB",
            "REDIS_URL": "Redis", "MYSQL": "MySQL",
        }
        for env_name in (".env", ".env.example", ".env.local"):
            env_file = repo_path / env_name
            if not env_file.exists():
                continue
            try:
                content = env_file.read_text()
            except (UnicodeDecodeError, PermissionError):
                continue
            for marker, db_name in db_markers.items():
                if marker in content and db_name not in databases:
                    databases.append(db_name)

    def _walk_files(self, repo_path: Path) -> list[Path]:
        """Walk repo skipping common non-source directories."""
        files: list[Path] = []
        for item in repo_path.rglob("*"):
            if any(skip in item.parts for skip in _SKIP_DIRS):
                continue
            if item.is_file():
                files.append(item)
        return files
