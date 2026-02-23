# Project Intake & Spec Creation — End-to-End Analysis

> **Date**: 2026-02-22
> **Scope**: Full analysis of the intake flow, spec generation, document handling, and identified gaps

---

## 1. End-to-End Flow Overview

The project intake is a **4-step wizard** at `/intake` (restricted to SuperAdmin and Project Manager roles).

```
Step 1: Basic Info → Step 2: Sources → Step 3: Spec Review → Step 4: Confirm & Submit
```

### Step 1: Basic Info (`IntakeBasicInfo.tsx`)
- **Project Name** (required, unique — validated against existing products)
- **Business Pillar** (required) — Business, Marketing, Development, Product
- **Source Type** (optional) — Greenfield, Lovable Port, Replit Port, GitHub (Unscaffolded), External Handoff, In Progress, In Progress (Standards), In Progress (Legacy)
- **Description** (optional)

### Step 2: Sources (`IntakeSourcesStep.tsx`)
Multi-tab interface for collecting source material:

| Tab | Component | What it captures |
|-----|-----------|-----------------|
| **Documents** | `DocumentUpload.tsx` | Drag-and-drop file upload: PDF, DOCX, MD, TXT, PNG, JPG, WEBP (max 20MB) |
| **Audio** | `AudioNotes.tsx` | Record audio notes, transcribe via backend (OpenAI Whisper) |
| **Markdown** | `MarkdownInput.tsx` | Free-text markdown input |
| **Paste** | `PastePreview.tsx` | Large text area for pasting content |
| **Website** | `WebsiteScraper.tsx` | URL input → backend scrapes content, screenshots, branding, product info |
| **GitHub** | `GitHubRepoInput.tsx` | Repository URL, optional PAT, branch selection, extracts repo info & tech stack |

### Step 3: Spec Review (`IntakeSpecReview.tsx`)
- AI generates a structured specification from all sources
- Editable sections: Summary, User Stories, Business Rules, Acceptance Criteria, Architecture, Data Models, Integrations, Non-Functional Requirements, Features, Tech Stack, QA Checklist
- "Regenerate" button to re-run AI generation

### Step 4: Confirmation (`IntakeConfirmation.tsx`)
- Review summary of all collected data
- Submission progress overlay (Creating project → Saving sources → Saving specification → Complete)

---

## 2. Submission Flow (`useIntakeSubmit.ts`)

```
1. POST /products                                    → Create product (status: "intake")
2. POST /products/{id}/specification-sources (loop)  → Save each source as SpecificationSource
3. POST /marketing/auto-populate                     → Auto-create domains & social handles from scraped data
4. PATCH /products/{id}                              → Set logo_url from scraped data
5. POST /specifications                              → Save the AI-generated spec as Specification
6. Redirect to /projects/{product.id}
```

---

## 3. How Sources Are Persisted

Each source is saved as a `SpecificationSource` database record via `POST /products/{id}/specification-sources`:

| Source Type | `source_type` | What's Stored |
|-------------|---------------|---------------|
| **Text files** (.md, .txt, .json, .yaml, .csv) | `"markdown"` | File content read as text → `raw_content` |
| **Binary files** (PDF, DOCX, images) | `"document"` | **ONLY a placeholder**: `[Binary file: name, size bytes, type: mime]` → `raw_content` |
| **Markdown notes** | `"markdown"` | User-typed markdown → `raw_content` |
| **Pasted content** | `"paste"` | User-pasted text → `raw_content` |
| **Audio transcriptions** | `"audio"` | Transcribed text → `transcription` |
| **Scraped websites** | `"website"` | Markdown content → `raw_content`, URL → `url`, branding → `branding` (JSONB) |
| **GitHub repos** | `"github"` | Repo URL → `url`, repo info + tech stack + branch → `raw_content` (JSON string) |

### Where Uploaded Documents Are Saved

**They are NOT saved as files.** During intake, `useIntakeSubmit.ts` (lines 78-101) handles documents:
- **Text-like files**: Read as text via `doc.text()`, saved as `raw_content` on `SpecificationSource`
- **Binary files**: Only a text placeholder is saved. The actual `File` objects are discarded after form submission. No file upload endpoint is called.

The system has a separate `ProductDocument` model with actual file upload (`POST /documents/upload/{product_id}`), but this is only used in the post-creation Documents tab — **never during intake**.

### `SpecificationSource` Model (DB)
```
id, product_id, source_type, url, file_name, file_url*, raw_content,
transcription, screenshot_base64, logo_url, ai_summary (JSONB),
branding (JSONB), screenshots (JSONB), created_at
```
*`file_url` exists in the schema but is **never populated** during intake.

---

## 4. AI Spec Generation

### During Intake (Frontend-driven)

**File**: `IntakeForm.tsx` → `handleGenerateSpec()`

1. `buildSourceSummary(sources)` aggregates all source content into a text block
2. Constructs a prompt with project name, description, source summary, and expected JSON format
3. Calls `aiRepository.createSession()` then `aiRepository.sendMessage(session.id, prompt)`
4. Parses JSON response into `GeneratedSpec` structure
5. Stores in form state for editing

**What the AI sees for binary documents**: Just `"Uploaded documents: file1.pdf, file2.docx"` — no content from these files.

### Post-Creation (Backend-driven, "Regenerate Spec")

**File**: `specification_service.py` → `generate_specification()`

1. Fetches all `SpecificationSource` records for the product
2. `build_source_context(sources, product_name, pillar)` aggregates source content
3. `build_spec_prompt(product_name, context)` constructs the LLM prompt
4. Calls OpenRouter (Claude Sonnet 4) or OpenAI (GPT-4o)
5. Parses response, creates new `Specification` record with incremented version
6. Creates `SpecificationFeature` rows from parsed features

