# Plan: Remove Redundant `user_id` Column from Profiles

## Context

The `profiles` table has two identity columns that hold the same UUID value:
- `id` (UUID PK) from `UUIDMixin` — used as FK target by `invited_by`, `reports_to`, `InvitationToken.profile_id`, etc.
- `user_id` (String) — a Supabase legacy holdover, just `str(id)`

Seven related tables (`user_roles`, `user_permission_overrides`, `user_notification_preferences`, `user_github_connections`, `ai_chat_sessions`, `notifications`, `jobs`) store `user_id` as a **String** column that matches `profiles.user_id`. These should be proper UUID foreign keys to `profiles.id`.

**Goal:** Remove `Profile.user_id`, convert all related `user_id` String columns to UUID FKs pointing at `profiles.id`, and update all code accordingly. JWT backward compatibility is inherently safe since existing `sub` claims already contain `str(profile.id)`.

---

## Step 1: Alembic Migration

**New file:** `infra/alembic/versions/c2d3e4f5a6b7_remove_redundant_user_id.py`

Use PostgreSQL `ALTER COLUMN ... TYPE uuid USING user_id::uuid` to convert in-place (safe — all values are valid UUID strings):

```sql
-- For each of the 7 related tables:
ALTER TABLE user_roles ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_profile FOREIGN KEY (user_id) REFERENCES profiles(id);
-- repeat for: user_permission_overrides, user_notification_preferences,
--             user_github_connections, ai_chat_sessions, notifications, jobs

-- permission_audit_log.target_user_id: String → UUID
ALTER TABLE permission_audit_log ALTER COLUMN target_user_id TYPE uuid USING target_user_id::uuid;

-- Drop the redundant column from profiles
ALTER TABLE profiles DROP COLUMN user_id;
```

**Downgrade:** re-add `profiles.user_id` as String, drop FKs, convert UUID columns back with `::text`.

---

## Step 2: Backend Models

| File | Change |
|---|---|
| `apps/api/models/user.py` | **Profile:** remove `user_id` line. **UserRole, UserPermissionOverride, UserNotificationPreference, UserGithubConnection:** change `user_id` from `Mapped[str] + String` to `Mapped[uuid.UUID] + UUID(as_uuid=True), ForeignKey("profiles.id")` |
| `apps/api/models/ai.py` | **AIChatSession:** same String→UUID FK change |
| `apps/api/models/notification.py` | **Notification:** same change |
| `apps/api/models/job.py` | **Job:** same change (nullable) |
| `apps/api/models/settings.py` | **PermissionAuditLog.target_user_id:** String→UUID FK (nullable) |

---

## Step 3: `AuthenticatedUser` & `get_current_user()`

**File:** `apps/api/dependencies.py`

- `AuthenticatedUser.id`: change type `str` → `UUID`
- Remove `profile_id: UUID | None` (redundant — `id` IS the profile UUID now)
- `get_current_user()`: query `Profile.id == UUID(user_id)` and `UserRole.user_id == UUID(user_id)` instead of string comparison
- Construct: `AuthenticatedUser(id=profile.id, ...)` instead of `id=user_id` string

---

## Step 4: Backend Services

Every service that references `profile.user_id` → `profile.id`, and every `user_id: str` parameter → `user_id: UUID`.

| File | Key changes |
|---|---|
| `services/auth_service.py` | `str(profile.user_id)` → `str(profile.id)` in login/register/google_login. `get_current_profile()`: query `Profile.id == UUID(user_id)`. Remove `profile_id` from response (or keep as alias). |
| `services/settings_service.py` | `invite_user()`: remove `user_id=str(uuid.uuid4())` from Profile constructor (UUIDMixin handles it). `UserRole(user_id=profile.id)`. `_get_profile_by_user_id()` → `_get_profile_by_id()` using `Profile.id`. `UserPermissionOverride.user_id` queries: remove `str()` cast. |
| `services/role_service.py` | `target.user_id` → `target.id` everywhere. `UserRole.user_id == target.id`. `PermissionAuditLog(target_user_id=target.id)`. |
| `services/org_chart_service.py` | `roles_by_user` dict keyed by UUID. `roles_by_user.get(p.id)` instead of `p.user_id`. |
| `services/team_service.py` | `get_user_roles(user_id: UUID)`: query `Profile.id` and `UserRole.user_id`. |
| `services/ai_service.py` | All `user_id: str` → `user_id: UUID` parameters. Queries unchanged (both sides now UUID). |
| `services/notification_service.py` | Same pattern as ai_service. |
| `services/github_service.py` | Same pattern. `UserGithubConnection.user_id` queries stay. |
| `services/job_service.py` | `user_id: str` → `user_id: UUID`. |
| `services/audit_service.py` | `user_id: str` → `user_id: UUID`. Fixes pre-existing type mismatch with `Audit.created_by` (UUID). |
| `services/vault_service.py` | `user_id: str` → `user_id: UUID`. |
| `services/product_member_service.py` | `Profile.user_id` → `Profile.id`. `Notification(user_id=profile.id)`. |

