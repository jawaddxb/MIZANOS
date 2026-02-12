"""Evaluation schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from apps.api.schemas.base import BaseSchema


class EvaluationCreate(BaseSchema):
    evaluation_period: str
    code_quality: float
    architecture: float
    ai_skills: float
    debugging: float
    understanding_requirements: float
    ui_ux_design: float
    communication: float
    team_behavior: float
    reliability: float
    ownership: float
    business_impact: float
    leadership: float
    notes: Optional[str] = None


class EvaluationUpdate(BaseSchema):
    evaluation_period: Optional[str] = None
    code_quality: Optional[float] = None
    architecture: Optional[float] = None
    ai_skills: Optional[float] = None
    debugging: Optional[float] = None
    understanding_requirements: Optional[float] = None
    ui_ux_design: Optional[float] = None
    communication: Optional[float] = None
    team_behavior: Optional[float] = None
    reliability: Optional[float] = None
    ownership: Optional[float] = None
    business_impact: Optional[float] = None
    leadership: Optional[float] = None
    notes: Optional[str] = None


class EvaluationResponse(BaseSchema):
    id: UUID
    profile_id: UUID
    evaluated_by: Optional[UUID] = None
    evaluation_period: str
    code_quality: float
    architecture: float
    ai_skills: float
    debugging: float
    understanding_requirements: float
    ui_ux_design: float
    communication: float
    team_behavior: float
    reliability: float
    ownership: float
    business_impact: float
    leadership: float
    overall_score: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class EvaluationSummary(BaseSchema):
    profile_id: UUID
    overall_score: float
    tech_avg: float
    product_avg: float
    comms_avg: float
    ownership_avg: float
    evaluation_period: str
    projects_completed: int = 0
    avg_project_score: float = 0.0


class ProjectCompletionCreate(BaseSchema):
    product_id: UUID
    score: Optional[float] = None
    quality_rating: Optional[float] = None
    timeliness_rating: Optional[float] = None
    collaboration_rating: Optional[float] = None
    feedback: Optional[str] = None
    role_on_project: Optional[str] = None
    skills_demonstrated: Optional[list[str]] = None


class ProjectCompletionResponse(BaseSchema):
    id: UUID
    product_id: UUID
    profile_id: UUID
    created_by: Optional[UUID] = None
    score: float
    quality_rating: Optional[float] = None
    timeliness_rating: Optional[float] = None
    collaboration_rating: Optional[float] = None
    feedback: Optional[str] = None
    role_on_project: Optional[str] = None
    skills_demonstrated: Optional[list[str]] = None
    completed_at: datetime
    created_at: datetime
    updated_at: datetime
    product_name: Optional[str] = None
