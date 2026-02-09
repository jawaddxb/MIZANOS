export type CredentialCategory =
  | "api_key"
  | "service_login"
  | "database"
  | "cloud_provider"
  | "domain_registrar"
  | "email_service"
  | "payment_gateway"
  | "monitoring"
  | "other";

export interface CompanyCredential {
  id: string;
  label: string;
  category: string;
  service_name: string | null;
  url: string | null;
  username_encrypted: string | null;
  email_encrypted: string | null;
  password_encrypted: string | null;
  api_secret_encrypted: string | null;
  notes_encrypted: string | null;
  tags: string[] | null;
  linked_product_id: string | null;
  created_by: string;
  last_modified_by: string | null;
  created_at: string;
  updated_at: string;
}
