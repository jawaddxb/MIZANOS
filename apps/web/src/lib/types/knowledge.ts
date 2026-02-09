export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string | null;
  category: string;
  entry_type: string;
  product_id: string | null;
  file_name: string | null;
  file_path: string | null;
  file_size: number | null;
  file_type: string | null;
  source_type: string | null;
  source_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
