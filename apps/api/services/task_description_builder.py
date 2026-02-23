"""Build structured task descriptions from specification features."""

from apps.api.models.specification import SpecificationFeature


def build_task_description(
    feature: SpecificationFeature,
    spec_content: dict | None,
) -> str:
    """Compose a plain-text task description from feature data + spec context."""
    sections: list[str] = []
    spec = spec_content or {}

    if feature.description:
        sections.append(feature.description)

    criteria = feature.acceptance_criteria
    if isinstance(criteria, list) and criteria:
        items = "\n".join(f"  - {c}" for c in criteria)
        sections.append(f"Acceptance Criteria:\n{items}")

    tech_spec = spec.get("technicalSpec", {})
    tech_stack = spec.get("techStack", [])
    tech_lines: list[str] = []
    if tech_spec.get("architecture"):
        tech_lines.append(f"Architecture: {tech_spec['architecture']}")
    if tech_stack:
        tech_lines.append(f"Tech Stack: {', '.join(tech_stack)}")
    if tech_lines:
        sections.append("Technical Context:\n" + "\n".join(tech_lines))

    func_spec = spec.get("functionalSpec", {})
    context_lines: list[str] = []
    stories = func_spec.get("userStories", [])
    if stories:
        story_items = "\n".join(f"  - {s}" for s in stories[:5])
        context_lines.append(f"User Stories:\n{story_items}")
    rules = func_spec.get("businessRules", [])
    if rules:
        rule_items = "\n".join(f"  - {r}" for r in rules[:5])
        context_lines.append(f"Business Rules:\n{rule_items}")
    if context_lines:
        sections.append(
            "Related Spec Context:\n" + "\n\n".join(context_lines)
        )

    if not sections:
        return (
            f"Implement {feature.name} as defined in the project specification."
        )

    return "\n\n".join(sections)
