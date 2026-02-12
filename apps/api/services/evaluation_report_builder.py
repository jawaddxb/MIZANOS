"""Evaluation report builder — generates markdown documents from analysis."""

from apps.api.schemas.repo_evaluator import (
    EvaluationDocument,
    PatternFinding,
    StructureInfo,
    TechStackInfo,
)
from apps.api.services.evaluation_report_sections import (
    build_gap_analysis,
    build_lovable_section,
    build_migration_roadmap,
    file_table,
    pattern_assessment,
    score_verdict,
    severity_badge,
    verdict_detail,
)


class EvaluationReportBuilder:
    """Builds markdown evaluation documents from analysis results."""

    def build(
        self,
        tech: TechStackInfo,
        structure: StructureInfo,
        patterns: list[PatternFinding],
        score: int,
        lovable_manifest: object | None = None,
    ) -> list[EvaluationDocument]:
        docs: list[EvaluationDocument] = [
            self._build_executive_summary(tech, structure, patterns, score),
            self._build_structure_report(structure),
            self._build_patterns_report(patterns),
            build_gap_analysis(structure, patterns),
            build_migration_roadmap(structure, patterns),
        ]
        if lovable_manifest is not None:
            docs.append(build_lovable_section(lovable_manifest))
        return docs

    def _build_executive_summary(
        self, tech: TechStackInfo, structure: StructureInfo,
        patterns: list[PatternFinding], score: int,
    ) -> EvaluationDocument:
        verdict = score_verdict(score)
        langs = ", ".join(tech.languages) or "None detected"
        fws = ", ".join(tech.frameworks) or "None detected"
        dbs = ", ".join(tech.databases) or "None detected"
        notable = ", ".join(tech.notable_deps[:10]) or "None"
        critical = sum(1 for p in patterns if p.severity == "critical")
        needs_change = sum(1 for p in patterns if p.severity == "needs_change")
        aligned = sum(1 for p in patterns if p.severity == "aligned")

        content = f"""# Executive Summary

## Alignment Score: {score}/100 — {verdict}

| Metric | Value |
|--------|-------|
| Languages | {langs} |
| Frameworks | {fws} |
| Databases | {dbs} |
| Total Files | {structure.total_files:,} |
| Total LOC | {structure.total_loc:,} |
| Directory Pattern | {structure.directory_pattern} |
| Barrel Files | {"Yes" if structure.has_barrel_files else "No"} |

## Pattern Summary

| Severity | Count |
|----------|-------|
| Aligned | {aligned} |
| Needs Change | {needs_change} |
| Critical | {critical} |

## Notable Dependencies

{notable}

## Verdict

{verdict_detail(score, structure, patterns)}
"""
        return EvaluationDocument(
            title="Executive Summary", slug="executive-summary",
            content=content, order=0,
        )

    def _build_structure_report(
        self, structure: StructureInfo,
    ) -> EvaluationDocument:
        over_300 = file_table(
            structure.files_over_300_loc,
            "Files Over 300 LOC (Mizan Flow Limit)",
        )
        hooks = file_table(
            structure.hooks_over_150_loc,
            "Hooks Over 150 LOC (Mizan Flow Limit)",
        )
        assessment = pattern_assessment(structure.directory_pattern)
        barrel_msg = (
            "Barrel/index files detected — the project already uses "
            "module re-exports."
            if structure.has_barrel_files
            else "No barrel files found. Mizan Flow requires barrel files "
            "(`index.ts`, `__init__.py`) for clean imports."
        )

        content = f"""# Structure Analysis

## Directory Organization

**Detected Pattern:** {structure.directory_pattern}

{assessment}

## File Size Compliance

Mizan Flow enforces **300 LOC max** per file and **150 LOC max** per hook.

{over_300}

{hooks}

## Barrel Files

{barrel_msg}
"""
        return EvaluationDocument(
            title="Structure Analysis", slug="structure-analysis",
            content=content, order=1,
        )

    def _build_patterns_report(
        self, patterns: list[PatternFinding],
    ) -> EvaluationDocument:
        categories: dict[str, list[PatternFinding]] = {}
        for p in patterns:
            categories.setdefault(p.category, []).append(p)

        sections: list[str] = []
        for cat, items in sorted(categories.items()):
            cat_title = cat.replace("_", " ").title()
            rows = "\n".join(
                f"| {p.pattern} | {p.occurrences} | "
                f"{severity_badge(p.severity)} | {p.recommendation} |"
                for p in items
            )
            sections.append(f"""## {cat_title}

| Pattern | Occurrences | Severity | Recommendation |
|---------|------------|----------|----------------|
{rows}
""")

        content = "# Code Patterns Report\n\n" + "\n".join(sections)
        return EvaluationDocument(
            title="Code Patterns Report", slug="code-patterns",
            content=content, order=2,
        )
