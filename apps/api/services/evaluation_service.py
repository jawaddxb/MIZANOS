"""Evaluation service."""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.evaluation import EngineerEvaluation
from apps.api.models.product import Product
from apps.api.models.project import ProjectCompletion
from apps.api.schemas.evaluation import (
    EvaluationCreate,
    EvaluationSummary,
    ProjectCompletionCreate,
)


class EvaluationService:
    """Engineer evaluation business logic."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def _compute_overall_score(self, data: EvaluationCreate) -> float:
        tech_avg = (
            data.code_quality + data.architecture + data.ai_skills + data.debugging
        ) / 4
        product_avg = (data.understanding_requirements + data.ui_ux_design) / 2
        comms_avg = (data.communication + data.team_behavior + data.reliability) / 3
        ownership_avg = (data.ownership + data.business_impact + data.leadership) / 3
        return tech_avg * 0.35 + product_avg * 0.25 + comms_avg * 0.20 + ownership_avg * 0.20

    async def create_evaluation(
        self, profile_id: UUID, evaluated_by: UUID | None, data: EvaluationCreate
    ) -> EngineerEvaluation:
        overall = self._compute_overall_score(data)
        evaluation = EngineerEvaluation(
            profile_id=profile_id,
            evaluated_by=evaluated_by,
            overall_score=overall,
            **data.model_dump(),
        )
        self.session.add(evaluation)
        await self.session.flush()
        await self.session.refresh(evaluation)
        return evaluation

    async def get_evaluations(self, profile_id: UUID) -> list[EngineerEvaluation]:
        stmt = (
            select(EngineerEvaluation)
            .where(EngineerEvaluation.profile_id == profile_id)
            .order_by(EngineerEvaluation.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_latest_evaluation(
        self, profile_id: UUID
    ) -> EngineerEvaluation | None:
        stmt = (
            select(EngineerEvaluation)
            .where(EngineerEvaluation.profile_id == profile_id)
            .order_by(EngineerEvaluation.created_at.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_latest_evaluations(self) -> list[EvaluationSummary]:
        subq = (
            select(
                EngineerEvaluation.profile_id,
                func.max(EngineerEvaluation.created_at).label("max_created"),
            )
            .group_by(EngineerEvaluation.profile_id)
            .subquery()
        )
        stmt = select(EngineerEvaluation).join(
            subq,
            (EngineerEvaluation.profile_id == subq.c.profile_id)
            & (EngineerEvaluation.created_at == subq.c.max_created),
        )
        result = await self.session.execute(stmt)
        evals = result.scalars().all()
        summaries = []
        for e in evals:
            proj_stmt = select(
                func.count(ProjectCompletion.id),
                func.avg(ProjectCompletion.score),
            ).where(ProjectCompletion.profile_id == e.profile_id)
            proj_result = await self.session.execute(proj_stmt)
            proj_row = proj_result.one()
            summary = self._to_summary(e)
            summary.projects_completed = proj_row[0] or 0
            summary.avg_project_score = float(proj_row[1]) if proj_row[1] else 0.0
            summaries.append(summary)
        return summaries

    async def create_project_completion(
        self, profile_id: UUID, created_by: UUID | None, data: ProjectCompletionCreate
    ) -> ProjectCompletion:
        dump = data.model_dump(exclude_unset=True)
        score = dump.get("score")
        if score is None:
            ratings = [
                v
                for k in ("quality_rating", "timeliness_rating", "collaboration_rating")
                if (v := dump.get(k)) is not None
            ]
            score = sum(ratings) / len(ratings) if ratings else 0
        dump["score"] = score
        completion = ProjectCompletion(
            profile_id=profile_id, created_by=created_by, **dump
        )
        self.session.add(completion)
        await self.session.flush()
        await self.session.refresh(completion)
        return completion

    async def get_project_completions(self, profile_id: UUID) -> list[dict]:
        stmt = (
            select(ProjectCompletion, Product.name.label("product_name"))
            .join(Product, ProjectCompletion.product_id == Product.id)
            .where(ProjectCompletion.profile_id == profile_id)
            .order_by(ProjectCompletion.completed_at.desc())
        )
        result = await self.session.execute(stmt)
        rows = result.all()
        return [
            {**row[0].__dict__, "product_name": row[1]}
            for row in rows
        ]

    async def get_evaluation_summary(self, profile_id: UUID) -> dict:
        latest = await self.get_latest_evaluation(profile_id)
        completions_stmt = (
            select(
                func.count(ProjectCompletion.id),
                func.avg(ProjectCompletion.score),
            ).where(ProjectCompletion.profile_id == profile_id)
        )
        result = await self.session.execute(completions_stmt)
        row = result.one()
        summary: dict = {
            "profile_id": profile_id,
            "total_projects": row[0] or 0,
            "avg_project_score": float(row[1]) if row[1] else 0,
        }
        if latest:
            summary.update(self._to_summary(latest).model_dump())
        return summary

    def _to_summary(self, e: EngineerEvaluation) -> EvaluationSummary:
        tech_avg = (e.code_quality + e.architecture + e.ai_skills + e.debugging) / 4
        product_avg = (e.understanding_requirements + e.ui_ux_design) / 2
        comms_avg = (e.communication + e.team_behavior + e.reliability) / 3
        ownership_avg = (e.ownership + e.business_impact + e.leadership) / 3
        return EvaluationSummary(
            profile_id=e.profile_id,
            overall_score=e.overall_score,
            tech_avg=round(tech_avg, 2),
            product_avg=round(product_avg, 2),
            comms_avg=round(comms_avg, 2),
            ownership_avg=round(ownership_avg, 2),
            evaluation_period=e.evaluation_period,
        )
