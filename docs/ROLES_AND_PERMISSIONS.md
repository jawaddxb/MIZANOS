# Roles and Permissions System

## Role System Overview

There are **two layers** of roles:

### Global App Roles (8 roles)

| Role | Description |
|------|-------------|
| **business_owner** | Org-level top of hierarchy, full access |
| **superadmin** | Full platform control, only role that can manage superadmins |
| **admin** | Full access except can't modify superadmins or their own role |
| **project_manager** | Manages products, tasks, team, specs, QA, docs, audit |
| **engineer** | Dev tasks, code reviews, QA, specs (view only), docs (view only) |
| **business_development** | Client relations, specs (edit), docs (edit) |
| **marketing** | Marketing campaigns, docs (view only) |
| **operations** | Operational workflows, team view, docs view |

### Product Member Roles (4 roles)

Used only for **team composition validation** (all 4 must be filled to activate a product):

- `project_manager` - Project Manager (required: 1 minimum)
- `marketing` - Marketing (required: 1 minimum)
- `business_owner` - Business Owner (required: 1 minimum)
- `ai_engineer` - AI Engineer (required: 1 minimum)

These don't grant permissions — they're about team structure.

---

## Permission Matrix

| Feature | business_owner | superadmin | admin | project_manager | engineer | business_development | marketing | operations |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **Products** |
| View | * | * | * | Y | Y | Y | Y | Y |
| Create | * | * | * | Y | - | - | - | - |
| Edit | * | * | * | Y | - | - | - | - |
| Delete | * | * | * | - | - | - | - | - |
| **Tasks** |
| View/Edit/Assign | * | * | * | Y | Y | - | - | - |
| Change Status (DnD) | * | * | * | Y (as PM) | Y (if assignee) | - | - | - |
| **Specifications** |
| View | * | * | * | Y | Y | Y | - | - |
| Edit | * | * | * | Y | - | Y | - | - |
| **QA** |
| View/Manage | * | * | * | Y | Y | - | - | - |
| **Marketing** |
| View/Edit/Credentials | * | * | * | Y | - | - | Y | - |
| **Documents** |
| View | * | * | * | Y | Y | Y | Y | Y |
| Edit | * | * | * | Y | - | Y | - | - |
| **Notes** |
| Management Notes | * | * | * | Y | - | - | - | - |
| Partner Notes | * | * | * | Y | - | - | - | - |
| **Team** |
| View | * | * | * | Y | - | - | - | Y |
| Manage | * | * | * | Y | - | - | - | - |
| **Admin** |
| Settings/Roles/Workflows | * | * | * | - | - | - | - | - |
| **Stage Changes** | * | * | - | Y | - | - | - | - |
| **Audit Log** | * | * | * | Y | Y | - | - | - |
| **Knowledge Base** |
| View | * | * | * | Y | Y | Y | Y | Y |
| Edit | * | * | * | Y | - | - | - | - |
| **Environments** | * | * | * | Y | - | - | - | - |
| **Stakeholders** | * | * | * | Y | - | - | - | - |

`*` = wildcard (full access), `Y` = explicitly granted, `-` = no access

---

## Permission Architecture

### Layer 1: Role-Based Permissions (Frontend)

Defined in `apps/web/src/lib/constants/roles.ts`:

```
DEFAULT_ROLE_PERMISSIONS = {
  business_owner: ["*"],
  superadmin: ["*"],
  admin: ["*"],
  project_manager: [
    "products.view", "products.edit",
    "tasks.view", "tasks.edit",
    "team.view",
    "specifications.view", "specifications.edit",
    "qa.view", "qa.edit",
    "documents.view", "documents.edit",
    "notifications.view",
    "audit.view",
    "knowledge.view", "knowledge.edit"
  ],
  engineer: [
    "products.view",
    "tasks.view", "tasks.edit",
    "specifications.view",
    "qa.view", "qa.edit",
    "documents.view",
    "audit.view",
    "knowledge.view"
  ],
  business_development: [
    "products.view",
    "specifications.view", "specifications.edit",
    "documents.view", "documents.edit",
    "knowledge.view"
  ],
  marketing: [
    "products.view",
    "marketing.view", "marketing.edit",
    "documents.view",
    "knowledge.view"
  ],
  operations: [
    "products.view",
    "team.view",
    "documents.view",
    "knowledge.view"
  ]
}
```

### Layer 2: Feature-Based Permissions (Database)

Stored in `role_permissions`, `feature_permissions`, and `user_permission_overrides` tables.

**Feature Keys** (from `apps/web/src/lib/types/permission.ts`):

| Feature Key | Description |
|---|---|
| `intake_access` | Product intake form access |
| `dashboard_view` | Main dashboard visibility |
| `project_overview` | Project overview tab |
| `sources_tab` | Sources/GitHub integration |
| `kanban_view` | Kanban board view |
| `kanban_edit` | Kanban board edit (assign tasks) |
| `specification_view` | Specification view |
| `specification_edit` | Specification edit |
| `qa_manage` | QA check management |
| `audit_view` | Audit log viewing |
| `environments_view` | Deployment environments |
| `documents_view` | Document access |
| `documents_edit` | Document edit |
| `marketing_tab` | Marketing module |
| `marketing_credentials` | Marketing credentials vault |
| `management_notes` | Management notes (PM-only) |
| `partner_notes` | Partner notes visibility |
| `stakeholders_manage` | Project stakeholders CRUD |
| `team_view` | Team/org chart view |
| `team_manage` | Team management (invite, roles) |
| `settings_access` | Settings panel access |
| `role_management` | User role assignment |
| `workflow_rules` | Workflow automation rules |
| `credential_vault` | Company credentials vault |

