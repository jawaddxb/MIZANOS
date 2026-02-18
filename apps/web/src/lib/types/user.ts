import type { AppRole } from "./enums";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: AppRole | null;
  status: string | null;
  availability: string | null;
  office_location: string | null;
  skills: string[] | null;
  current_projects: number | null;
  max_projects: number | null;
  reports_to: string | null;
  must_reset_password: boolean | null;
  invited_at: string | null;
  invited_by: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  assigned_by: string | null;
  created_at: string;
}

export interface TeamHoliday {
  id: string;
  profile_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface NationalHoliday {
  id: string;
  name: string;
  date: string;
  location: string;
  recurring: boolean | null;
  created_at: string;
}
