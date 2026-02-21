# Plan: Seed Permission Matrix & Backfill user_roles

## Context

The permission system has the right **data structures** (tables: `feature_permissions`, `role_permissions`, `user_permission_overrides`, `user_roles`) and the right **UI** (PermissionMatrixTab, UserPermissionsDialog, UserOverridesPanel) — but the tables are **empty in production**:

- `feature_permissions`: 0 rows — the Permission Matrix UI has no rows to display
- `role_permissions`: 0 rows — `hasPermission()` returns false for everyone, we added a frontend fallback but the admin UI can't manage what doesn't exist
- `user_roles`: missing entries for users created before the invite flow was fixed (e.g., Talha Yusuf has 0 entries)

**Goal**: Seed the DB so that admins can manage permissions via the existing UI, and backfill `user_roles` for existing users.

## Changes

### 1. Alembic migration to seed `feature_permissions`

**New file**: `infra/alembic/versions/xxxx_seed_feature_permissions.py`

Insert all 24 feature keys used by the frontend `useRoleVisibility` hook:

| feature_key | feature_name | category |
|---|---|---|
| `intake_access` | Intake Access | navigation |
| `dashboard_view` | Dashboard | navigation |
| `project_overview` | Project Overview | project |
| `sources_tab` | Sources | project |
| `kanban_view` | Kanban View | project |
| `kanban_edit` | Kanban Edit | project |
| `specification_view` | Specification View | project |
| `specification_edit` | Specification Edit | project |
| `qa_manage` | QA Management | project |
| `audit_view` | Audit Log | project |
| `environments_view` | Environments | project |
| `documents_view` | Documents View | project |
| `documents_edit` | Documents Edit | project |
| `marketing_tab` | Marketing | marketing |
| `marketing_credentials` | Marketing Credentials | marketing |
| `management_notes` | Management Notes | confidential |
| `partner_notes` | Partner Notes | confidential |
| `stakeholders_manage` | Stakeholders | project |
| `team_view` | Team View | admin |
| `team_manage` | Team Management | admin |
| `settings_access` | Settings | admin |
| `role_management` | Role Management | admin |
| `workflow_rules` | Workflow Rules | admin |
| `credential_vault` | Credential Vault | confidential |

### 2. Seed `role_permissions`

**Same migration file**: For each role in `DEFAULT_ROLE_PERMISSIONS`, insert a `role_permissions` row per feature key with `can_access=true`. Wildcard roles (`business_owner`, `superadmin`, `admin`) get `can_access=true` for ALL features.

Default permission mapping (from `apps/web/src/lib/constants/roles.ts`):

| Role | Features (can_access=true) |
|---|---|
| **business_owner** | ALL features |
| **superadmin** | ALL features |
| **admin** | ALL features |
| **project_manager** | intake_access, dashboard_view, project_overview, sources_tab, kanban_view, kanban_edit, specification_view, specification_edit, qa_manage, audit_view, environments_view, documents_view, documents_edit, marketing_tab, marketing_credentials, management_notes, partner_notes, stakeholders_manage, team_view, team_manage, credential_vault |
| **engineer** | dashboard_view, project_overview, sources_tab, kanban_view, kanban_edit, specification_view, qa_manage, audit_view, documents_view |
| **business_development** | dashboard_view, project_overview, specification_view, specification_edit, documents_view, documents_edit |
| **marketing** | dashboard_view, project_overview, marketing_tab, marketing_credentials, documents_view |
| ~~product_manager~~ | intake_access, dashboard_view, project_overview, sources_tab, kanban_view, kanban_edit, specification_view, specification_edit, qa_manage, audit_view, environments_view, documents_view, documents_edit, marketing_tab, marketing_credentials, management_notes, partner_notes, stakeholders_manage, team_view, team_manage, credential_vault |
| **operations** | dashboard_view, project_overview, team_view, documents_view |

This gives admins a working Permission Matrix UI they can toggle on/off.

### 3. Backfill `user_roles` for existing profiles

**Same migration**: Query all profiles that have a `role` set but no matching `user_roles` entry, and insert the missing rows:

```sql
INSERT INTO user_roles (id, user_id, role, created_at, updated_at)
SELECT gen_random_uuid(), p.user_id, p.role, NOW(), NOW()
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.user_id AND ur.role = p.role
WHERE p.role IS NOT NULL AND ur.id IS NULL;
```

### 4. Files to create/modify

| File | Action |
|---|---|
| `infra/alembic/versions/xxxx_seed_permissions_and_roles.py` | **New** — Alembic migration to seed feature_permissions, role_permissions, and backfill user_roles |

### 5. How admins manage access after seeding

Once the migration runs:

1. **Settings > Authority Matrix tab** — Shows the full feature × role grid with checkboxes. Admins can toggle any permission on/off for any role.
2. **Settings > Users tab > View Permissions** — Shows a specific user's effective permissions (role-based + overrides). Admins can add individual overrides (grant/deny) per user with optional expiration.
3. **Settings > Users tab > Invite User** — Creates profile + user_roles entry automatically.

### 6. Verification

1. `make db-migrate` — migration runs successfully
2. `SELECT COUNT(*) FROM feature_permissions;` → 24 rows
3. `SELECT role, COUNT(*) FROM role_permissions GROUP BY role;` → entries for all 8 roles
4. `SELECT COUNT(*) FROM profiles p LEFT JOIN user_roles ur ON ur.user_id = p.user_id WHERE p.role IS NOT NULL AND ur.id IS NULL;` → 0 (no orphans)
5. Log in as superadmin → Settings → Authority Matrix → see the full permission grid
6. Toggle a permission off → verify the affected role loses access
7. Log in as project_manager → verify they see all tabs and features (except Settings)
