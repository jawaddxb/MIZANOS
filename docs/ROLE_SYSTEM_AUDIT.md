# Role System Audit — Complete Summary

## Secondary Roles Confirmation

**Yes, secondary roles work identically to primary roles.** Here's exactly how:

1. **Loading** (`dependencies.py`): Every request loads primary role from `Profile.role` AND secondary roles from `UserRole` table
2. **Checking** (`AuthenticatedUser.has_role()`): Checks `self.role == role.value OR role.value in self.additional_roles` — no distinction
3. **All guards use this**: `require_roles()`, `has_any_role()`, `verify_product_access()`, `_can_manage_tasks()`, invite matrix
4. **Permissions merge additively**: A user with roles A + B gets the **union** of all permissions from both roles. No permission from one role can revoke a permission from another.

**Example**: A `business_owner` (primary) with `project_manager` (secondary) can create projects — because `create_product` checks `has_any_role(SUPERADMIN, PROJECT_MANAGER)` which matches the secondary PM role.

**One restriction**: `superadmin` **cannot** be assigned as a secondary role (enforced in `role_service.assign_role()`).

---

## Role-by-Role Breakdown

### 1. SUPERADMIN — Full Platform Control

**Backend powers:**
- Bypasses ALL `require_roles()` guards — always passes
- Create/edit/delete products
- Create tasks and assign to anyone
- Reassign any task freely
- Change any task's status
- Invite ANY role (including other superadmins)
- Assign/remove any role on any user (primary or secondary)
- Change any user's primary role
- Change any user's activation status
- Update org-level settings (only role that can)
- View all products without membership

**Frontend permissions:** `"*"` wildcard — sees everything, all buttons enabled

**Restrictions:** Cannot be assigned as a secondary role. Must be primary.

---

### 2. BUSINESS_OWNER — Organizational Management

**Backend powers:**
- Passes all `require_roles()` guards EXCEPT `require_super_admin()`
- View all products without membership (auto-bypass in `verify_product_access`)
- Invite: admin, executive, PM, engineer, BD, marketing, operations (NOT superadmin, NOT business_owner)
- Assign/remove roles: any except superadmin
- Change primary roles: any except to/from superadmin
- Change user activation status: NO (only superadmin/admin can)
- Create products: **NO** (only superadmin + PM) — needs PM as secondary role
- Create tasks: auto-assigns to self (not a "task manager" role)
- Reassign tasks: only if they're a product PM on that specific product
- Update org settings: NO

**Frontend permissions:** `"*"` wildcard — sees all UI elements

**Key limitation:** Despite wildcard frontend visibility, backend restricts product creation and org settings. Adding PM as secondary role unlocks project creation.

---

### 3. ADMIN — Full Access with Guardrails

**Backend powers:**
- Passes all `require_roles()` guards EXCEPT `require_super_admin()`
- View all products without membership
- Invite: executive, PM, engineer, BD, marketing, operations (NOT superadmin, NOT business_owner, NOT admin)
- Assign/remove roles: any except superadmin and business_owner; cannot modify own roles
- Change primary roles: same restrictions as above
- Change user activation status: YES (but not other admins or superadmins)
- Create products: **NO** — needs PM as secondary role
- Create tasks: auto-assigns to self
- Reassign tasks: only if product PM
- Update org settings: NO

**Frontend permissions:** `"*"` wildcard

**Key limitations:** Can't touch superadmin/business_owner users. Can't self-modify roles. Can't create products without PM secondary.

---

### 4. EXECUTIVE — Read-Only Visibility

**Backend powers:**
- View all products without membership (auto-bypass in `verify_product_access`)
- Create products: NO
- Create tasks: auto-assigns to self
- Reassign tasks: NO (unless product PM, which is unlikely)
- Invite: NOBODY
- Manage roles: NO
- Change user status: NO
- Update org settings: NO

**Frontend permissions (14 view-only keys):**
- `intake_access`, `dashboard_view`, `project_overview`, `sources_tab`
- `kanban_view`, `specification_view`, `audit_view`, `environments_view`
- `documents_view`, `marketing_tab`, `marketing_credentials`
- `management_notes`, `partner_notes`, `team_view`

**NOT granted:** `kanban_edit`, `specification_edit`, `documents_edit`, `qa_manage`, `stakeholders_manage`, `team_manage`, `settings_access`, `role_management`, `workflow_rules`, `credential_vault`

**Purpose:** High-visibility stakeholder who sees everything but changes nothing. Future: will be able to generate reports.

