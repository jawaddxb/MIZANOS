# Lovable Porting System - Architecture Diagrams

## 1. Simplified Pipeline

```mermaid
flowchart LR
    A[Lovable Source] -->|scan| B[LovableExtractor]
    B -->|manifest| C[PortTaskGenerator]
    C -->|tasks + prompts| D[Kanban Board]
    D -->|developer picks task| E[Claude Code]
    E -->|writes files| F[Monorepo Codebase]
    F -->|verify| G[verify-port.sh]

    style A fill:#f9f,stroke:#333,color:#000
    style B fill:#bbf,stroke:#333,color:#000
    style C fill:#fbb,stroke:#333,color:#000
    style D fill:#bfb,stroke:#333,color:#000
    style E fill:#ff9,stroke:#333,color:#000
    style F fill:#9cf,stroke:#333,color:#000
    style G fill:#9ff,stroke:#333,color:#000
```

---

## 2. Extraction Phase

```mermaid
flowchart TB
    SRC[Lovable/Supabase Source Dir] --> SH[extract-lovable-manifest.sh]
    SRC --> LE[LovableExtractor - Python]

    SH --> PM[PORT_MANIFEST.md]
    LE --> LM[LovableManifest - Pydantic]

    LM --> T[Tables + Columns]
    LM --> Q[Supabase Queries]
    LM --> EF[Edge Functions]
    LM --> AP[Auth Patterns]
    LM --> RT[Routes]
    LM --> CO[Components]
    LM --> HK[Hooks]
    LM --> RL[RLS Policies]
    LM --> SB[Storage Buckets]
    LM --> RPC[RPC Calls]
    LM --> ENV[Env Vars]

    style SRC fill:#f9f,stroke:#333,color:#000
    style SH fill:#bbf,stroke:#333,color:#000
    style LE fill:#bbf,stroke:#333,color:#000
    style PM fill:#ddf,stroke:#333,color:#000
    style LM fill:#ddf,stroke:#333,color:#000
```

---

## 3. Task Generation Phase

```mermaid
flowchart TB
    LM[LovableManifest] --> PTG[PortTaskGenerator]
    PTG --> CPB[ClaudePromptBuilder]

    CPB --> T0[Phase 0: Schema Review]
    CPB --> T1[Phase 1: Scaffold Setup]
    CPB --> T2A[Phase 2: Backend Model + Schema]
    CPB --> T2B[Phase 2: Backend Service + Router]
    CPB --> T2C[Phase 2: Frontend Types + Repo]
    CPB --> T2D[Phase 2: Frontend Hooks]
    CPB --> T2E[Phase 2: UI Components + Pages]
    CPB --> T3A[Phase 3: Auth Wiring]
    CPB --> T3B[Phase 3: Storage Migration]
    CPB --> T3C[Phase 3: Realtime to Polling]
    CPB --> T3D[Phase 3: RPC to Services]
    CPB --> T3E[Phase 3: Env Var Audit]
    CPB --> T4[Phase 4: Verification]

    T2A --> |per domain| T2B --> T2C --> T2D --> T2E

    style LM fill:#ddf,stroke:#333,color:#000
    style PTG fill:#fbb,stroke:#333,color:#000
    style CPB fill:#fdd,stroke:#333,color:#000
    style T0 fill:#bfb,stroke:#333,color:#000
    style T1 fill:#bfb,stroke:#333,color:#000
    style T4 fill:#bfb,stroke:#333,color:#000
```

---

## 4. What Each Task Contains

```mermaid
flowchart LR
    TASK[Task Record in DB] --> TITLE[title: domain + phase]
    TASK --> DESC[description: what to do]
    TASK --> HOURS[estimated_hours]
    TASK --> PROMPT[claude_code_prompt]

    PROMPT --> P1[Pre-written Python model code]
    PROMPT --> P2[Pre-written TS interfaces]
    PROMPT --> P3[Step-by-step commands]
    PROMPT --> P4[Common mistakes warnings]
    PROMPT --> P5[Type mappings TS to SQLAlchemy]

    style TASK fill:#bfb,stroke:#333,color:#000
    style PROMPT fill:#ffd,stroke:#f90,stroke-width:3px,color:#000
```

---

## 5. Execution Phase

```mermaid
flowchart TB
    KB[Developer picks task from Kanban] --> COPY[Copies claude_code_prompt]
    COPY --> CC[Claude Code AI]

    KB --> SCAFFOLD[scaffold-domain.sh]
    SCAFFOLD --> F1[models/domain.py]
    SCAFFOLD --> F2[schemas/domain.py]
    SCAFFOLD --> F3[services/domain_service.py]
    SCAFFOLD --> F4[routers/domain.py]
    SCAFFOLD --> F5[types/domain.ts]
    SCAFFOLD --> F6[repositories/domain.repository.ts]
    SCAFFOLD --> F7[hooks/queries/useDomain.ts]
    SCAFFOLD --> F8[hooks/mutations/useDomainMutations.ts]

    CC --> REAL[Production code in monorepo]

    style KB fill:#ff9,stroke:#333,color:#000
    style CC fill:#ff9,stroke:#333,color:#000
    style SCAFFOLD fill:#ff9,stroke:#333,color:#000
    style REAL fill:#9cf,stroke:#333,color:#000
```

---

## 6. Type Mapping

```mermaid
flowchart LR
    S1[string] --> A1[str / String]
    S2[number] --> A2[int / Integer or float / Float]
    S3[boolean] --> A3[bool / Boolean]
    S4[Date] --> A4[datetime / DateTime]
    S5[Json] --> A5[dict / JSON]
    S6[string with _id suffix] --> A6[uuid.UUID / UUID]

    style S1 fill:#f9f,stroke:#333,color:#000
    style S2 fill:#f9f,stroke:#333,color:#000
    style S3 fill:#f9f,stroke:#333,color:#000
    style S4 fill:#f9f,stroke:#333,color:#000
    style S5 fill:#f9f,stroke:#333,color:#000
    style S6 fill:#f9f,stroke:#333,color:#000
    style A1 fill:#bfb,stroke:#333,color:#000
    style A2 fill:#bfb,stroke:#333,color:#000
    style A3 fill:#bfb,stroke:#333,color:#000
    style A4 fill:#bfb,stroke:#333,color:#000
    style A5 fill:#bfb,stroke:#333,color:#000
    style A6 fill:#bfb,stroke:#333,color:#000
```

---

## 7. Code Generation vs Analysis Only

```mermaid
flowchart TB
    subgraph ANALYSIS["Analysis Only - No Files Written"]
        E1[extract-lovable-manifest.sh]
        E2[LovableExtractor]
        E3[PortTaskGenerator]
        E4[ClaudePromptBuilder]
    end

    subgraph WRITES["Actually Writes Files"]
        W1[scaffold-domain.sh - 8 boilerplate files]
        W2[Claude Code AI - production code]
        W3[port-lovable agent - 7 phase process]
    end

    style ANALYSIS fill:#fee,stroke:#c33,color:#000
    style WRITES fill:#efe,stroke:#3c3,color:#000
```
