# Worker & Queue Architecture Plan

**Date**: 2026-02-15
**Status**: Planned
**Reference**: `/Users/mna036/ai-bytes/mizan-pmo/` (BullMQ + Python worker pattern)

---

## Problem

Heavy operations run synchronously in FastAPI request handlers, blocking the API and risking timeouts:

- GitHub repo analysis & scanning (clone, parse, LOC count)
- Quality audits (scaffold verification, CLAUDE.md rule checking, SOLID compliance)
- AI document/summary generation (LLM calls with large context)
- Evaluation report generation (cross-product aggregation)
- Port manifest extraction (Lovable SPA migration mapping)
- Security audits (dependency scanning, secret detection)

These operations can take 30s–5min. Running them in-request degrades UX and risks HTTP timeouts.

---

## Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Job Queue** | [arq](https://arq-docs.helpmanual.io/) | Async-native Python, Redis-backed, lightweight. Fits FastAPI's async model. |
| **Broker** | Redis (already running on port 6379) | Currently unused in MIZANOS. Zero new infrastructure. |
| **Progress Channel** | Redis Pub/Sub | Worker publishes progress → API subscribes and relays to frontend |
| **Real-time Delivery** | SSE (Server-Sent Events) | Simpler than WebSocket for unidirectional progress. No new dependency. |
| **Result Storage** | PostgreSQL (existing) | Structured results in `scan_results`, individual issues in `findings` |

---

## Architecture

```
┌─────────┐     POST /jobs/{type}     ┌──────────┐     arq enqueue     ┌──────────┐
│ Frontend │ ────────────────────────→ │ FastAPI  │ ──────────────────→ │  Redis   │
│  (Next)  │                           │   API    │                     │  Queue   │
└─────────┘                           └──────────┘                     └──────────┘
     ↑                                      ↑                               │
     │  SSE stream                          │  Redis Pub/Sub                │ arq pickup
     │  (scan:progress,                     │  (mizan:scan:progress)        ↓
     │   scan:completed)                    │                          ┌──────────┐
     │                                      └────────────────────────← │  Worker  │
     │                                         progress updates        │  (arq)   │
     └─────────────────────────────────────────────────────────────── └──────────┘
                                                                           │
                                                                           ↓
                                                                     ┌──────────┐
                                                                     │ Postgres │
                                                                     │ (results)│
                                                                     └──────────┘
```

### Request Flow

1. **Frontend** sends `POST /jobs/{type}` with `product_id` and optional `config`
2. **API** creates a `scan_jobs` row (status: `queued`), enqueues job in arq, returns job ID
3. **Frontend** opens SSE connection: `GET /jobs/{job_id}/stream`
4. **Worker** picks up job, sets status to `running`, begins processing
5. **Worker** publishes progress to Redis Pub/Sub channel `mizan:scan:progress`
6. **API** subscribes to channel, relays matching events to SSE stream
7. **Worker** saves results to `scan_results` + `findings`, sets status to `completed`
8. **API** sends `scan:completed` SSE event, creates notifications for project members
9. **Frontend** receives completion, fetches full results via `GET /jobs/{job_id}`

---

## Job Types

| Type | Description | Trigger | Estimated Duration |
|------|-------------|---------|-------------------|
| `repo_scan` | Full repository analysis: clone, tech stack, LOC, structure | Manual or webhook | 1–3 min |
| `diff_scan` | Incremental scan on specific commit/PR | GitHub webhook (push/PR) | 15–60s |
| `quality_audit` | Scaffold rules, naming conventions, CLAUDE.md compliance, SOLID | Manual | 30s–2 min |
| `security_audit` | Dependency vulnerabilities, secret detection, OWASP checks | Manual or scheduled | 30s–2 min |
| `ai_generation` | Document summaries, QA checklists, specification drafts | Manual | 10–30s |
| `evaluation_report` | Engineer scoring, team performance aggregation | Manual | 5–15s |
| `port_manifest` | Lovable SPA extraction and migration mapping | Manual | 1–3 min |
| `brief_generation` | Generate editable project brief from codebase analysis | Manual | 20–60s |

---

## Database Schema

### `scan_jobs` — Job tracking

