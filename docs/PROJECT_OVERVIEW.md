# MIZANOS — Project Overview & Status

**Date**: 2026-02-16
**Platform**: Mizan AI — Project Lifecycle Management

---

## What Is MIZANOS?

MIZANOS is an **internal project management and product lifecycle platform** built for managing software products end-to-end — from intake to deployment. It combines project tracking, team coordination, document management, AI assistance, marketing tracking, code analysis, and credential management into a single monorepo application.

Think of it as a custom **Jira + Notion + Vault + CI Dashboard** tailored for managing a portfolio of software products.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (React 19), TypeScript strict, Tailwind CSS, Radix UI, React Query v5, Axios, DnD Kit, Recharts |
| **Backend** | FastAPI (async), SQLAlchemy 2.0, Pydantic v2, JWT auth (HS256), bcrypt |
| **Database** | PostgreSQL 16 (asyncpg), Redis 7 |
| **AI** | OpenAI, Anthropic (Claude), OpenRouter — specs, summaries, chat, QA generation |
| **Integrations** | GitHub OAuth, Firecrawl (web scraping), S3 (file storage), Railway (deployments) |
| **Infra** | Docker Compose, Alembic migrations, Python 3.13 venv |

---

## Architecture

```
Monorepo Structure:

apps/web/          — Next.js frontend (port 3006)
apps/api/          — FastAPI backend (port 4006)
packages/common/   — Shared Python: DB base classes, error handlers, utilities
infra/             — Docker (PostgreSQL 16 on 5433, Redis 7 on 6380), Alembic migrations
```

### Architecture Patterns
- **Repository pattern** on both frontend (Axios repos) and backend (SQLAlchemy repos)
- **Atomic Design** for components (atoms -> molecules -> organisms -> templates -> pages)
- **SOLID enforced** — single responsibility, dependency inversion via FastAPI `Depends()` and React hooks
- **300 LOC hard limit** per file
- **Token refresh queue** — concurrent 401s handled with a single refresh call and request replay

---

## Core Domains (18 domains, 29 API routers, 47+ tables)

| Domain | What It Does |
|--------|-------------|
| **Auth** | JWT login/register/refresh, role-based access (admin, pm, engineer, bizdev, marketing) |
| **Products** | Central entity — name, status, stage, pillar, health score, PM/engineer assignments, environments (dev/staging/prod) |
| **Tasks** | Kanban board (backlog -> in_progress -> review -> done), drag-drop reorder, pillar/priority tagging, estimated hours |
| **Task Templates** | Reusable multi-step workflow templates per project type (Greenfield, Lovable Port, Replit Port, GitHub, External) |
| **Specifications** | JSON-based product specs with features, acceptance criteria, reusable feature library importable across products |
| **Documents** | File upload with versioning, folder hierarchy, AI summaries, public sharing via expiring token links |
| **QA** | Checklist per product (pass/fail/pending), AI-generated checklists |
| **Deployments** | Per-product deployment checklist + 3 environment configs (URL, branch, Railway, SSL) |
| **AI Chat** | Product-context-aware AI assistant with SSE streaming responses |
| **Audits** | Repository code analysis — tech stack, structure, code patterns, compliance scoring |
| **Marketing** | Domain tracking (registrar, DNS, SSL, expiry), social media handles, encrypted marketing credentials, checklists |
| **Knowledge Base** | Organization-wide documentation repository with file uploads and search |
| **Vault** | AES-encrypted credential storage (API keys, DB passwords, service logins) with categories and product linking |
| **Team** | Profile management, availability tracking, holiday calendar (personal + national), project capacity |
| **Evaluations** | Engineer performance scorecards (code quality, architecture, AI skills, communication, etc.) + project completion tracking |
| **Settings** | Modules, role-based permission matrix with audit log, global integrations, standards repos |
| **GitHub** | OAuth repo linking, commit history, PR listing, repository analysis |
| **Notifications** | Event-based alerts (task assigned, status changed, QA failed) with per-user preferences |

---

## How It Fits Together

```
Intake Form (new project)
  -> Creates Product
  -> Auto-generates Tasks from Templates (based on source type)
  -> Seeds Deployment Checklist
  -> Creates initial Specification

Product Dashboard (12 tabs)
  |-- Overview (health, progress, team)
  |-- Specifications -> Features -> Tasks (queue/unqueue)
  |-- Tasks (Kanban board)
  |-- Documents (versioned, shareable)
  |-- QA Checklist
  |-- Deployments (dev/staging/prod)
  |-- Commits & PRs (GitHub linked)
  |-- Marketing (domains, social, creds)
  +-- System Docs (auto-generated)

Team Management
  |-- Profiles with availability
  |-- Holiday calendar
  +-- Engineer evaluations & project completions

Cross-cutting
  |-- AI Chat (per-product context)
  |-- Vault (encrypted credentials)
  |-- Knowledge Base (shared docs)
  +-- Settings (permissions, integrations, standards)
```

