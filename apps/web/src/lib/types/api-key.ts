export interface ApiKey {
  id: string;
  label: string;
  key_prefix: string;
  created_by: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyCreateResponse extends ApiKey {
  raw_key: string;
}
