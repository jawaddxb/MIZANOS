export interface DeploymentChecklistItem {
  id: string;
  product_id: string;
  category: string;
  item_key: string;
  title: string;
  description: string | null;
  is_checked: boolean;
  checked_at: string | null;
  checked_by: string | null;
  notes: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}