```sql
CREATE TABLE scan_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID NOT NULL REFERENCES products(id),
    created_by      UUID NOT NULL REFERENCES profiles(id),
    job_type        VARCHAR(50) NOT NULL,  -- repo_scan, diff_scan, quality_audit, etc.
    status          VARCHAR(20) NOT NULL DEFAULT 'queued',  -- queued, running, completed, failed, cancelled
    arq_job_id      VARCHAR(255),          -- Correlation with arq queue
    repository_url  TEXT,
    branch          VARCHAR(255) DEFAULT 'main',
    commit_sha      VARCHAR(40),           -- For diff scans
    progress        INTEGER DEFAULT 0,     -- 0-100
    current_step    VARCHAR(100),          -- UI display: "Cloning repository..."
    config          JSONB DEFAULT '{}',    -- Per-job configuration (which checks to run, etc.)
    result_summary  JSONB,                 -- High-level summary (scores, counts)
    error_message   TEXT,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scan_jobs_product ON scan_jobs(product_id);
CREATE INDEX idx_scan_jobs_status ON scan_jobs(status);
CREATE INDEX idx_scan_jobs_created ON scan_jobs(created_at DESC);
```

### `scan_results` — Structured output per analysis step

```sql
CREATE TABLE scan_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_job_id     UUID NOT NULL REFERENCES scan_jobs(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    result_type     VARCHAR(100) NOT NULL,  -- check:loc_limits, structural:tech_stack, intelligence:risks, summary
    data            JSONB NOT NULL,         -- Full result payload
    score           INTEGER,               -- 0-100 quality/security score (nullable)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scan_results_job ON scan_results(scan_job_id);
CREATE INDEX idx_scan_results_type ON scan_results(result_type);
```

### `findings` — Individual issues/violations

```sql
CREATE TABLE findings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_result_id  UUID NOT NULL REFERENCES scan_results(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    severity        VARCHAR(20) NOT NULL,   -- critical, warning, info, pass
    category        VARCHAR(100) NOT NULL,  -- naming, structure, security, dependency, loc
    rule            VARCHAR(255) NOT NULL,  -- e.g., "file_exceeds_300_loc", "hardcoded_secret"
    message         TEXT NOT NULL,
    file_path       TEXT,
    line_number     INTEGER,
    suggestion      TEXT,                   -- Auto-fix suggestion
    evidence        JSONB,                  -- Supporting data (snippet, context)
    is_resolved     BOOLEAN DEFAULT false,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_findings_result ON findings(scan_result_id);
CREATE INDEX idx_findings_severity ON findings(severity);
CREATE INDEX idx_findings_product ON findings(product_id);
CREATE INDEX idx_findings_resolved ON findings(is_resolved);
```

---

## Result Type Taxonomy

Results are categorized by type for structured retrieval:

| Category | Result Types | Description |
|----------|-------------|-------------|
| **Checks** | `check:loc_limits`, `check:naming_conventions`, `check:folder_structure`, `check:dependency_audit`, `check:secret_scan` | Deterministic rule-based checks |
| **Structural** | `structural:tech_stack`, `structural:language_breakdown`, `structural:dependency_graph` | Codebase structure analysis |
| **Intelligence** | `intelligence:features`, `intelligence:risks`, `intelligence:suggestions`, `intelligence:risk_findings` | LLM-powered analysis |
| **Audit** | `audit:code_quality`, `audit:security` | Aggregate audit reports |
| **Summary** | `summary` | Overall scan summary with aggregate scores |
| **Brief** | `brief_generation` | Generated project brief |

---

## Check Registry Pattern

Checks are pluggable via a registry — new checks can be added without modifying existing code (Open/Closed Principle):

```python
# apps/worker/checks/registry.py

from typing import Protocol

class Check(Protocol):
    name: str
    category: str

    async def run(self, repo_path: str, config: dict) -> CheckResult: ...

class CheckRegistry:
    _checks: dict[str, type[Check]] = {}

    @classmethod
    def register(cls, check_cls: type[Check]) -> type[Check]:
        cls._checks[check_cls.name] = check_cls
        return check_cls

    @classmethod
    def get_checks(cls, names: list[str] | None = None) -> list[type[Check]]:
        if names is None:
            return list(cls._checks.values())
        return [cls._checks[n] for n in names if n in cls._checks]
```

### Built-in Checks

| Check | Category | Description |
|-------|----------|-------------|
| `LOCLimitsCheck` | loc | Files exceeding 300 LOC (CLAUDE.md rule) |
| `NamingConventionsCheck` | naming | File/variable naming standards |
| `FolderStructureCheck` | structure | Atomic design, proper layering |
| `DependencyCheck` | dependency | Known vulnerabilities, outdated packages |
| `SecretScanCheck` | security | Hardcoded secrets, API keys, tokens |
| `SOLIDComplianceCheck` | quality | Single responsibility, dependency inversion patterns |
| `ImportOrderCheck` | naming | React → third-party → aliases → relative |

