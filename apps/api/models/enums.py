"""Shared enums for all SQLAlchemy models."""

import enum


class AppRole(str, enum.Enum):
    BUSINESS_OWNER = "business_owner"
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    PROJECT_MANAGER = "project_manager"
    ENGINEER = "engineer"
    BUSINESS_DEVELOPMENT = "business_development"
    MARKETING = "marketing"
    OPERATIONS = "operations"


class EnvironmentType(str, enum.Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class NotificationType(str, enum.Enum):
    TASK_ASSIGNED = "task_assigned"
    PRODUCT_STATUS_CHANGED = "product_status_changed"
    QA_CHECK_FAILED = "qa_check_failed"
    SPECIFICATION_READY = "specification_ready"
    STAGE_CHANGED = "stage_changed"
    REPO_SCAN_COMPLETED = "repo_scan_completed"
    PRODUCT_MEMBER_ASSIGNED = "product_member_assigned"


class ProductMemberRole(str, enum.Enum):
    PROJECT_MANAGER = "project_manager"
    MARKETING = "marketing"
    BUSINESS_OWNER = "business_owner"
    AI_ENGINEER = "ai_engineer"


REQUIRED_TEAM_COMPOSITION = {
    ProductMemberRole.PROJECT_MANAGER: 1,
    ProductMemberRole.MARKETING: 1,
    ProductMemberRole.BUSINESS_OWNER: 1,
    ProductMemberRole.AI_ENGINEER: 1,
}


class ProjectSourceType(str, enum.Enum):
    LOVABLE_PORT = "lovable_port"
    REPLIT_PORT = "replit_port"
    GITHUB_UNSCAFFOLDED = "github_unscaffolded"
    GREENFIELD = "greenfield"
    EXTERNAL_HANDOFF = "external_handoff"
    IN_PROGRESS = "in_progress"
    IN_PROGRESS_STANDARDS = "in_progress_standards"
    IN_PROGRESS_LEGACY = "in_progress_legacy"