---

## Frontend Pages & Features

| Page | Route | What User Sees/Does |
|------|-------|---------------------|
| **Login** | `/login` | Email/password authentication |
| **Dashboard** | `/dashboard` | Quick stats, action items, production health, stage distribution, recent activity, product grid |
| **Product Detail** | `/products/[id]` | 12-tab dashboard: Overview, Specs, Tasks (Kanban), Documents, QA, Deployments, Commits, PRs, Environments, Marketing, System Docs, Sources |
| **Intake** | `/intake` | New project onboarding form — name, type, assignees, auto-generates templates |
| **Team** | `/team` | Team member grid with availability, capacity, evaluation scores |
| **Team Member** | `/team/[id]` | Individual profile, evaluation breakdown, project completion history |
| **Templates** | `/templates` | Workflow template management by project source type |
| **Template Detail** | `/templates/[groupId]` | Template steps editor with ordering |
| **Knowledge** | `/knowledge` | Organization-wide documentation repository |
| **Vault** | `/vault` | Encrypted credential management with categories |
| **Evaluator** | `/evaluator` | Repository code analysis and compliance scoring |
| **Settings** | `/settings` | Profile, Standards, Modules, Integrations, Notifications, Holidays, Users (admin), Permission Matrix (admin) |
| **Shared Doc** | `/documents/shared/[token]` | Public document viewer (no auth required) |
| **Reset Password** | `/reset-password` | Password reset form |

---

## Data Model (Key Relationships)

```
Product (central entity)
  |-- Tasks (kanban work items)
  |-- ProductMembers (team assignments)
  |-- ProductEnvironments (dev/staging/prod)
  |-- ProductDocuments
  |   |-- DocumentVersions
  |   +-- DocumentFolders
  |-- Specifications
  |   |-- SpecificationFeatures (reusable across products)
  |   +-- SpecificationSources
  |-- ProductManagementNotes
  |-- ProductPartnerNotes
  |-- MarketingChecklists
  |-- MarketingDomains
  |-- MarketingSocialHandles
  |-- MarketingCredentials
  |-- QAChecks
  |-- DeploymentChecklistItems
  |-- ProjectCompletions
  |-- ProjectStakeholders
  |-- Audits
  +-- RepoScanHistory

Profile (user entity)
  |-- UserRoles
  |-- UserPermissionOverrides
  |-- UserNotificationPreferences
  |-- UserGithubConnections
  +-- TeamHolidays
```

---

## Port-Lovable Agent

A custom Claude Code agent (`.claude/agents/port-lovable.md`) invoked via `/agent port-lovable` for migrating Lovable/Supabase SPAs into this monorepo. Enforces a strict 7-phase process:

| Phase | What Happens |
|-------|-------------|
| **1. EXTRACT** | Runs `./scripts/extract-lovable-manifest.sh` to auto-discover tables, Supabase queries, Edge Functions, auth patterns, routes, components, hooks, RLS policies. Produces `PORT_MANIFEST.md`. **User approval required before code.** |
| **2. MAP** | Creates Supabase-to-monorepo translation table (e.g., `supabase.from("x").select()` -> `repository.getAll()`) |
| **3. BACKEND FIRST** | Scaffolds models, schemas, services, routers via `scaffold-domain.sh`. **No stubs allowed** — real logic only. All backend before frontend. |
| **4. SPEC CARDS** | Functional spec per page — user actions, data fields, conditional states (loading/error/empty/permission-denied), side effects. Cross-checked against manifest. |
| **5. FRONTEND WIRING** | TypeScript types, repositories (basePath must match router prefix), query hooks, mutation hooks with cache invalidation and toasts. |
| **6. UI COMPONENTS** | Ports components using atomic design, wires to hooks, implements all states from spec cards. |
| **7. VERIFY** | Runs `./scripts/verify-port.sh` — coverage checks, zero Supabase remnants, zero stubs, barrel file completeness. Must exit 0. |