---

## Step 5: Backend Schemas & Routers

**Schemas** (`apps/api/schemas/settings.py`):
- `UserOverrideCreate.user_id`: `str` → `UUID`
- `UserOverrideResponse.user_id`: `str` → `UUID`
- `UserRoleResponse.user_id`: `str` → `UUID`
- `PermissionAuditLogResponse.target_user_id`: `str | None` → `UUID | None`

**Routers:**
- `routers/team.py`: `get_user_roles(user_id: str)` → `user_id: UUID`
- Other routers pass `user.id` (now UUID) to services — should work without changes since services now accept UUID

---

## Step 6: Frontend Types

**Only remove `user_id` from types where `id` already exists (Profile, UserWithRole).** Keep `user_id` on types that represent related tables (UserRole, UserOverride, Notification, etc.) — those columns still exist.

| File | Change |
|---|---|
| `lib/types/user.ts` | `Profile`: remove `user_id: string` (use `id`). `UserRole`: keep `user_id` |
| `lib/types/permission.ts` | `UserWithRole`: remove `user_id`. `UserOverride`: keep `user_id`. `PermissionAuditLog`: keep `target_user_id` |

---

## Step 7: Frontend Components

| File | Change |
|---|---|
| `components/organisms/team/TeamGrid.tsx` | `member.user_id` → `member.id` (line ~235). `r.user_id` stays (UserRole field) |
| `components/organisms/team/TeamMemberRow.tsx` | `profile.user_id` → `profile.id` (line ~43) |
| `components/organisms/team/TeamMemberCard.tsx` | `profile.user_id` → `profile.id` (line ~68) |
| `components/organisms/settings/ProfileTab.tsx` | `p.user_id === userId` → `p.id === userId` (line ~35) |
| `components/organisms/settings/ResetPasswordDialog.tsx` | `profile?.user_id` → `profile?.id` (lines ~31-35) |
| `components/organisms/settings/UserPermissionsDialog.tsx` | `profile?.user_id` → `profile?.id` (line ~34) |
| `contexts/AuthContext.tsx` | Remove `profile_id` from User interface (now redundant) |

**No changes needed:** UserOverridesPanel, PermissionAuditLog, AddOverrideDialog, settings.repository — these reference `user_id` on related tables (not Profile).

---

## Current FK Landscape

**38 columns already reference `profiles.id` as a proper UUID FK** (the correct pattern):

- `user.py` — `Profile.invited_by`, `Profile.reports_to`, `InvitationToken.profile_id`
- `product.py` — `product_owner`, `tech_lead`, `business_owner`, `marketing_manager`, `ProductMember.profile_id`, `ProductComment`, `ProductActivity`
- `task.py` — `assignee_id`, `completed_by`
- `document.py` — `created_by`, `author_id`, `uploaded_by`
- `vault.py` — `created_by`, `last_modified_by`
- `audit.py` — `created_by`
- `evaluation.py` — `profile_id`, `evaluated_by`
- `settings.py` — `RolePermission.updated_by`, `PermissionAuditLog.changed_by`, `TeamHoliday.profile_id`, `ManagementNoteAccess.profile_id`, `OrgSetting.updated_by`
- `marketing.py` — `created_by`, `registered_by`
- `github_pat.py` — `created_by`
- `specification.py`, `deployment.py`, `knowledge.py`, `system_document.py`

**7 tables use string `user_id` with NO FK constraint** (the problem to fix):

- `user_roles`
- `user_permission_overrides`
- `user_notification_preferences`
- `user_github_connections`
- `ai_chat_sessions`
- `notifications`
- `jobs`

---

## Verification

1. `make db-migrate` — verify migration runs cleanly
2. `psql` — confirm `profiles` table has no `user_id` column, related tables have UUID `user_id` with FK constraints
3. `make typecheck` — no TS errors
4. `make lint` — clean
5. Log in with existing account — JWT still works (same UUID value in `sub`)
6. Invite a user, assign roles, check org chart — all flows use `profile.id` correctly
7. `grep -rn "\.user_id" apps/api/ --include="*.py"` — no references to `Profile.user_id` remain
8. `grep -rn "user_id" apps/web/src/lib/types/user.ts` — only on `UserRole`, not `Profile`
