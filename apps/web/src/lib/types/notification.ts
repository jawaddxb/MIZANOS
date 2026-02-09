import type { NotificationType } from "./enums";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: NotificationType;
  read: boolean;
  product_id: string | null;
  task_id: string | null;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  task_assignment: boolean;
  status_changes: boolean;
  deadline_reminders: boolean;
  audit_alerts: boolean;
  critical_alerts: boolean;
  email_digest: boolean;
  created_at: string;
  updated_at: string;
}
