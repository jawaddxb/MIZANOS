import type { PillarType, ProjectSourceType } from "@/lib/types";
import type { JsonValue } from "@/lib/types";

// ---------------------------------------------------------------------------
// Intake step identifiers
// ---------------------------------------------------------------------------
export type IntakeStep = "basic-info" | "sources" | "spec-review" | "confirmation";

export const INTAKE_STEPS: readonly IntakeStep[] = [
  "basic-info",
  "sources",
  "spec-review",
  "confirmation",
] as const;

export const STEP_LABELS: Record<IntakeStep, string> = {
  "basic-info": "Basic Info",
  sources: "Sources",
  "spec-review": "Spec Review",
  confirmation: "Confirm",
};

// ---------------------------------------------------------------------------
// Collected source data types
// ---------------------------------------------------------------------------
export interface AudioNote {
  id: string;
  blob: Blob;
  objectUrl?: string;
  transcription?: string;
  isTranscribing: boolean;
}

export interface ScrapedAnalysis {
  productName: string;
  description: string;
  features: string[];
  targetAudience: string;
  pricingModel: string;
  techIndicators: string[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  socialHandles?: Array<{ platform: string; handle: string }>;
}

export interface ExtractedDomainInfo {
  domain: string;
  ssl_status: string;
  is_secured: boolean;
}

export interface ExtractedSocialHandle {
  platform: string;
  handle: string;
  url?: string | null;
}

export interface ExtractedMarketingData {
  domain: ExtractedDomainInfo;
  socialHandles: ExtractedSocialHandle[];
  contactEmails: string[];
}

export interface ScrapedWebsite {
  url: string;
  markdown: string;
  logo: string | null;
  screenshots: Array<{ url: string }> | null;
  branding: Record<string, JsonValue> | null;
  metadata: { title: string | null } | null;
  aiSummary: string | null;
  analysis: ScrapedAnalysis | null;
  marketing: ExtractedMarketingData | null;
}

export interface GitHubData {
  repositoryUrl: string;
  githubToken: string | null;
  patId?: string | null;
  repoInfo: Record<string, JsonValue>;
  techStack: Record<string, JsonValue>;
  branch: string;
}

export interface IntakeSourceData {
  documents: File[];
  audioNotes: AudioNote[];
  markdownContent: string;
  pasteContent: string;
  scrapedWebsites: ScrapedWebsite[];
  githubData: GitHubData | null;
}

// ---------------------------------------------------------------------------
// Generated specification (AI output)
// ---------------------------------------------------------------------------
export interface FunctionalSpec {
  userStories: string[];
  businessRules: string[];
  acceptanceCriteria: string[];
}

export interface TechnicalSpec {
  architecture: string;
  dataModels: string[];
  integrations: string[];
  nonFunctionalRequirements: string[];
}

export interface GeneratedSpec {
  summary: string;
  functionalSpec: FunctionalSpec;
  technicalSpec: TechnicalSpec;
  features: string[];
  techStack: string[];
  qaChecklist: string[];
}

// ---------------------------------------------------------------------------
// Full intake form state
// ---------------------------------------------------------------------------
export interface IntakeFormData {
  projectName: string;
  pillar: PillarType | "";
  sourceType: ProjectSourceType;
  description: string;
  sources: IntakeSourceData;
  generatedSpec: GeneratedSpec | null;
}

// ---------------------------------------------------------------------------
// Helper: check if text-like file
// ---------------------------------------------------------------------------
export function isTextLikeSpecFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "text/markdown" ||
    file.type === "text/plain" ||
    name.endsWith(".md") ||
    name.endsWith(".txt")
  );
}

// ---------------------------------------------------------------------------
// Source type constants (ported from Lovable hooks)
// ---------------------------------------------------------------------------
export const SOURCE_TYPE_OPTIONS: Array<{
  value: ProjectSourceType;
  label: string;
  description: string;
}> = [
  {
    value: "greenfield",
    label: "Greenfield",
    description: "Brand new project starting from scratch",
  },
  {
    value: "lovable_port",
    label: "Lovable Port",
    description: "Porting an existing Lovable project",
  },
  {
    value: "replit_port",
    label: "Replit Port",
    description: "Porting an existing Replit project",
  },
  {
    value: "github_unscaffolded",
    label: "GitHub (Unscaffolded)",
    description: "Existing GitHub repo without scaffolding",
  },
  {
    value: "external_handoff",
    label: "External Handoff",
    description: "Project handed off from an external team",
  },
  {
    value: "in_progress",
    label: "In Progress",
    description: "Project already underway",
  },
  {
    value: "in_progress_standards",
    label: "In Progress (Standards)",
    description: "In-progress project needing standards alignment",
  },
  {
    value: "in_progress_legacy",
    label: "In Progress (Legacy)",
    description: "Legacy project being modernized",
  },
];

export const PILLAR_OPTIONS: Array<{
  value: PillarType;
  label: string;
}> = [
  { value: "business", label: "Business" },
  { value: "marketing", label: "Marketing" },
  { value: "development", label: "Development" },
  { value: "product", label: "Product" },
];
