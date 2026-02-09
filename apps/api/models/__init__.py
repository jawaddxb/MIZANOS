"""SQLAlchemy models for all database tables."""

from .ai import AIChatMessage, AIChatSession
from .audit import Audit, RepoScanHistory, RepositoryAnalysis
from .deployment import DeploymentChecklistItem
from .document import (
    DocumentAccessLink,
    DocumentFolder,
    DocumentVersion,
    ExternalDocumentLink,
)
from .enums import AppRole, EnvironmentType, NotificationType, ProjectSourceType
from .knowledge import KnowledgeEntry
from .marketing import (
    MarketingChecklistItem,
    MarketingChecklistTemplate,
    MarketingCredential,
    MarketingDomain,
    MarketingSocialHandle,
)
from .notification import Notification
from .product import (
    Product,
    ProductDocument,
    ProductEnvironment,
    ProductManagementNote,
    ProductMember,
    ProductPartnerNote,
)
from .project import ProjectCompletion, ProjectStakeholder
from .qa import QACheck
from .settings import (
    FeaturePermission,
    GlobalIntegration,
    ManagementNoteAccess,
    Module,
    NationalHoliday,
    PermissionAuditLog,
    ProjectIntegration,
    RolePermission,
    StandardsRepository,
    TeamHoliday,
)
from .specification import Specification, SpecificationFeature, SpecificationSource
from .task import Task, TaskTemplate
from .user import (
    Profile,
    UserGithubConnection,
    UserNotificationPreference,
    UserPermissionOverride,
    UserRole,
)
from .vault import CompanyCredential

__all__ = [
    # Enums
    "AppRole",
    "EnvironmentType",
    "NotificationType",
    "ProjectSourceType",
    # AI
    "AIChatSession",
    "AIChatMessage",
    # Audit
    "Audit",
    "RepoScanHistory",
    "RepositoryAnalysis",
    # Deployment
    "DeploymentChecklistItem",
    # Document
    "DocumentFolder",
    "DocumentVersion",
    "DocumentAccessLink",
    "ExternalDocumentLink",
    # Knowledge
    "KnowledgeEntry",
    # Marketing
    "MarketingChecklistItem",
    "MarketingChecklistTemplate",
    "MarketingCredential",
    "MarketingDomain",
    "MarketingSocialHandle",
    # Notification
    "Notification",
    # Product
    "Product",
    "ProductMember",
    "ProductEnvironment",
    "ProductDocument",
    "ProductManagementNote",
    "ProductPartnerNote",
    # Project
    "ProjectCompletion",
    "ProjectStakeholder",
    # QA
    "QACheck",
    # Settings
    "Module",
    "FeaturePermission",
    "RolePermission",
    "PermissionAuditLog",
    "StandardsRepository",
    "GlobalIntegration",
    "ProjectIntegration",
    "NationalHoliday",
    "TeamHoliday",
    "ManagementNoteAccess",
    # Specification
    "Specification",
    "SpecificationFeature",
    "SpecificationSource",
    # Task
    "Task",
    "TaskTemplate",
    # User
    "Profile",
    "UserRole",
    "UserPermissionOverride",
    "UserNotificationPreference",
    "UserGithubConnection",
    # Vault
    "CompanyCredential",
]
