export interface EngineerEvaluation {
  id: string;
  profile_id: string;
  evaluated_by: string | null;
  evaluation_period: string;
  code_quality: number;
  architecture: number;
  ai_skills: number;
  debugging: number;
  understanding_requirements: number;
  ui_ux_design: number;
  communication: number;
  team_behavior: number;
  reliability: number;
  ownership: number;
  business_impact: number;
  leadership: number;
  overall_score: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvaluationSummary {
  profile_id: string;
  overall_score: number;
  tech_avg: number;
  product_avg: number;
  comms_avg: number;
  ownership_avg: number;
  evaluation_period: string;
  projects_completed: number;
  avg_project_score: number;
}

export interface ProjectCompletion {
  id: string;
  product_id: string;
  product_name: string;
  profile_id: string;
  score: number;
  quality_rating: number | null;
  timeliness_rating: number | null;
  collaboration_rating: number | null;
  feedback: string | null;
  role_on_project: string | null;
  skills_demonstrated: string[] | null;
  completed_at: string;
  created_at: string;
}
