import type { AxiosInstance } from "axios";
import type {
  Profile,
  TeamHoliday,
  NationalHoliday,
  ProfileProject,
  TaskCount,
} from "@/lib/types";
import { apiClient } from "../client";
import type { PaginatedResponse, QueryParams } from "./base.repository";

export class TeamRepository {
  private readonly client: AxiosInstance;
  private readonly basePath = "/team";

  constructor(client: AxiosInstance = apiClient) {
    this.client = client;
  }

  async getProfiles(params?: QueryParams): Promise<PaginatedResponse<Profile>> {
    const response = await this.client.get<PaginatedResponse<Profile>>(
      `${this.basePath}/profiles`,
      { params },
    );
    return response.data;
  }

  async getProfile(profileId: string): Promise<Profile> {
    const response = await this.client.get<Profile>(
      `${this.basePath}/profiles/${profileId}`,
    );
    return response.data;
  }

  async updateProfile(profileId: string, data: Partial<Profile>): Promise<Profile> {
    const response = await this.client.patch<Profile>(
      `${this.basePath}/profiles/${profileId}`,
      data,
    );
    return response.data;
  }

  async getProfileProjects(profileId: string): Promise<ProfileProject[]> {
    const response = await this.client.get<ProfileProject[]>(
      `${this.basePath}/profiles/${profileId}/projects`,
    );
    return response.data;
  }

  async getProfileTaskCounts(profileIds: string[]): Promise<Record<string, TaskCount>> {
    const response = await this.client.post<Record<string, TaskCount>>(
      `${this.basePath}/profiles/task-counts`,
      { profile_ids: profileIds },
    );
    return response.data;
  }

  async getHolidays(profileId?: string): Promise<TeamHoliday[]> {
    const response = await this.client.get<TeamHoliday[]>(
      `${this.basePath}/holidays`,
      { params: profileId ? { profile_id: profileId } : undefined },
    );
    return response.data;
  }

  async createHoliday(data: Partial<TeamHoliday>): Promise<TeamHoliday> {
    const response = await this.client.post<TeamHoliday>(
      `${this.basePath}/holidays`,
      data,
    );
    return response.data;
  }

  async updateHoliday(
    holidayId: string,
    data: Partial<TeamHoliday>,
  ): Promise<TeamHoliday> {
    const response = await this.client.patch<TeamHoliday>(
      `${this.basePath}/holidays/${holidayId}`,
      data,
    );
    return response.data;
  }

  async deleteHoliday(holidayId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/holidays/${holidayId}`);
  }

  async getNationalHolidays(location?: string): Promise<NationalHoliday[]> {
    const response = await this.client.get<NationalHoliday[]>(
      `${this.basePath}/holidays/national`,
      { params: location ? { location } : undefined },
    );
    return response.data;
  }

  async assignToProject(profileId: string, productId: string): Promise<Profile> {
    const response = await this.client.post<Profile>(
      `${this.basePath}/profiles/${profileId}/assign`,
      { product_id: productId },
    );
    return response.data;
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const response = await this.client.get<string[]>(
      `${this.basePath}/users/${userId}/roles`,
    );
    return response.data;
  }

  async createNationalHoliday(data: {
    name: string;
    date: string;
    location: string;
    recurring: boolean;
  }): Promise<NationalHoliday> {
    const response = await this.client.post<NationalHoliday>(
      `${this.basePath}/holidays/national`,
      data,
    );
    return response.data;
  }

  async updateNationalHoliday(
    id: string,
    data: Partial<NationalHoliday>,
  ): Promise<NationalHoliday> {
    const response = await this.client.patch<NationalHoliday>(
      `${this.basePath}/holidays/national/${id}`,
      data,
    );
    return response.data;
  }

  async deleteNationalHoliday(id: string): Promise<void> {
    await this.client.delete(`${this.basePath}/holidays/national/${id}`);
  }

  async uploadAvatar(profileId: string, file: File): Promise<Profile> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await this.client.postForm<Profile>(
      `${this.basePath}/profiles/${profileId}/avatar`,
      formData,
    );
    return response.data;
  }

  async deleteAvatar(profileId: string): Promise<Profile> {
    const response = await this.client.delete<Profile>(
      `${this.basePath}/profiles/${profileId}/avatar`,
    );
    return response.data;
  }
}

export const teamRepository = new TeamRepository();
