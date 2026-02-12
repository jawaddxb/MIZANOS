"""Report section builders and helpers for the evaluation report."""

from apps.api.schemas.repo_evaluator import (
    EvaluationDocument,
    FileStats,
    PatternFinding,
    StructureInfo,
)


# ── Helpers ──────────────────────────────────────────────────────────


def score_verdict(score: int) -> str:
    """Return a human-readable verdict for a given alignment score."""
    if score >= 80:
        return "Well Aligned"
    if score >= 60:
        return "Partially Aligned"
    if score >= 40:
        return "Significant Gaps"
    return "Major Rework Needed"


def verdict_detail(
    score: int, structure: StructureInfo,
    patterns: list[PatternFinding],
) -> str:
    """Return a detailed verdict paragraph."""
    if score >= 80:
        return (
            "This repository is well-aligned with Mizan Flow conventions. "
            "Minor adjustments may be needed for full compliance."
        )
    if score >= 60:
        return (
            "This repository follows some Mizan Flow conventions but has "
            "gaps that require attention before migration."
        )
    critical = sum(1 for p in patterns if p.severity == "critical")
    return (
        f"This repository has {critical} critical pattern(s) and structural "
        "gaps. A phased migration approach is recommended."
    )


def severity_badge(severity: str) -> str:
    """Return display label for a severity level."""
    badges = {
        "aligned": "Aligned",
        "needs_change": "Needs Change",
        "critical": "Critical",
    }
    return badges.get(severity, severity)


def file_table(files: list[FileStats], title: str) -> str:
    """Render a markdown table of file stats."""
    if not files:
        return f"### {title}\n\nAll files within limits."
    rows = "\n".join(
        f"| `{f.path}` | {f.loc} | {f.language} |"
        for f in files[:20]
    )
    return f"""### {title}

| File | LOC | Language |
|------|-----|----------|
{rows}
"""


def pattern_assessment(pattern: str) -> str:
    """Return a narrative assessment for a directory pattern."""
    assessments = {
        "atomic": (
            "The project already uses **Atomic Design** — this aligns "
            "with Mizan Flow conventions."
        ),
        "feature-based": (
            "The project uses **feature-based** organization. Migration to "
            "Atomic Design (atoms/molecules/organisms/templates) is "
            "recommended for Mizan Flow compliance."
        ),
        "flat": (
            "The project has a **flat** structure with minimal organization. "
            "Significant restructuring to Atomic Design is needed."
        ),
        "mixed": (
            "The project uses a **mixed** pattern. Consolidation into "
            "Atomic Design is recommended."
        ),
    }
    return assessments.get(pattern, "Unknown pattern.")


# ── Gap Analysis ─────────────────────────────────────────────────────


def build_gap_analysis(
    structure: StructureInfo, patterns: list[PatternFinding],
) -> EvaluationDocument:
    """Build the alignment gap analysis document."""
    gaps: list[str] = []

    if structure.directory_pattern != "atomic":
        gaps.append(
            "- **Directory structure**: Current pattern is "
            f"`{structure.directory_pattern}`, Mizan Flow requires "
            "`atomic` design (atoms/molecules/organisms/templates)",
        )
    if not structure.has_barrel_files:
        gaps.append(
            "- **Barrel files**: Missing — add `index.ts` / "
            "`__init__.py` barrel exports for clean imports",
        )
    if structure.files_over_300_loc:
        gaps.append(
            f"- **File size**: {len(structure.files_over_300_loc)} file(s) "
            "exceed the 300 LOC limit and need splitting",
        )
    if structure.hooks_over_150_loc:
        gaps.append(
            f"- **Hook size**: {len(structure.hooks_over_150_loc)} hook(s) "
            "exceed the 150 LOC limit and need splitting",
        )

    for p in patterns:
        if p.severity in ("critical", "needs_change"):
            gaps.append(
                f"- **{p.category} ({p.pattern})**: {p.recommendation}",
            )

    gap_list = "\n".join(gaps) if gaps else "No significant gaps found."

    content = f"""# Alignment Gap Analysis

## Current State vs. Mizan Flow Conventions

{gap_list}

## Convention Reference

| Convention | Requirement |
|-----------|------------|
| Max file LOC | 300 |
| Max hook LOC | 150 |
| Component structure | Atomic Design |
| API layer | Repository Pattern |
| CSS | Tailwind + CSS variables |
| TypeScript | Strict mode, no `any` |
| Imports | Barrel files |
"""
    return EvaluationDocument(
        title="Alignment Gap Analysis", slug="gap-analysis",
        content=content, order=3,
    )


