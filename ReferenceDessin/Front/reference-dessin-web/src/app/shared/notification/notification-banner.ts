import { Component, inject } from '@angular/core';
import { NotificationStore } from './notification-store';

@Component({
  selector: 'app-notification-banner',
  templateUrl: './notification-banner.html',
  styleUrl: './notification-banner.scss',
})
export class NotificationBanner {
  protected readonly notificationStore = inject(NotificationStore);

  protected clear(): void {
    this.notificationStore.clear();
  }
}
