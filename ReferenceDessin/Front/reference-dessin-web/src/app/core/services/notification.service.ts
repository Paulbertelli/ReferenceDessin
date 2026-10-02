import { Injectable, signal } from '@angular/core';
import { NotificationApplication } from '../models/notification-application.model';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private readonly etatNotification = signal<NotificationApplication | null>(null);
    readonly notification = this.etatNotification.asReadonly();
    
    afficherErreur(message: string): void {
        this.etatNotification.set({
            type: 'erreur',
            message
        });
    }

    afficherSucces(message: string): void {
        this.etatNotification.set({
            type: 'succes',
            message
        });
    }

    afficherInformation(message: string): void {
        this.etatNotification.set({
            type: 'information',
            message
        });
    }

    effacer(): void {
        this.etatNotification.set(null);
    }
}