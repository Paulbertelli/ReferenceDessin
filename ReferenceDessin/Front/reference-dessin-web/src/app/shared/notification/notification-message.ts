export interface NotificationMessage {
  type: NotificationType;
  message: string;
}

export type NotificationType = 'info' | 'error' | 'success';
