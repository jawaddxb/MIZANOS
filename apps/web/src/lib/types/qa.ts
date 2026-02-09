export interface QACheck {
  id: string;
  product_id: string;
  title: string;
  description: string | null;
  category: string;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
