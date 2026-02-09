import type { AxiosInstance } from "axios";
import type { Notification, NotificationPreference } from "@/lib/types";
import { apiClient } from "../client";

export class NotificationsRepository {
  private readonly client: AxiosInstance;
  private readonly basePath = "/notifications";

  constructor(client: AxiosInstance = apiClient) {
    this.client = client;
  }

  async getAll(): Promise<Notification[]> {
    const response = await this.client.get<Notification[]>(this.basePath);
    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await this.client.get<{ count: number }>(
      `${this.basePath}/unread/count`,
    );
    return response.data.count;
  }

  async markAsRead(notificationIds: string[]): Promise<void> {
    await this.client.post(`${this.basePath}/mark-read`, {
      notification_ids: notificationIds,
    });
  }

  async markAllRead(): Promise<void> {
    await this.client.post(`${this.basePath}/mark-all-read`);
  }

  async getPreferences(): Promise<NotificationPreference> {
    const response = await this.client.get<NotificationPreference>(
      `${this.basePath}/preferences`,
    );
    return response.data;
  }

  async updatePreferences(
    data: Partial<NotificationPreference>,
  ): Promise<NotificationPreference> {
    const response = await this.client.patch<NotificationPreference>(
      `${this.basePath}/preferences`,
      data,
    );
    return response.data;
  }
}

export const notificationsRepository = new NotificationsRepository();