---

## Progress Reporting

### Milestones (Full Analysis Example)

| Progress | Step | Message |
|----------|------|---------|
| 0% | `init` | Starting job... |
| 5% | `clone` | Cloning repository... |
| 10–40% | `checks` | Running deterministic checks (LOC, naming, structure)... |
| 40–48% | `structural` | Analyzing project structure... |
| 55% | `intelligence:features` | Extracting features (LLM)... |
| 70% | `intelligence:risks` | Identifying risks (LLM)... |
| 85% | `intelligence:suggestions` | Generating suggestions (LLM)... |
| 95% | `saving` | Saving results... |
| 100% | `done` | Job completed. |
| -1 | `error` | Job failed: {error message} |

### Progress Reporter

```python
# apps/worker/utils/progress.py

class ProgressReporter:
    def __init__(self, scan_job_id: str, product_id: str, redis):
        self.scan_job_id = scan_job_id
        self.product_id = product_id
        self.redis = redis
        self.channel = "mizan:scan:progress"

    async def report(self, progress: int, message: str, current_step: str):
        payload = {
            "scanJobId": self.scan_job_id,
            "productId": self.product_id,
            "progress": progress,
            "message": message,
            "currentStep": current_step,
        }
        await self.redis.publish(self.channel, json.dumps(payload))
```

---

## SSE (Server-Sent Events)

### Endpoint

```
GET /events/stream
Authorization: Bearer {token}
```

### Event Types

| Event | Payload | When |
|-------|---------|------|
| `scan:progress` | `{scanJobId, productId, progress, message, currentStep}` | During job execution |
| `scan:completed` | `{scanJobId, productId, jobType, resultSummary}` | Job finished successfully |
| `scan:failed` | `{scanJobId, productId, errorMessage}` | Job failed after retries |
| `keep-alive` | `:` (comment) | Every 30s to prevent connection drops |

### Frontend Integration

```typescript
// hooks/features/useScanProgress.ts
const eventSource = new EventSource(`${API_URL}/events/stream`, {
  headers: { Authorization: `Bearer ${token}` },
});

eventSource.addEventListener('scan:progress', (e) => {
  const data = JSON.parse(e.data);
  if (data.scanJobId === currentJobId) {
    setProgress(data.progress);
    setStep(data.currentStep);
  }
});
```

---

## Error Handling & Retry Strategy

### arq Configuration

```python
# apps/worker/config.py

class WorkerConfig:
    redis_url: str = "redis://localhost:6379"
    queue_name: str = "mizan:jobs"
    max_jobs: int = 3                    # Concurrent jobs per worker
    job_timeout: int = 600               # 10 min max per job
    max_tries: int = 3                   # Retry on failure
    retry_backoff: bool = True           # Exponential backoff
    retry_base_delay: int = 5            # 5s base → 5s, 25s, 125s
    health_check_interval: int = 30      # Seconds
```

### Retry Behavior

| Attempt | Delay | Action |
|---------|-------|--------|
| 1st | Immediate | Execute job |
| 2nd | 5s | Retry after exponential backoff |
| 3rd | 25s | Final retry |
| Failed | — | Set status to `failed`, notify project members, log error |

### Error Handler in Base

```python
# apps/worker/jobs/base.py

class BaseHandler:
    async def execute(self):
        try:
            await self.update_status("running")
            await self.reporter.report(0, "Starting job...", "init")
            result = await self.run()  # Subclass implements this
            await self.save_results(result)
            await self.update_status("completed")
            await self.reporter.report(100, "Job completed.", "done")
            await self.notify_completion()
        except Exception as e:
            await self.update_status("failed", error_message=str(e))
            await self.reporter.report(-1, f"Job failed: {e}", "error")
            await self.notify_failure(e)
            raise  # arq handles retry
```

---

## Job Cancellation

### Flow

1. Frontend sends `POST /jobs/{job_id}/cancel`
2. API sets `scan_jobs.status = 'cancelled'` in DB
3. API publishes cancellation signal to Redis: `mizan:scan:cancel:{job_id}`
4. Worker subscribes to cancellation channel, checks periodically during execution
5. Worker raises `JobCancelledError`, cleans up temp files, exits gracefully

### Worker Cancellation Check

