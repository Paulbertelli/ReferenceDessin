import { Injectable, signal } from '@angular/core';
import { NotificationMessage } from './notification-message';

@Injectable({
  providedIn: 'root',
})
export class NotificationStore {
  private readonly currentNotification = signal<NotificationMessage | null>(null);

  readonly notification = this.currentNotification.asReadonly();

  showError(message: string): void {
    this.currentNotification.set({
      type: 'error',
      message,
    });
  }

  showSuccess(message: string): void {
    this.currentNotification.set({
      type: 'success',
      message,
    });
  }

  showInformation(message: string): void {
    this.currentNotification.set({
      type: 'info',
      message,
    });
  }

  clear(): void {
    this.currentNotification.set(null);
  }
}
