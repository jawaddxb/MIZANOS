export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface Job {
  id: string;
  job_type: string;
  status: JobStatus;
  progress: number;
  progress_message: string | null;
  product_id: string | null;
  user_id: string | null;
  input_data: Record<string, unknown> | null;
  result_data: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  retry_count: number;
  arq_job_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobCreateResponse {
  job_id: string;
  status: string;
}
