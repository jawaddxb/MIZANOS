"""Engineer evaluation models."""

import uuid
from typing import Optional

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class EngineerEvaluation(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "engineer_evaluations"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False
    )
    evaluated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True
    )
    evaluation_period: Mapped[str] = mapped_column(String, nullable=False)

    # Technical Skills (35%)
    code_quality: Mapped[float] = mapped_column(Float, default=0)
    architecture: Mapped[float] = mapped_column(Float, default=0)
    ai_skills: Mapped[float] = mapped_column(Float, default=0)
    debugging: Mapped[float] = mapped_column(Float, default=0)

    # Product Skills (25%)
    understanding_requirements: Mapped[float] = mapped_column(Float, default=0)
    ui_ux_design: Mapped[float] = mapped_column(Float, default=0)

    # Communication (20%)
    communication: Mapped[float] = mapped_column(Float, default=0)
    team_behavior: Mapped[float] = mapped_column(Float, default=0)
    reliability: Mapped[float] = mapped_column(Float, default=0)

    # Ownership (20%)
    ownership: Mapped[float] = mapped_column(Float, default=0)
    business_impact: Mapped[float] = mapped_column(Float, default=0)
    leadership: Mapped[float] = mapped_column(Float, default=0)

    # Computed
    overall_score: Mapped[float] = mapped_column(Float, default=0)

    notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)
