import type { JsonValue } from "./common";

export interface Specification {
  id: string;
  product_id: string;
  content: JsonValue;
  version: number;
  custom_instructions: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpecificationFeature {
  id: string;
  name: string;
  description: string | null;
  product_id: string;
  specification_id: string | null;
  status: string;
  priority: string;
  sort_order: number;
  is_reusable: boolean;
  reusable_category: string | null;
  github_path: string | null;
  acceptance_criteria: JsonValue | null;
  task_id: string | null;
  source_feature_id: string | null;
  source_product_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpecificationSource {
  id: string;
  product_id: string;
  source_type: string;
  url: string | null;
  file_name: string | null;
  file_url: string | null;
  raw_content: string | null;
  transcription: string | null;
  screenshot_base64: string | null;
  screenshots: JsonValue | null;
  ai_summary: JsonValue | null;
  branding: JsonValue | null;
  logo_url: string | null;
  created_at: string;
}
