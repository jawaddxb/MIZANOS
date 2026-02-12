export type SystemDocType =
  | "functional_spec"
  | "implementation_spec"
  | "deployment_docs";

export interface SystemDocument {
  id: string;
  product_id: string;
  doc_type: SystemDocType;
  title: string;
  content: string | null;
  version: number;
  generation_source: string | null;
  source_metadata: Record<string, unknown> | null;
  generated_at: string | null;
  generated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerateDocsResponse {
  documents_created: number;
  doc_types: string[];
}