---

### 5. PROJECT_MANAGER — The Operational Workhorse

**Backend powers:**
- Create products (one of only 2 roles that can, alongside superadmin)
- Create tasks and assign to anyone
- Reassign any task freely (via `_can_manage_tasks`)
- Change task status on any task in their products (via product PM membership)
- Invite: engineer, BD, marketing, operations
- View products they're a member of (must be in ProductMember table)
- Manage roles: NO
- Change user status: NO
- Update org settings: NO

**Frontend permissions (21 keys):**
- `intake_access`, `dashboard_view`, `project_overview`, `sources_tab`
- `kanban_view`, `kanban_edit`
- `specification_view`, `specification_edit`
- `qa_manage`, `audit_view`, `environments_view`
- `documents_view`, `documents_edit`
- `marketing_tab`, `marketing_credentials`
- `management_notes`, `partner_notes`, `stakeholders_manage`
- `team_view`, `team_manage`
- `credential_vault`

**Key role:** This is the primary "doer" role. Most day-to-day platform management happens through PM. Assigning PM as a secondary role to any user gives them full project creation + task management powers.

---

### 6. ENGINEER — Development Focused

**Backend powers:**
- Create tasks: YES, but **auto-assigned to self** (cannot assign to others)
- Update own tasks: YES (status, details)
- Reassign tasks: **NO** (403 unless they happen to be product PM)
- Change task status: only on tasks assigned to them
- View products they're a member of
- Create products: NO
- Invite: NOBODY
- Manage roles: NO

**Frontend permissions (9 keys):**
- `dashboard_view`, `project_overview`, `sources_tab`
- `kanban_view`, `kanban_edit`
- `specification_view`
- `qa_manage`, `audit_view`
- `documents_view`

**NOT granted:** `intake_access`, `specification_edit`, `documents_edit`, `marketing_*`, `management_notes`, `partner_notes`, `team_*`, `settings_*`, `credential_vault`

---

### 7. BUSINESS_DEVELOPMENT — Specs & Docs

**Backend powers:**
- View products they're a member of
- Create tasks: auto-assigned to self
- Reassign tasks: NO
- Create products: NO
- Invite: NOBODY
- Manage roles: NO

**Frontend permissions (6 keys):**
- `dashboard_view`, `project_overview`
- `specification_view`, `specification_edit`
- `documents_view`, `documents_edit`

**Focused on:** Client-facing specs and documentation

---

### 8. MARKETING — Campaign Focused

**Backend powers:**
- View products they're a member of
- Create tasks: auto-assigned to self
- Reassign tasks: NO
- Create products: NO
- Invite: NOBODY
- Manage roles: NO

**Frontend permissions (5 keys):**
- `dashboard_view`, `project_overview`
- `marketing_tab`, `marketing_credentials`
- `documents_view`

**Focused on:** Marketing campaigns, credentials, social media

---

### 9. OPERATIONS — Minimal Access

**Backend powers:**
- View products they're a member of
- Create tasks: auto-assigned to self
- Reassign tasks: NO
- Create products: NO
- Invite: NOBODY
- Manage roles: NO

**Frontend permissions (4 keys):**
- `dashboard_view`, `project_overview`
- `team_view`
- `documents_view`

**Most limited role.** Sees the team org chart and documents, that's it.

---

## Quick Reference Matrix

| Capability | SA | BO | Admin | Exec | PM | Eng | BD | Mkt | Ops |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **View all products (no membership)** | Y | Y | Y | Y | - | - | - | - | - |
| **Create products** | Y | - | - | - | Y | - | - | - | - |
| **Create tasks (assign freely)** | Y | - | - | - | Y | - | - | - | - |
| **Create tasks (auto-assign to self)** | - | Y | Y | Y | - | Y | Y | Y | Y |
| **Reassign tasks** | Y | * | * | * | Y | - | - | - | - |
| **Change any task status** | Y | - | - | - | Y† | - | - | - | - |
| **Change own task status** | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| **Invite users** | All | 7 | 6 | - | 4 | - | - | - | - |
| **Manage roles** | Y | Y‡ | Y‡ | - | - | - | - | - | - |
| **Change user status** | Y | - | Y‡ | - | - | - | - | - | - |
| **Update org settings** | Y | - | - | - | - | - | - | - | - |
| **Frontend wildcard** | Y | Y | Y | - | - | - | - | - | - |

`*` = only if product PM on that product | `†` = as product PM | `‡` = with restrictions (can't touch higher roles)