```python
async def check_cancelled(self):
    """Call this between expensive steps."""
    status = await self.get_job_status()
    if status == "cancelled":
        await self.cleanup()
        raise JobCancelledError(f"Job {self.scan_job_id} cancelled by user")
```

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /jobs/*` (trigger scan) | 5 requests | 1 minute per user |
| `GET /jobs/*/stream` (SSE) | 3 connections | Per user (concurrent) |
| General API | 100 requests | 15 minutes per user |

Implementation via Redis sliding window (uses existing Redis instance).

---

## API Endpoints

### Job Management

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/jobs/{type}` | Trigger a new job | Authenticated + product member |
| `GET` | `/jobs/{job_id}` | Get job status + results | Authenticated + product member |
| `GET` | `/jobs` | List jobs (filter by product, type, status) | Authenticated |
| `POST` | `/jobs/{job_id}/cancel` | Cancel a running job | Authenticated + job creator or admin |
| `GET` | `/jobs/{job_id}/stream` | SSE progress stream | Authenticated |
| `GET` | `/jobs/{job_id}/findings` | Get findings (filter by severity, category, resolved) | Authenticated + product member |
| `GET` | `/jobs/diff/{job_a}/{job_b}` | Compare two scan results | Authenticated + product member |

### Worker Admin (Admin Only)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/workers/health` | Worker status, active jobs, Redis memory |
| `GET` | `/workers/stats` | Queue depth, success/failure rates, avg duration |

---

## File Structure

```
apps/worker/
├── __init__.py
├── main.py                    # arq WorkerSettings, startup/shutdown hooks
├── config.py                  # Redis URL, concurrency, timeouts, retry config
├── jobs/
│   ├── __init__.py
│   ├── base.py                # BaseHandler (lifecycle, progress, error handling)
│   ├── job_router.py          # HANDLER_MAP dispatch
│   ├── repo_scan.py           # Full repository analysis
│   ├── diff_scan.py           # Incremental commit/PR scan
│   ├── quality_audit.py       # Scaffold/rule verification
│   ├── security_audit.py      # Dependency + secret scanning
│   ├── ai_generation.py       # AI-powered doc generation
│   ├── evaluation.py          # Engineer/team report generation
│   ├── port_manifest.py       # Lovable migration extraction
│   └── brief_generation.py    # Project brief from codebase
├── checks/
│   ├── __init__.py
│   ├── registry.py            # CheckRegistry (pluggable check system)
│   ├── loc_limits.py          # 300 LOC file limit check
│   ├── naming_conventions.py  # File/variable naming
│   ├── folder_structure.py    # Atomic design, layering
│   ├── dependency_check.py    # Vulnerability scanning
│   ├── secret_scan.py         # Hardcoded secrets detection
│   ├── solid_compliance.py    # SOLID principle checks
│   └── import_order.py        # Import ordering rules
├── utils/
│   ├── __init__.py
│   ├── progress.py            # ProgressReporter (Redis Pub/Sub)
│   ├── git_helpers.py         # Clone, checkout, cleanup temp dirs
│   └── cancellation.py        # Cancellation signal handling

apps/api/routers/
├── jobs.py                    # Job CRUD + trigger endpoints
├── events.py                  # SSE stream endpoint
├── workers.py                 # Admin health/stats endpoints

apps/api/services/
├── job_service.py             # Job creation, status, result retrieval
├── sse_service.py             # SSE connection management + Redis relay

apps/api/schemas/
├── jobs.py                    # JobCreate, JobResponse, FindingResponse, etc.

apps/api/models/
├── scan_job.py                # ScanJob SQLAlchemy model
├── scan_result.py             # ScanResult model
├── finding.py                 # Finding model
```

---

## Notification Integration

When a job completes or fails, the worker triggers notifications via the existing notification system:

```python
# In BaseHandler.notify_completion()
await notification_service.create_for_product_members(
    product_id=self.product_id,
    title=f"{self.job_type} completed",
    message=f"Scan finished with score {self.result_summary.get('score', 'N/A')}/100",
    notification_type="scan_completed",
    metadata={"scan_job_id": str(self.scan_job_id)},
)
```

---

## GitHub Webhook Integration

Inbound GitHub webhooks can auto-trigger `diff_scan` jobs:

```python
# In apps/api/routers/system_documents.py (existing webhook handler)

@router.post("/github/webhook")
async def github_webhook(request: Request, ...):
    event = request.headers.get("X-GitHub-Event")
    if event == "push":
        # Auto-trigger diff_scan for the pushed commit
        await job_service.enqueue(
            job_type="diff_scan",
            product_id=product_id,
            config={"commit_sha": payload["after"], "branch": branch},
        )
```

---

## DB Cleanup / Archival Strategy

