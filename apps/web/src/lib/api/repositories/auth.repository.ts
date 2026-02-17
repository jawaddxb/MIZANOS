import type { AxiosInstance } from "axios";
import { apiClient, clearTokens, setTokens } from "../client";

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role?: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

interface AuthResponse extends AuthTokens {
  user: {
    id: string;
    profile_id?: string;
    email: string;
    full_name: string | null;
    role: string | null;
    avatar_url: string | null;
  };
}

interface ResetPasswordRequest {
  email: string;
}

interface ConfirmResetRequest {
  token: string;
  new_password: string;
}

export class AuthRepository {
  private readonly client: AxiosInstance;

  constructor(client: AxiosInstance = apiClient) {
    this.client = client;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>("/auth/login", data);
    setTokens(response.data.access_token, response.data.refresh_token);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>("/auth/register", data);
    setTokens(response.data.access_token, response.data.refresh_token);
    return response.data;
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const response = await this.client.post<AuthTokens>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    setTokens(response.data.access_token, response.data.refresh_token);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post("/auth/logout");
    } finally {
      clearTokens();
    }
  }

  async forgotPassword(data: ResetPasswordRequest): Promise<void> {
    await this.client.post("/auth/forgot-password", data);
  }

  async confirmReset(data: ConfirmResetRequest): Promise<void> {
    await this.client.post("/auth/confirm-reset", data);
  }

  async me(): Promise<AuthResponse["user"]> {
    const response = await this.client.get<AuthResponse["user"]>("/auth/me");
    return response.data;
  }
}

export const authRepository = new AuthRepository();
