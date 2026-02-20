"""seed_permissions_and_backfill

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-02-20 10:01:00.000000
"""
from typing import Sequence, Union

from alembic import op

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# 24 features organised by category
FEATURES = [
    # (feature_key, feature_name, category, description, sort_order)
    ("intake_access", "Product Intake", "admin", "Create new products", 1),
    ("dashboard_view", "Dashboard", "navigation", "View main dashboard", 2),
    ("project_overview", "Project Overview", "navigation", "View project overview page", 3),
    ("sources_tab", "Sources", "project", "View specification sources", 4),
    ("kanban_view", "Kanban Board (View)", "project", "View kanban board", 5),
    ("kanban_edit", "Kanban Board (Edit)", "project", "Create and move tasks", 6),
    ("specification_view", "Specification (View)", "project", "View product specification", 7),
    ("specification_edit", "Specification (Edit)", "project", "Edit product specification", 8),
    ("qa_manage", "QA Management", "project", "Manage QA checklists and checks", 9),
    ("audit_view", "Audit Log", "project", "View product audit trail", 10),
    ("environments_view", "Environments", "project", "View deployment environments", 11),
    ("documents_view", "Documents (View)", "project", "View project documents", 12),
    ("documents_edit", "Documents (Edit)", "project", "Upload and edit documents", 13),
    ("marketing_tab", "Marketing Tab", "marketing", "View marketing section", 14),
    ("marketing_credentials", "Marketing Credentials", "marketing", "Manage marketing credentials", 15),
    ("management_notes", "Management Notes", "confidential", "View management-only notes", 16),
    ("partner_notes", "Partner Notes", "confidential", "View partner-facing notes", 17),
    ("stakeholders_manage", "Stakeholder Management", "project", "Manage stakeholders", 18),
    ("team_view", "Team (View)", "admin", "View team members", 19),
    ("team_manage", "Team (Manage)", "admin", "Add/edit team members", 20),
    ("settings_access", "Settings Access", "admin", "Access settings page", 21),
    ("role_management", "Role Management", "admin", "Manage roles and permissions", 22),
    ("workflow_rules", "Workflow Rules", "admin", "Manage workflow automation rules", 23),
    ("credential_vault", "Credential Vault", "confidential", "Access credential vault", 24),
]

# Role → list of feature_keys with can_access=true
# Wildcard roles get all 24 features
_ALL_KEYS = [f[0] for f in FEATURES]

ROLE_PERMISSIONS: dict[str, list[str]] = {
    "business_owner": _ALL_KEYS,
    "superadmin": _ALL_KEYS,
    "admin": _ALL_KEYS,
    "pm": [
        "intake_access", "dashboard_view", "project_overview", "sources_tab",
        "kanban_view", "kanban_edit",
        "specification_view", "specification_edit",
        "qa_manage", "audit_view", "environments_view",
        "documents_view", "documents_edit",
        "marketing_tab", "marketing_credentials",
        "management_notes", "partner_notes", "stakeholders_manage",
        "team_view", "team_manage",
        "credential_vault",
    ],
    "engineer": [
        "dashboard_view", "project_overview", "sources_tab",
        "kanban_view", "kanban_edit",
        "specification_view",
        "qa_manage", "audit_view",
        "documents_view",
    ],
    "bizdev": [
        "dashboard_view", "project_overview",
        "specification_view", "specification_edit",
        "documents_view", "documents_edit",
    ],
    "marketing": [
        "dashboard_view", "project_overview",
        "marketing_tab", "marketing_credentials",
        "documents_view",
    ],
    "operations": [
        "dashboard_view", "project_overview",
        "team_view",
        "documents_view",
    ],
}


def _esc(val: str) -> str:
    return val.replace("'", "''")


def upgrade() -> None:
    # --- Seed feature_permissions (idempotent) ---
    for key, name, cat, desc, order in FEATURES:
        op.execute(
            f"INSERT INTO feature_permissions "
            f"(id, feature_key, feature_name, category, description, sort_order, created_at) "
            f"SELECT gen_random_uuid(), '{_esc(key)}', '{_esc(name)}', '{_esc(cat)}', "
            f"'{_esc(desc)}', {order}, NOW() "
            f"WHERE NOT EXISTS ("
            f"  SELECT 1 FROM feature_permissions WHERE feature_key = '{_esc(key)}'"
            f")"
        )

    # --- Seed role_permissions (idempotent) ---
    for role, keys in ROLE_PERMISSIONS.items():
        for key in keys:
            op.execute(
                f"INSERT INTO role_permissions "
                f"(id, role, feature_key, can_access, updated_at) "
                f"SELECT gen_random_uuid(), '{_esc(role)}', '{_esc(key)}', true, NOW() "
                f"WHERE NOT EXISTS ("
                f"  SELECT 1 FROM role_permissions "
                f"  WHERE role = '{_esc(role)}' AND feature_key = '{_esc(key)}'"
                f")"
            )

    # --- Backfill user_roles for profiles missing their entry ---
    op.execute(
        "INSERT INTO user_roles (id, user_id, role, created_at, updated_at) "
        "SELECT gen_random_uuid(), p.user_id, p.role, NOW(), NOW() "
        "FROM profiles p "
        "WHERE p.role IS NOT NULL AND p.role != '' "
        "AND NOT EXISTS ("
        "  SELECT 1 FROM user_roles ur "
        "  WHERE ur.user_id = p.user_id AND ur.role = p.role"
        ")"
    )


def downgrade() -> None:
    # Remove seeded data (keeps any manually added rows)
    for role, keys in ROLE_PERMISSIONS.items():
        for key in keys:
            op.execute(
                f"DELETE FROM role_permissions "
                f"WHERE role = '{_esc(role)}' AND feature_key = '{_esc(key)}'"
            )
    for key, *_ in FEATURES:
        op.execute(
            f"DELETE FROM feature_permissions WHERE feature_key = '{_esc(key)}'"
        )
