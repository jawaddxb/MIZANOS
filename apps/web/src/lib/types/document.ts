export interface DocumentFolder {
  id: string;
  product_id: string;
  name: string;
  parent_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_path: string;
  file_size: number;
  file_type: string;
  change_notes: string | null;
  is_current: boolean;
  uploaded_by: string;
  created_at: string;
}

export interface DocumentAccessLink {
  id: string;
  product_id: string;
  name: string;
  token: string;
  is_active: boolean;
  access_count: number | null;
  expires_at: string | null;
  last_accessed_at: string | null;
  created_by: string;
  created_at: string;
}

export interface ExternalDocumentLink {
  id: string;
  product_id: string;
  name: string;
  url: string;
  doc_type: string;
  category: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
