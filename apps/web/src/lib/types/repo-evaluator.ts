export interface TechStackInfo {
  languages: string[];
  frameworks: string[];
  package_managers: string[];
  databases: string[];
  notable_deps: string[];
}

export interface FileStats {
  path: string;
  loc: number;
  language: string;
}

export interface StructureInfo {
  total_files: number;
  total_loc: number;
  files_over_300_loc: FileStats[];
  hooks_over_150_loc: FileStats[];
  directory_pattern: string;
  has_barrel_files: boolean;
}

export interface PatternFinding {
  category: string;
  pattern: string;
  occurrences: number;
  example_files: string[];
  severity: "aligned" | "needs_change" | "critical";
  recommendation: string;
}

export interface EvaluationDocument {
  title: string;
  slug: string;
  content: string;
  order: number;
}

export interface EvaluationResult {
  repo_path: string;
  evaluated_at: string;
  tech_stack: TechStackInfo;
  structure: StructureInfo;
  patterns: PatternFinding[];
  has_lovable_project: boolean;
  documents: EvaluationDocument[];
  summary_score: number;
}

export interface BrowseEntry {
  name: string;
  path: string;
  is_dir: boolean;
}

export interface BrowseResponse {
  current_path: string;
  parent_path: string | null;
  entries: BrowseEntry[];
}
