import type {
  Product,
  ProductMember,
  ProductEnvironment,
  DeploymentChecklistItem,
  Stakeholder,
  TeamReadiness,
} from "@/lib/types";
import { BaseRepository, type QueryParams } from "./base.repository";

export class ProductsRepository extends BaseRepository<Product> {
  protected readonly basePath = "/products";

  async getByStatus(status: string, params?: QueryParams) {
    return this.getAll({ ...params, status });
  }

  async getAllMembers(): Promise<ProductMember[]> {
    const response = await this.client.get<ProductMember[]>(
      `${this.basePath}/all-members`,
    );
    return response.data;
  }

  async getMembers(productId: string): Promise<ProductMember[]> {
    const response = await this.client.get<ProductMember[]>(
      `${this.basePath}/${productId}/members`,
    );
    return response.data;
  }

  async addMember(productId: string, data: { profile_id: string; role?: string }): Promise<ProductMember> {
    const response = await this.client.post<ProductMember>(
      `${this.basePath}/${productId}/members`,
      data,
    );
    return response.data;
  }

  async removeMember(productId: string, memberId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${productId}/members/${memberId}`);
  }

  async getTeamReadiness(productId: string): Promise<TeamReadiness> {
    const response = await this.client.get<TeamReadiness>(
      `${this.basePath}/${productId}/team-readiness`,
    );
    return response.data;
  }

  async getEnvironments(productId: string): Promise<ProductEnvironment[]> {
    const response = await this.client.get<ProductEnvironment[]>(
      `${this.basePath}/${productId}/environments`,
    );
    return response.data;
  }

  async updateHealth(productId: string, healthScore: number): Promise<Product> {
    const response = await this.client.patch<Product>(
      `${this.basePath}/${productId}`,
      { health_score: healthScore },
    );
    return response.data;
  }

  async updateProgress(productId: string, progress: number): Promise<Product> {
    const response = await this.client.patch<Product>(
      `${this.basePath}/${productId}`,
      { progress },
    );
    return response.data;
  }

  async upsertEnvironment(
    data: Partial<ProductEnvironment> & { product_id: string; environment_type: string },
  ): Promise<ProductEnvironment> {
    const response = await this.client.put<ProductEnvironment>(
      `${this.basePath}/${data.product_id}/environments`,
      data,
    );
    return response.data;
  }

  async deleteEnvironment(productId: string, envType: string): Promise<void> {
    await this.client.delete(
      `${this.basePath}/${productId}/environments/${envType}`,
    );
  }

  async getChecklist(productId: string): Promise<DeploymentChecklistItem[]> {
    const response = await this.client.get<DeploymentChecklistItem[]>(
      `${this.basePath}/${productId}/deployment-checklist`,
    );
    return response.data;
  }

  async seedChecklist(productId: string): Promise<void> {
    await this.client.post(
      `${this.basePath}/${productId}/deployment-checklist/seed`,
    );
  }

  async toggleChecklistItem(
    itemId: string,
    isChecked: boolean,
  ): Promise<DeploymentChecklistItem> {
    const response = await this.client.patch<DeploymentChecklistItem>(
      `/deployment-checklist/${itemId}`,
      { is_checked: isChecked },
    );
    return response.data;
  }

  async updateChecklistNotes(
    itemId: string,
    notes: string,
  ): Promise<DeploymentChecklistItem> {
    const response = await this.client.patch<DeploymentChecklistItem>(
      `/deployment-checklist/${itemId}`,
      { notes },
    );
    return response.data;
  }

  async getStakeholders(productId: string): Promise<Stakeholder[]> {
    const response = await this.client.get<Stakeholder[]>(
      `${this.basePath}/${productId}/stakeholders`,
    );
    return response.data;
  }

  async createStakeholder(data: Partial<Stakeholder>): Promise<Stakeholder> {
    const response = await this.client.post<Stakeholder>(
      `${this.basePath}/${data.product_id}/stakeholders`,
      data,
    );
    return response.data;
  }

  async updateStakeholder(
    stakeholderId: string,
    data: Partial<Stakeholder>,
  ): Promise<Stakeholder> {
    const response = await this.client.patch<Stakeholder>(
      `/stakeholders/${stakeholderId}`,
      data,
    );
    return response.data;
  }

  async deleteStakeholder(stakeholderId: string): Promise<void> {
    await this.client.delete(`/stakeholders/${stakeholderId}`);
  }

  async getProjectIntegrations(productId: string): Promise<import("@/lib/types").ProjectIntegration[]> {
    const response = await this.client.get<import("@/lib/types").ProjectIntegration[]>(
      `${this.basePath}/${productId}/integrations`,
    );
    return response.data;
  }

  async createProjectIntegration(
    data: Partial<import("@/lib/types").ProjectIntegration>,
  ): Promise<import("@/lib/types").ProjectIntegration> {
    const response = await this.client.post<import("@/lib/types").ProjectIntegration>(
      `${this.basePath}/${data.product_id}/integrations`,
      data,
    );
    return response.data;
  }

  async updateProjectIntegration(
    integrationId: string,
    data: Partial<import("@/lib/types").ProjectIntegration>,
  ): Promise<import("@/lib/types").ProjectIntegration> {
    const response = await this.client.patch<import("@/lib/types").ProjectIntegration>(
      `/project-integrations/${integrationId}`,
      data,
    );
    return response.data;
  }

  async deleteProjectIntegration(integrationId: string): Promise<void> {
    await this.client.delete(`/project-integrations/${integrationId}`);
  }

  // Management Notes
  async getManagementNotes(productId: string): Promise<unknown[]> {
    const response = await this.client.get(
      `${this.basePath}/${productId}/management-notes`,
    );
    return response.data;
  }

  async createManagementNote(data: {
    product_id: string;
    author_id: string;
    content: string;
  }): Promise<unknown> {
    const response = await this.client.post(
      `${this.basePath}/${data.product_id}/management-notes`,
      data,
    );
    return response.data;
  }

  async deleteManagementNote(noteId: string): Promise<void> {
    await this.client.delete(`/products/management-notes/${noteId}`);
  }

  async toggleManagementNotePin(noteId: string): Promise<unknown> {
    const response = await this.client.patch(
      `/products/management-notes/${noteId}/pin`,
    );
    return response.data;
  }

  // Partner Notes
  async getPartnerNotes(productId: string): Promise<unknown[]> {
    const response = await this.client.get(
      `${this.basePath}/${productId}/partner-notes`,
    );
    return response.data;
  }

  async createPartnerNote(data: {
    product_id: string;
    author_id: string;
    partner_name: string;
    content: string;
  }): Promise<unknown> {
    const response = await this.client.post(
      `${this.basePath}/${data.product_id}/partner-notes`,
      data,
    );
    return response.data;
  }

  async deletePartnerNote(noteId: string): Promise<void> {
    await this.client.delete(`/products/partner-notes/${noteId}`);
  }

  async archive(productId: string): Promise<Product> {
    const response = await this.client.post<Product>(
      `${this.basePath}/${productId}/archive`,
    );
    return response.data;
  }

  async unarchive(productId: string): Promise<Product> {
    const response = await this.client.post<Product>(
      `${this.basePath}/${productId}/unarchive`,
    );
    return response.data;
  }
}

export const productsRepository = new ProductsRepository();