---

## How Permissions Are Enforced

### Backend (Security)

| File | Mechanism | Examples |
|------|-----------|----------|
| `apps/api/auth.py` | Role guards (dependency injection) | `require_admin()`, `require_roles(AppRole.PROJECT_MANAGER)` |
| `apps/api/services/role_service.py` | Role assignment authorization | Only ADMIN+ can assign roles |
| `apps/api/services/product_member_service.py` | Product member management auth | Only ADMIN/PROJECT_MANAGER can manage members |
| `apps/api/services/settings_service.py` | User status & invitation auth | Admin-only status changes |
| `apps/api/services/task_service.py` | Task status change auth | Assignee or PROJECT_MANAGER only |
| `apps/api/dependencies.py` | JWT extraction & role loading | `AuthenticatedUser.has_role()` |

**Backend guards:**

- `require_roles(*allowed: AppRole)` — raises 403 if user lacks the specified role
- `require_admin()` — requires ADMIN or SUPERADMIN
- `require_super_admin()` — requires SUPERADMIN only
- `verify_product_access(session, user, product_id)` — checks user is product member or admin

**Role assignment restrictions (RoleService):**

- Only BUSINESS_OWNER, SUPERADMIN, or ADMIN can manage roles
- ADMIN cannot modify SUPERADMIN roles, assign SUPERADMIN, or modify their own roles
- SUPERADMIN/BUSINESS_OWNER have no restrictions

**Invitation matrix (InviteService):**

| Actor | Can invite |
|---|---|
| super_admin | admin, project_manager |
| admin | project_manager, member |
| project_manager | member |
| member | (nobody) |

### Frontend (Visibility Only)

| File | Purpose |
|------|---------|
| `apps/web/src/hooks/utils/useRoleVisibility.ts` | Boolean flags for UI component visibility |
| `apps/web/src/hooks/queries/usePermissions.ts` | Fetches role-permission mappings + user overrides |
| `apps/web/src/lib/constants/roles.ts` | Default role permission configuration |

**`useRoleVisibility()` provides:**

- Role checks: `isBusinessOwner`, `isSuperAdmin`, `isAdmin`, `isProjectManager`, `isMarketing`, `isEngineer`, `isBusinessDevelopment`, `isOperations`
- Feature flags: `canViewMarketingTab`, `canManageTeam`, `canManageSettings`, `canViewAudit`, `canViewQA`, `canViewDocuments`, `canAssignTasks`, `canCreateProduct`, `canEditProduct`, `canDeleteProduct`, `canViewKanban`, `canEditKanban`, `canViewSpecification`, `canEditSpecification`, `canViewManagementNotes`, `canViewPartnerNotes`, `canManageStakeholders`, `canManageRoles`, `canManageWorkflow`, etc.

---

## How Roles Are Assigned

### Database Schema

- **Primary role**: `profiles.role` column (set at creation/invitation)
- **Additional roles**: `user_roles` table (many-to-many, allows multiple roles)
- **Permission overrides**: `user_permission_overrides` table (grant/deny specific features, optional expiration)

### Assignment Flow

1. **Initial (invitation)**: `POST /settings/users/invite` creates Profile with role + UserRole entry
2. **Add role**: `POST /settings/users/{user_id}/roles`
3. **Change primary role**: `PATCH /settings/users/{user_id}/primary-role`
4. **Remove role**: `DELETE /settings/users/{user_id}/roles/{role}`
5. **Permission overrides**: `POST /settings/user-overrides` (grant/deny specific feature)

All changes are tracked in `PermissionAuditLog`.

---

## Known Gaps

1. **Feature permissions in DB not enforced on backend** — `role_permissions` table and user overrides exist but only affect frontend visibility, not API security
2. **Invite permission matrix defined but never enforced** — `INVITE_MATRIX` in invite service is never called
3. **Product member roles don't grant permissions** — only used for team composition checks
4. **Management note access table exists but isn't queried** for enforcement
5. **User override system underutilized** — `user_permission_overrides` only checked in frontend `useMyPermissions()` hook

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `apps/api/models/enums.py` | AppRole + ProductMemberRole enums |
| `apps/api/models/settings.py` | Permission DB models |
| `apps/api/auth.py` | Authorization guards |
| `apps/api/dependencies.py` | User authentication + role loading |
| `apps/api/services/role_service.py` | Role assignment logic |
| `apps/web/src/lib/constants/roles.ts` | Default role-permission config |
| `apps/web/src/lib/types/permission.ts` | FeatureKey type definition |
| `apps/web/src/hooks/utils/useRoleVisibility.ts` | Frontend permission flags |
| `apps/web/src/hooks/queries/usePermissions.ts` | Permission data fetching |
