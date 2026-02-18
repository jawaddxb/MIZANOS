import type { AppRole } from "./enums";

export interface Module {
  id: string;
  name: string;
  category: string;
  description: string | null;
  docs_url: string | null;
  scaffolding_url: string | null;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role: AppRole;
  feature_key: string;
  can_access: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface FeaturePermission {
  id: string;
  feature_key: string;
  feature_name: string;
  category: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Integration {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string | null;
  is_active: boolean;
  api_key: string | null;
  api_secret: string | null;
  endpoint_url: string | null;
  docs_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectIntegration {
  id: string;
  product_id: string;
  name: string;
  type: string;
  category: string;
  status: string;
  description: string | null;
  endpoint_url: string | null;
  docs_url: string | null;
  notes: string | null;
  api_key_configured: boolean | null;
  global_integration_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrgSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updated_by: string | null;
  updated_at: string;
}
