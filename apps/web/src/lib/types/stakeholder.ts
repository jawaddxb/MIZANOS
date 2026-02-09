export type StakeholderRole =
  | "sponsor"
  | "pm"
  | "tech_lead"
  | "marketing_lead"
  | "business_lead"
  | "engineer"
  | "designer"
  | "qa";

export interface Stakeholder {
  id: string;
  product_id: string;
  profile_id: string | null;
  name: string;
  role: StakeholderRole;
  responsibilities: string[];
  email: string | null;
  is_external: boolean;
  created_at: string;
}

export const STAKEHOLDER_ROLE_LABELS: Record<StakeholderRole, string> = {
  sponsor: "Executive Sponsor",
  pm: "Project Manager",
  tech_lead: "Technical Lead",
  marketing_lead: "Marketing Lead",
  business_lead: "Business Lead",
  engineer: "Engineer",
  designer: "Designer",
  qa: "QA Lead",
};
