export interface AIChatSession {
  id: string;
  user_id: string;
  product_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIChatMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}
