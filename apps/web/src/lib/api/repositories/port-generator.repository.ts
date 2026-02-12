import type { LovableManifest, GenerateTasksResponse } from "@/lib/types/port-generator";
import { BaseRepository } from "./base.repository";

export class PortGeneratorRepository extends BaseRepository<never> {
  protected readonly basePath = "/port-generator";

  async extract(sourcePath: string): Promise<LovableManifest> {
    const response = await this.client.post<LovableManifest>(
      `${this.basePath}/extract`,
      { source_path: sourcePath }
    );
    return response.data;
  }

  async generateTasks(
    productId: string,
    sourcePath?: string
  ): Promise<GenerateTasksResponse> {
    const response = await this.client.post<GenerateTasksResponse>(
      `${this.basePath}/${productId}/generate`,
      sourcePath ? { source_path: sourcePath } : {}
    );
    return response.data;
  }
}

export const portGeneratorRepository = new PortGeneratorRepository();
