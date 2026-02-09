export interface MarketingDomain {
  id: string;
  product_id: string;
  domain_name: string;
  owner_name: string;
  owner_email: string | null;
  registrar: string | null;
  registration_date: string | null;
  expiry_date: string | null;
  dns_provider: string | null;
  ssl_status: string | null;
  is_secured: boolean | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MarketingSocialHandle {
  id: string;
  product_id: string;
  platform: string;
  handle: string;
  profile_url: string | null;
  is_active: boolean | null;
  notes: string | null;
  registered_by: string;
  registered_at: string;
  created_at: string;
  updated_at: string;
}

export interface MarketingCredential {
  id: string;
  product_id: string;
  label: string;
  credential_type: string;
  username: string | null;
  email: string | null;
  password_encrypted: string | null;
  additional_info: string | null;
  domain_id: string | null;
  social_handle_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MarketingChecklistItem {
  id: string;
  product_id: string;
  title: string;
  description: string | null;
  category: string;
  is_completed: boolean | null;
  completed_at: string | null;
  completed_by: string | null;
  order_index: number | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}
