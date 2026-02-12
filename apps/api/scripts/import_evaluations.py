"""Import engineer evaluations from datapop/Evaluations.xlsx.

Creates profiles for engineers that don't exist, then imports evaluations.
"""

import asyncio
import uuid
from pathlib import Path

import openpyxl
from sqlalchemy import select

from apps.api.models.user import Profile
from apps.api.schemas.evaluation import EvaluationCreate
from apps.api.services.evaluation_service import EvaluationService
from packages.common.db.session import async_session_factory

EXCEL_PATH = Path(__file__).resolve().parents[3] / "datapop" / "Evaluations.xlsx"
SHEET_NAME = "All Resources Assessment"
PERIOD = "2025 Initial"

# Column indices (0-based) in the Excel sheet
COL_MAP = {
    "name": 0,
    "code_quality": 2,
    "architecture": 3,
    "ai_skills": 4,
    "debugging": 5,
    "understanding_requirements": 6,
    "ui_ux_design": 7,
    "communication": 8,
    "team_behavior": 9,
    "reliability": 10,
    "ownership": 11,
    "business_impact": 12,
    "leadership": 13,
}


def parse_score(value: object) -> float:
    """Convert cell value to float, treating NA/None as 0."""
    if value is None or value == "NA" or value == "N/A":
        return 0.0
    return float(value)


def clean_name(name: str) -> str:
    """Remove suffixes like (New) from names."""
    return name.replace("(New)", "").strip()


async def find_or_create_profile(
    session, name: str, profiles_cache: dict[str, Profile]
) -> Profile:
    """Find existing profile by name or create a new one."""
    cleaned = clean_name(name)
    lookup = cleaned.lower()

    # Exact match
    if lookup in profiles_cache:
        return profiles_cache[lookup]

    # Partial match
    for pname, p in profiles_cache.items():
        if lookup in pname or pname in lookup:
            return p

    # Create new profile
    email_slug = cleaned.lower().replace(" ", ".").replace("'", "")
    profile = Profile(
        user_id=str(uuid.uuid4()),
        full_name=cleaned,
        email=f"{email_slug}@mizan.team",
        role="engineer",
        status="active",
        availability="available",
        current_projects=0,
        max_projects=3,
    )
    session.add(profile)
    await session.flush()
    await session.refresh(profile)
    profiles_cache[lookup] = profile
    return profile


async def main() -> None:
    wb = openpyxl.load_workbook(str(EXCEL_PATH), data_only=True)
    ws = wb[SHEET_NAME]

    rows = list(ws.iter_rows(min_row=3, max_col=14, values_only=True))
    # Stop at scoring guide or non-person rows
    engineers = []
    for r in rows:
        if r[0] is None:
            continue
        try:
            float(r[2])  # code_quality must be numeric
        except (TypeError, ValueError):
            break
        engineers.append(r)
    print(f"Found {len(engineers)} engineers in Excel")

    created_profiles = 0
    imported_evals = 0

    async with async_session_factory() as session:
        service = EvaluationService(session)

        # Load existing profiles
        result = await session.execute(select(Profile))
        profiles_cache: dict[str, Profile] = {
            (p.full_name or "").strip().lower(): p
            for p in result.scalars().all()
        }
        existing_count = len(profiles_cache)
        print(f"Found {existing_count} existing profiles in database")

        for row in engineers:
            name = str(row[COL_MAP["name"]]).strip()
            was_cached = clean_name(name).lower() in profiles_cache

            profile = await find_or_create_profile(
                session, name, profiles_cache
            )

            if not was_cached:
                created_profiles += 1
                print(f"  NEW PROFILE: {profile.full_name} ({profile.email})")

            data = EvaluationCreate(
                evaluation_period=PERIOD,
                code_quality=parse_score(row[COL_MAP["code_quality"]]),
                architecture=parse_score(row[COL_MAP["architecture"]]),
                ai_skills=parse_score(row[COL_MAP["ai_skills"]]),
                debugging=parse_score(row[COL_MAP["debugging"]]),
                understanding_requirements=parse_score(
                    row[COL_MAP["understanding_requirements"]]
                ),
                ui_ux_design=parse_score(row[COL_MAP["ui_ux_design"]]),
                communication=parse_score(row[COL_MAP["communication"]]),
                team_behavior=parse_score(row[COL_MAP["team_behavior"]]),
                reliability=parse_score(row[COL_MAP["reliability"]]),
                ownership=parse_score(row[COL_MAP["ownership"]]),
                business_impact=parse_score(row[COL_MAP["business_impact"]]),
                leadership=parse_score(row[COL_MAP["leadership"]]),
            )

            await service.create_evaluation(profile.id, None, data)
            score = service._compute_overall_score(data)
            print(f"  EVAL: {profile.full_name} → score {score:.2f}")
            imported_evals += 1

        await session.commit()

    print(f"\nDone: {created_profiles} profiles created, {imported_evals} evaluations imported")


if __name__ == "__main__":
    asyncio.run(main())
