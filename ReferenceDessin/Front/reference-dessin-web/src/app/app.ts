import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideSearch } from '@lucide/angular';
import { DrawingSession } from './features/drawing-session/drawing-session';
import { AuthenticationStore } from './features/account/authentication-store';
import { DrawingSessionStore } from './features/drawing-session/drawing-session-store';
import { NotificationBanner } from './shared/notification/notification-banner';
import { AccountDeletionConfirmation } from './features/account/account-deletion-confirmation/account-deletion-confirmation';

@Component({
  imports: [
    FormsModule,
    NotificationBanner,
    LucideSearch,
    AccountDeletionConfirmation,
    DrawingSession,
  ],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly authenticationStore = inject(AuthenticationStore);
  protected readonly drawingSessionStore = inject(DrawingSessionStore);
  protected readonly accountDeletionConfirmationOpen = signal(false);

  protected searchQuery = '';

  constructor() {
    this.authenticationStore.loadAccount();
    this.drawingSessionStore.search();
  }

  protected search(): void {
    this.drawingSessionStore.search(this.searchQuery);
  }

  protected openAccountDeletionConfirmation(): void {
    this.accountDeletionConfirmationOpen.set(true);
  }

  protected cancelAccountDeletion(): void {
    this.accountDeletionConfirmationOpen.set(false);
  }

  protected confirmAccountDeletion(): void {
    this.accountDeletionConfirmationOpen.set(false);
    this.authenticationStore.deleteAccount();
  }
}