# ── Migration Roadmap ────────────────────────────────────────────────


def build_migration_roadmap(
    structure: StructureInfo, patterns: list[PatternFinding],
) -> EvaluationDocument:
    """Build the phased migration roadmap document."""
    tasks: list[str] = []
    order = 1

    critical = [p for p in patterns if p.severity == "critical"]
    if critical:
        tasks.append("## Phase 1: Critical Fixes\n")
        for p in critical:
            tasks.append(
                f"{order}. **{p.pattern}** ({p.occurrences} occurrences) "
                f"— {p.recommendation}",
            )
            order += 1

    structural: list[str] = []
    if structure.directory_pattern != "atomic":
        structural.append(
            f"{order}. Restructure directories from "
            f"`{structure.directory_pattern}` to atomic design",
        )
        order += 1
    if structure.files_over_300_loc:
        structural.append(
            f"{order}. Split {len(structure.files_over_300_loc)} "
            "oversized files (>300 LOC)",
        )
        order += 1
    if structure.hooks_over_150_loc:
        structural.append(
            f"{order}. Split {len(structure.hooks_over_150_loc)} "
            "oversized hooks (>150 LOC)",
        )
        order += 1
    if not structure.has_barrel_files:
        structural.append(f"{order}. Add barrel files for module exports")
        order += 1

    if structural:
        tasks.append("## Phase 2: Structural Alignment\n")
        tasks.extend(structural)

    needs_change = [p for p in patterns if p.severity == "needs_change"]
    if needs_change:
        tasks.append("\n## Phase 3: Pattern Improvements\n")
        for p in needs_change:
            tasks.append(
                f"{order}. **{p.pattern}** ({p.occurrences} occurrences) "
                f"— {p.recommendation}",
            )
            order += 1

    task_list = "\n".join(tasks) if tasks else "No migration tasks needed."

    content = f"""# Migration Roadmap

{task_list}

---

> Estimated total tasks: {order - 1}
"""
    return EvaluationDocument(
        title="Migration Roadmap", slug="migration-roadmap",
        content=content, order=4,
    )


# ── Lovable Section ─────────────────────────────────────────────────


def build_lovable_section(manifest: object) -> EvaluationDocument:
    """Build the Lovable/Supabase migration report document."""
    summary = getattr(manifest, "summary", None)
    domains = getattr(manifest, "domains", [])

    stats_lines: list[str] = []
    if summary:
        for field in [
            "total_tables", "total_queries", "total_edge_functions",
            "total_routes", "total_components", "total_hooks",
            "total_rpc_calls", "total_storage_buckets",
            "total_realtime_subscriptions", "total_env_vars",
        ]:
            val = getattr(summary, field, 0)
            label = field.replace("total_", "").replace("_", " ").title()
            stats_lines.append(f"| {label} | {val} |")

    stats_table = "\n".join(stats_lines) if stats_lines else "No stats"
    domain_list = ", ".join(f"`{d}`" for d in domains) if domains else "None"

    content = f"""# Lovable/Supabase Migration Report

This repository was detected as a **Lovable/Supabase** project. The existing
Lovable Extractor was invoked to produce a detailed manifest.

## Manifest Summary

| Category | Count |
|----------|-------|
{stats_table}

## Detected Domains

{domain_list}

## Next Steps

Use the **Port Task Generator** (separate feature) to generate migration tasks
from this manifest. Navigate to a product's overview and use the Port Task
Generator tool for full task generation.
"""
    return EvaluationDocument(
        title="Lovable Migration Report", slug="lovable-report",
        content=content, order=5,
    )
