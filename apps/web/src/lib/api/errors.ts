import type { AxiosError } from "axios";

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status: number, code: string = "UNKNOWN_ERROR") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  static fromAxiosError(error: AxiosError<ApiErrorResponse>): ApiError {
    const status = error.response?.status ?? 500;
    const data = error.response?.data;
    const message =
      data?.detail ?? data?.message ?? error.message ?? "An unexpected error occurred";
    const code = status === 401 ? "UNAUTHORIZED" : status === 403 ? "FORBIDDEN" : "API_ERROR";

    return new ApiError(message, status, code);
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}