**What the AI sees for binary documents**: `[Binary file: name, size bytes, type: mime]` — useless placeholder.

---

## 5. Post-Creation: Where to Find Sources

### Sources Tab (`SourcesTab.tsx`)
- Located in project detail page under "Sources" tab
- Lists all `SpecificationSource` records as cards
- Shows: icon by type, file name or URL, AI summary, creation date
- Actions: "Regenerate Spec", "Add Source"
- **Problem**: Document sources show file name but have no download/view link

### Documents Tab (`DocumentsList`)
- Separate system using `ProductDocument` model
- Supports actual file upload, folders, versioning, access links
- **Problem**: Contains nothing from intake — intake documents never become `ProductDocument` records

---

## 6. Identified Gaps

### Gap 1: Binary Files Are Never Uploaded
**Location**: `useIntakeSubmit.ts` lines 93-100
**Impact**: PDF, DOCX, and image files uploaded during intake are lost after form submission. Only a text placeholder is saved.

### Gap 2: No Text Extraction from Binary Files
**Impact**: The AI spec generation gets zero useful content from uploaded PDFs or DOCX files. It only sees file names or placeholder strings.

### Gap 3: Two Disconnected Document Systems
**Impact**: `SpecificationSource` (intake) and `ProductDocument` (post-creation) are completely separate. Files uploaded during intake don't appear in the Documents tab, and the Sources tab can't display actual files.

### Gap 4: Post-Creation Source Documents Not Viewable
**Location**: `SourcesTab.tsx` — `SourceCard` component
**Impact**: Document-type sources show only a file name badge with no way to view or download the original file.

### Gap 5: No Custom Instructions for Spec Generation
**Location**: `IntakeSpecReview.tsx`, `IntakeForm.tsx`, `spec_source_context.py`
**Impact**: Users cannot guide the AI to focus on specific aspects (security, mobile-first, B2B focus, etc.). The prompt is entirely auto-generated.

### Gap 6: Files Over 300 LOC Limit
- `IntakeForm.tsx` — 317 LOC (over 300 limit)
- `IntakeSpecReview.tsx` — 318 LOC (over 300 limit)
- `specification_service.py` — 379 LOC (over 300 limit)

---

## 7. Key File Paths

### Frontend
```
apps/web/src/app/(app)/intake/page.tsx                          — Intake page (role guard)
apps/web/src/components/organisms/intake/IntakeForm.tsx          — Main wizard orchestrator (317 LOC)
apps/web/src/components/organisms/intake/IntakeBasicInfo.tsx     — Step 1
apps/web/src/components/organisms/intake/IntakeSourcesStep.tsx   — Step 2 container
apps/web/src/components/organisms/intake/DocumentUpload.tsx      — File uploader
apps/web/src/components/organisms/intake/AudioNotes.tsx          — Audio recording
apps/web/src/components/organisms/intake/WebsiteScraper.tsx      — Website scraping
apps/web/src/components/organisms/intake/GitHubRepoInput.tsx     — GitHub integration
apps/web/src/components/organisms/intake/IntakeSpecReview.tsx    — Step 3 (318 LOC)
apps/web/src/components/organisms/intake/IntakeConfirmation.tsx  — Step 4
apps/web/src/components/organisms/intake/types.ts                — TypeScript interfaces
apps/web/src/hooks/features/useIntakeSubmit.ts                   — Submission orchestration
apps/web/src/lib/api/repositories/specifications.repository.ts   — Spec API calls
apps/web/src/components/organisms/product/SourcesTab.tsx         — Post-creation sources view
apps/web/src/lib/types/specification.ts                          — SpecificationSource type
```

### Backend
```
apps/api/routers/products.py              — Product + source endpoints (278 LOC)
apps/api/routers/specifications.py        — Spec endpoints (178 LOC)
apps/api/services/product_service.py      — Product business logic
apps/api/services/specification_service.py — Spec generation (379 LOC)
apps/api/services/spec_source_context.py  — AI prompt builder (120 LOC)
apps/api/models/specification.py          — Specification, SpecificationFeature, SpecificationSource models
apps/api/models/product.py                — Product, ProductDocument models
apps/api/services/document_service.py     — Document file upload service
apps/api/routers/documents.py             — Document management endpoints
```

---

## 8. Database Models Reference

### SpecificationSource (intake sources)
```sql
specification_sources (
  id UUID PK,
  product_id UUID FK → products,
  source_type VARCHAR,        -- "document", "markdown", "paste", "audio", "website", "github"
  url VARCHAR NULL,
  file_name VARCHAR NULL,
  file_url VARCHAR NULL,      -- EXISTS but NEVER POPULATED during intake
  raw_content TEXT NULL,
  transcription TEXT NULL,
  screenshot_base64 TEXT NULL,
  logo_url VARCHAR NULL,
  ai_summary JSONB NULL,
  branding JSONB NULL,
  screenshots JSONB NULL,
  created_at TIMESTAMPTZ
)
```

### ProductDocument (post-creation documents)
```sql
product_documents (
  id UUID PK,
  product_id UUID FK → products,
  uploaded_by UUID FK → profiles NOT NULL,
  folder_id UUID FK → document_folders NULL,
  file_name VARCHAR,
  file_path VARCHAR,
  file_type VARCHAR,
  file_size INTEGER,
  category VARCHAR NULL,
  description TEXT NULL,
  ai_summary TEXT NULL,
  summary_generated_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```