| Data | Retention | Action |
|------|-----------|--------|
| `scan_jobs` (completed) | 90 days | Archive to `scan_jobs_archive`, delete originals |
| `scan_jobs` (failed) | 30 days | Delete (failures are transient) |
| `scan_results` | Cascade with `scan_jobs` | Deleted when parent job is archived/deleted |
| `findings` (resolved) | 60 days | Delete resolved findings older than 60 days |
| `findings` (unresolved) | Indefinite | Keep until resolved |
| arq queue (completed) | 100 jobs | arq auto-cleanup (keep last 100) |
| arq queue (failed) | 500 jobs | arq auto-cleanup (keep last 500) |

Cleanup runs as a scheduled arq cron job (daily at 3 AM).

---

## Migration Path (Implementation Order)

### Phase 1: Foundation (Infrastructure)

1. Add `scan_jobs`, `scan_results`, `findings` models + Alembic migration
2. Create `apps/worker/` package with arq settings and `main.py`
3. Add `ProgressReporter` utility
4. Add `BaseHandler` with lifecycle management
5. Update `Makefile`: `make dev-worker` command
6. Update `docker-compose.yml` if needed (Redis is already there)

### Phase 2: Core Jobs

7. Implement `job_router.py` (handler dispatch)
8. Add `/jobs` router to API (enqueue, status, list, cancel)
9. Add `/events/stream` SSE endpoint
10. Implement `repo_scan` job (port from existing synchronous `repo_evaluator`)
11. Implement `quality_audit` job (port from existing `audit_service`)

### Phase 3: Checks & Intelligence

12. Build check registry + 5 built-in checks (LOC, naming, structure, deps, secrets)
13. Implement `ai_generation` job (port from existing synchronous AI service calls)
14. Implement `security_audit` job
15. Implement `diff_scan` job + GitHub webhook trigger

### Phase 4: Polish

16. Add scan comparison endpoint (`/jobs/diff/:a/:b`)
17. Add notification integration (completion/failure alerts)
18. Add rate limiting on job trigger endpoints
19. Add worker health/stats admin endpoints
20. Add DB archival cron job
21. Implement job cancellation flow

### Phase 5: Frontend

22. `useScanProgress` hook (SSE connection + progress state)
23. Job status components (progress bar, step indicator, status badge)
24. Scan results viewer (findings table, severity filters, score display)
25. Scan comparison view (diff two scans)
26. Admin worker dashboard (queue depth, active jobs)

---

## Makefile Commands

```makefile
dev-worker:        # Start arq worker (hot reload via watchfiles)
	cd apps/worker && watchfiles 'python -m arq main.WorkerSettings' --filter python

dev-all:           # Start API + Web + Worker concurrently
	concurrently "make dev-api" "make dev-web" "make dev-worker"
```

---

## Configuration

### Environment Variables

```env
# .env (add to existing)
REDIS_URL=redis://localhost:6379
WORKER_CONCURRENCY=3
WORKER_JOB_TIMEOUT=600
WORKER_MAX_TRIES=3
SCAN_RATE_LIMIT=5          # per minute per user
SCAN_PROGRESS_CHANNEL=mizan:scan:progress
SCAN_CANCEL_CHANNEL=mizan:scan:cancel
```

---

## Key Differences from mizan-pmo

| Aspect | mizan-pmo (Node+Python) | MIZANOS (Python only) |
|--------|-------------------------|----------------------|
| Queue | BullMQ (Node.js) | arq (Python, async-native) |
| API → Queue | Express enqueues via BullMQ | FastAPI enqueues via arq |
| Worker | Separate Python process consuming BullMQ via Redis | Separate Python process via arq (native) |
| Progress relay | Node subscriber → SSE | FastAPI subscriber → SSE |
| DB | Drizzle ORM (TypeScript) | SQLAlchemy 2.0 (Python) |
| Auth on jobs | JWT but no project membership check | JWT + product membership (already fixed in P0) |
| Job cancellation | Not implemented | Planned from day one |
| Admin monitoring | Not implemented | Planned (`/workers/health`, `/workers/stats`) |

---

## Summary

This architecture moves all heavy operations (repo analysis, audits, AI generation) to background workers via arq + Redis, with real-time progress via SSE. It reuses the existing Redis instance, follows the same FastAPI patterns as the rest of the API, and builds on lessons from the mizan-pmo reference while fixing its gaps (cancellation, monitoring, access control).

Estimated scope: ~25 files, 5 phases, can be implemented incrementally starting with `repo_scan` as the first job type.
