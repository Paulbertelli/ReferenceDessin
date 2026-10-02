import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-notification',
    templateUrl: './notification.html',
    styleUrl: './notification.scss',
    standalone: true
})
export class NotificationComposant {
    protected readonly notificationService = inject(NotificationService);

    protected effacer(): void {
        this.notificationService.effacer();
    }
}