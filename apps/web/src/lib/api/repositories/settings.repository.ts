import type { AxiosInstance } from "axios";
import type {
  Module,
  RolePermission,
  FeaturePermission,
  Integration,
  ProjectIntegration,
  AppRole,
  StandardsRepository as StandardsRepoType,
  UserOverride,
  PermissionAuditLog,
  UserWithRole,
  UserRole,
  OrgSetting,
} from "@/lib/types";
import { apiClient } from "../client";

export class SettingsRepository {
  private readonly client: AxiosInstance;
  private readonly basePath = "/settings";

  constructor(client: AxiosInstance = apiClient) {
    this.client = client;
  }

  async getModules(): Promise<Module[]> {
    const response = await this.client.get<Module[]>(`${this.basePath}/modules`);
    return response.data;
  }

  async createModule(data: Partial<Module>): Promise<Module> {
    const response = await this.client.post<Module>(`${this.basePath}/modules`, data);
    return response.data;
  }

  async updateModule(moduleId: string, data: Partial<Module>): Promise<Module> {
    const response = await this.client.patch<Module>(
      `${this.basePath}/modules/${moduleId}`,
      data,
    );
    return response.data;
  }

  async deleteModule(moduleId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/modules/${moduleId}`);
  }

  async getRolePermissions(role?: AppRole): Promise<RolePermission[]> {
    const path = role
      ? `${this.basePath}/permissions/${role}`
      : `${this.basePath}/permissions`;
    const response = await this.client.get<RolePermission[]>(path);
    return response.data;
  }

  async updateRolePermission(
    permissionId: string,
    data: { can_access: boolean },
  ): Promise<RolePermission> {
    const response = await this.client.patch<RolePermission>(
      `${this.basePath}/permissions/${permissionId}`,
      data,
    );
    return response.data;
  }

  async getFeaturePermissions(): Promise<FeaturePermission[]> {
    const response = await this.client.get<FeaturePermission[]>(
      `${this.basePath}/feature-permissions`,
    );
    return response.data;
  }

  async getIntegrations(): Promise<Integration[]> {
    const response = await this.client.get<Integration[]>(
      `${this.basePath}/integrations/global`,
    );
    return response.data;
  }

  async createIntegration(data: Partial<Integration>): Promise<Integration> {
    const response = await this.client.post<Integration>(
      `${this.basePath}/integrations/global`,
      data,
    );
    return response.data;
  }

  async updateIntegration(
    integrationId: string,
    data: Partial<Integration>,
  ): Promise<Integration> {
    const response = await this.client.patch<Integration>(
      `${this.basePath}/integrations/global/${integrationId}`,
      data,
    );
    return response.data;
  }

  async deleteIntegration(integrationId: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/integrations/global/${integrationId}`,
    );
  }

  async getProjectIntegrations(productId: string): Promise<ProjectIntegration[]> {
    const response = await this.client.get<ProjectIntegration[]>(
      `${this.basePath}/project-integrations`,
      { params: { product_id: productId } },
    );
    return response.data;
  }

  async getUserOverrides(userId?: string): Promise<UserOverride[]> {
    const response = await this.client.get<UserOverride[]>(
      `${this.basePath}/user-overrides`,
      { params: userId ? { user_id: userId } : undefined },
    );
    return response.data;
  }

  async createUserOverride(data: {
    user_id: string;
    feature_key: string;
    override_type: "grant" | "deny";
    reason?: string;
    expires_at?: string;
  }): Promise<UserOverride> {
    const response = await this.client.post<UserOverride>(
      `${this.basePath}/user-overrides`,
      data,
    );
    return response.data;
  }

  async updateUserOverride(
    overrideId: string,
    data: Partial<UserOverride>,
  ): Promise<UserOverride> {
    const response = await this.client.patch<UserOverride>(
      `${this.basePath}/user-overrides/${overrideId}`,
      data,
    );
    return response.data;
  }

  async deleteUserOverride(overrideId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/user-overrides/${overrideId}`);
  }

  async getPermissionAuditLog(limit?: number): Promise<PermissionAuditLog[]> {
    const response = await this.client.get<PermissionAuditLog[]>(
      `${this.basePath}/permission-audit-log`,
      { params: limit ? { limit } : undefined },
    );
    return response.data;
  }

  async getStandardsRepositories(): Promise<StandardsRepoType[]> {
    const response = await this.client.get<StandardsRepoType[]>(
      `${this.basePath}/standards-repositories`,
    );
    return response.data;
  }

  async createStandardsRepository(
    data: Partial<StandardsRepoType>,
  ): Promise<StandardsRepoType> {
    const response = await this.client.post<StandardsRepoType>(
      `${this.basePath}/standards-repositories`,
      data,
    );
    return response.data;
  }

  async updateStandardsRepository(
    repoId: string,
    data: Partial<StandardsRepoType>,
  ): Promise<StandardsRepoType> {
    const response = await this.client.patch<StandardsRepoType>(
      `${this.basePath}/standards-repositories/${repoId}`,
      data,
    );
    return response.data;
  }

  async deleteStandardsRepository(repoId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/standards-repositories/${repoId}`);
  }

  async getUsers(): Promise<UserWithRole[]> {
    const response = await this.client.get<UserWithRole[]>(
      `${this.basePath}/users`,
    );
    return response.data;
  }

  async updateUserStatus(
    userId: string,
    status: string,
  ): Promise<void> {
    await this.client.patch(`${this.basePath}/users/${userId}/status`, { status });
  }

  async inviteUser(data: {
    email: string;
    full_name: string;
    role: string;
    skills?: string[];
    availability?: string;
    max_projects?: number;
    office_location?: string;
    reports_to?: string;
  }): Promise<{ message: string; user_id: string }> {
    const response = await this.client.post<{ message: string; user_id: string }>(
      `${this.basePath}/users/invite`,
      data,
    );
    return response.data;
  }

  async resetUserPassword(userId: string): Promise<{ temp_password?: string }> {
    const response = await this.client.post<{ temp_password?: string }>(
      `${this.basePath}/users/${userId}/reset-password`,
    );
    return response.data;
  }

  async getAllUserRoles(): Promise<UserRole[]> {
    const response = await this.client.get<UserRole[]>(
      `${this.basePath}/user-roles`,
    );
    return response.data;
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    const response = await this.client.get<UserRole[]>(
      `${this.basePath}/users/${userId}/roles`,
    );
    return response.data;
  }

  async assignRole(userId: string, role: string): Promise<UserRole> {
    const response = await this.client.post<UserRole>(
      `${this.basePath}/users/${userId}/roles`,
      { role },
    );
    return response.data;
  }

  async removeRole(userId: string, role: string): Promise<void> {
    await this.client.delete(`${this.basePath}/users/${userId}/roles/${role}`);
  }

  async updatePrimaryRole(userId: string, role: string): Promise<void> {
    await this.client.patch(`${this.basePath}/users/${userId}/primary-role`, { role });
  }

  async getOrgSettings(): Promise<OrgSetting[]> {
    const response = await this.client.get<OrgSetting[]>(`${this.basePath}/org`);
    return response.data;
  }

  async updateOrgSetting(
    key: string,
    value: Record<string, unknown>,
  ): Promise<OrgSetting> {
    const response = await this.client.patch<OrgSetting>(
      `${this.basePath}/org/${key}`,
      { value },
    );
    return response.data;
  }
}

export const settingsRepository = new SettingsRepository();
