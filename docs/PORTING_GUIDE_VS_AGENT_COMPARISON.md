# Porting Guide vs Port-Lovable Agent — Gap Analysis

Comparison of `docs/PORTING_GUIDE.md` (reference manual) and `.claude/agents/port-lovable.md` (agent workflow).

---

## Similarities (Overlap)

| Topic | PORTING_GUIDE.md | port-lovable.md |
|---|---|---|
| **Supabase → monorepo mapping table** | Section 1 (Architecture Mapping) | Phase 2 (MAP) — nearly identical tables |
| **Backend-first ordering** | Section 4 (Backend before Frontend in checklist) | Phase 3 rule: "Complete ALL backend domains before Phase 4" |
| **Model/Schema/Service/Router steps** | Section 4.1–4.5 | Phase 3 steps 1–8 |
| **Frontend types → repo → hooks → components** | Section 4.6–4.10 | Phase 5 steps 1–4 |
| **Repository pattern enforcement** | Section 3.2 DRY + Section 4.7 | Rule #3 + #4 |
| **Base class reuse** | Section 3.1 OCP/LSP + Section 3.2 DRY | Rule #5 |
| **300 LOC / 150 LOC limits** | Section 3.4 | Rule #6 |
| **Register everything** | Mentioned in each step (4.1, 4.4, 4.6, 4.7) | Rule #8 |
| **No stubs** | Mistake #8 | Rule #2 |
| **No inline API calls** | Section 3.1 DIP | Rule #3 |
| **Common mistakes** | Section 10 (15 items) | "Common Mistakes to Catch" (10 items) |
| **Verification grep commands** | Section 11 | Phase 7 (9 checks) |
| **RLS → service auth** | Section 7 (4 code examples) | Phase 2 table + Mistake #7 |
| **basePath matching** | Mistake #3 | Phase 5 critical verification + Mistake #4 |

---

## Gaps in PORTING_GUIDE.md (present in agent, missing from guide)

| Gap | What port-lovable.md has | Impact |
|---|---|---|
| **PORT_MANIFEST.md requirement** | Phase 1 — mandatory manifest with 9 sections extracted before any code. Explicit "STOP and get approval" gate. | High |
| **Automated extraction script** | `./scripts/extract-lovable-manifest.sh` scans source for tables, queries, edge functions, auth patterns, routes, components, hooks, RLS policies | High |
| **Spec Cards (Phase 4)** | Detailed functional spec per page: user actions, data fields displayed, conditional states (loading/error/empty/permission-denied), side effects. Cross-checks every query column appears in UI. | High |
| **Automated verification script** | `./scripts/verify-port.sh` with 9 automated checks + exit code 0 gate | Medium |
| **"No column left unrendered" rule** | Phase 6 rule #6 + Spec Card cross-check: "every query column appears in a displayed field" | Medium |
| **Conditional UI states enforcement** | Spec Card section 3: loading, error, empty, permission-denied states are mandatory per page | Medium |
| **Missing spec card fields** mistake | Mistake #9: "query selects 8 columns but component only displays 5" | Low |
| **Missing conditional states** mistake | Mistake #10: "no loading spinner, no empty state" | Low |
| **Scaffold script** | Phase 3 step 1: `./scripts/scaffold-domain.sh {domain_name}` to generate boilerplate | Low |
| **5 schema variants** | Phase 3 step 3: Base, Create, Update, Response, ListResponse | Low |

---

## Gaps in port-lovable.md (present in guide, missing from agent)

| Gap | What PORTING_GUIDE.md has | Impact |
|---|---|---|
| **SOLID principles** | Section 3.1 — all 5 principles with porting-specific guidance | High |
| **DRY principle** | Section 3.2 — with Lovable-specific DRY violations to watch | Medium |
| **KISS principle** | Section 3.3 — no premature abstractions, no over-engineering | Medium |
| **Auth porting details** | Section 5 — token storage, auth actions table, user model field mapping, protected routes pattern | High |
| **Edge Function → Celery decision matrix** | Section 6 — categories table (LLM/scraping/CRUD/auth/scheduled) + Celery task code pattern | Medium |
| **RLS authorization code patterns** | Section 7 — 4 concrete Python patterns (own data, member check, admin check, creator check) | Medium |
| **Database table porting priority** | Section 8 — P0 through P5 with 26 tables prioritized | Medium |
| **Project structure mapping** | Section 2 — directory-level source → target mapping | Low |
| **Frontend component mapping** | Section 9 — UI substitution table, routing changes, auth context changes | Low |
| **Column type mapping table** | Section 4.1 — Supabase type → SQLAlchemy type (10 entries) | Low |
| **Recommended porting order** | Section 12 — 16 domains in dependency order | Low |
| **Copy-paste porting template** | Section 13 — checkbox template per domain including code quality checks | Low |
| **50 LOC max for utility functions** | Section 3.4 | Low |

---

## Summary

The two documents serve **different purposes**:

- **port-lovable.md** is an **agent workflow** — a strict 7-phase process with gates, automated scripts, and a spec card step that prevents the "beautiful shell, broken backend" failure
- **PORTING_GUIDE.md** is a **reference manual** — comprehensive mapping tables, code patterns, and principles but no enforced workflow or discovery phase

### Biggest gaps to close

**In the guide** — add:
1. Discovery/manifest phase (Phase 1 from agent)
2. Spec card phase (Phase 4 from agent)
3. Conditional UI state requirements (loading, error, empty, permission-denied)

**In the agent** — add:
1. SOLID/DRY/KISS principles with porting-specific guidance
2. Auth porting details (token storage, user model mapping, protected routes)
3. Edge Function → sync vs Celery decision logic
4. RLS implementation patterns (concrete Python code examples)