### 10 Common Mistakes Guarded Against:
1. Token key mismatch (sb-access-token vs Authorization: Bearer)
2. Missing router registration in main.py
3. Stub mutations (console.log instead of real calls)
4. Wrong basePath (repository vs router prefix mismatch)
5. Missing barrel exports
6. Recreated base classes instead of extending existing ones
7. Silently dropped RLS policies
8. Hardcoded Supabase IDs
9. Missing spec card fields
10. Missing conditional states in UI

---

## GitHub Repo Scan Pipeline — Implementation Status

Three distinct pipelines:

### Pipeline 1: GitHub Service (`/github/*`)

| Feature | Status | Details |
|---------|--------|---------|
| OAuth flow | **Fully implemented** | Real GitHub OAuth2, stores encrypted tokens |
| List repos | **Fully implemented** | Calls `api.github.com/user/repos` |
| Repo metadata | **Fully implemented** | Languages, contributors, stars, issues via real API calls |
| Basic analysis | **Partial** | Real API calls but scoring is simple heuristics (+30pts for description, +30pts for multiple contributors, etc.) |
| Trigger scan (`/github/scan`) | **Stub** | Creates placeholder `RepoScanHistory` with `files_changed=0` — no actual git diff analysis |
| Webhooks | **Fully implemented** | Signature verification, push event processing, triggers system doc regeneration |

### Pipeline 2: Repo Evaluator (`/repo-evaluator/*`) — Deep Local Analysis

**Fully implemented** — the most sophisticated pipeline:

| Analyzer | What It Does |
|----------|-------------|
| **TechStackAnalyzer** | Scans file extensions, parses `package.json`/`pyproject.toml`/`requirements.txt` to detect languages, frameworks (Next.js, FastAPI, Django, etc.), and databases |
| **StructureAnalyzer** | Counts files/LOC, flags files over 300 LOC, detects directory patterns (atomic/feature-based/flat/mixed), checks for barrel files |
| **CodePatternAnalyzer** | Regex scans across 6 categories (API calls, auth, state mgmt, DB access, CSS, TypeScript) — flags patterns as "aligned", "needs_change", or "critical" |

**Output:** Alignment score (0-100), 5+ markdown reports (executive summary, structure analysis, code patterns, gap analysis, migration roadmap). Auto-detects Lovable/Supabase projects and extracts manifest.

### Pipeline 3: Audit Service (`/audits/*`)

**Fully implemented** — combines QA + repo evaluation:

1. Aggregates all `QACheck` pass/fail rates per category
2. If product has `repository_url`, **clones repo** and runs full Repo Evaluator
3. Merges QA scores + code quality scores into overall score
4. Saves `Audit` with categories (JSONB) and issues (critical/warnings/code_violations)
5. Compare endpoint diffs the last 2 audits

### What's NOT Implemented:
- Real git diff analysis (file changes, lines added/removed)
- Component discovery from code
- Streaming scan progress updates
- OAuth state stored in memory (should be Redis)

---

## Local Development

### Prerequisites
- Node.js + npm
- Python 3.12+ (3.13 recommended)
- Docker

### Setup
```bash
make setup          # Full bootstrap: install deps, docker, migrate, seed
```

### Running
```bash
make dev            # Start both API (4006) + frontend (3006)
make dev-api        # API only
make dev-web        # Frontend only
```

### Services
| Service | Port | Credentials |
|---------|------|-------------|
| Frontend | localhost:3006 | — |
| API | localhost:4006 | — |
| PostgreSQL | localhost:5433 | user: `mizan`, password: `mizan`, db: `mizanos` |
| Redis | localhost:6380 | — |

### Admin Login
- Email: `jawad@vanerchain.com`
- Password: `Jaajaa10!p`

### Key Commands
```bash
make test           # Run all tests
make lint           # Lint frontend
make typecheck      # TypeScript strict check
make db-migrate     # Run Alembic migrations
make db-makemigration  # Generate new migration
make db-seed        # Seed admin user
make docker-up      # Start PostgreSQL + Redis
make docker-down    # Stop Docker services
```

---

## Scale

- ~160 API endpoints
- 50+ DB models / 47+ tables
- 29 API routers
- 25 frontend repositories
- 40+ backend services
- 67+ React hooks
- 200+ components
- 4 Alembic migrations

---

## Known Issues & Gaps

See `docs/CODEBASE_ANALYSIS.md` for the full critical issues list, including:
- Authentication bypass (`CurrentUser = None` defaults)
- No role-based authorization enforcement
- No tenant/product isolation
- Zero test coverage
- No CI/CD pipeline
- Redis configured but unused
- S3 file storage not implemented
- Several files exceeding 300 LOC limit
