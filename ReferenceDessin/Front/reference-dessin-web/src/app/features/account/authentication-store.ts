import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { NotificationStore } from '../../shared/notification/notification-store';
import { AccountApi } from './account-api';
import { AuthenticationState } from './authentication-state';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationStore {
  private readonly accountApi = inject(AccountApi);
  private readonly notificationStore = inject(NotificationStore);

  private readonly authenticationState = signal<AuthenticationState>({
    status: 'loading',
  });

  readonly state = this.authenticationState.asReadonly();

  loadAccount(): void {
    this.authenticationState.set({
      status: 'loading',
    });

    this.accountApi.getAccount().subscribe({
      next: (account) => {
        this.authenticationState.set({
          status: 'signedIn',
          account,
        });
      },
      error: (error) => {
        this.handleAccountLoadingError(error);
      },
    });
  }

  signOut(): void {
    const previousState = this.authenticationState();

    if (previousState.status !== 'signedIn') {
      return;
    }

    this.authenticationState.set({
      status: 'signingOut',
    });

    this.accountApi.signOut().subscribe({
      next: () => {
        this.authenticationState.set({
          status: 'signedOut',
        });

        this.notificationStore.showSuccess('Vous êtes maintenant déconnecté.');
      },
      error: (error) => {
        if (this.handleUnauthorized(error)) {
          return;
        }

        this.authenticationState.set(previousState);
        this.showRequestError(error, 'Impossible de vous déconnecter.');
      },
    });
  }

  deleteAccount(): void {
    const previousState = this.authenticationState();

    if (previousState.status !== 'signedIn') {
      return;
    }

    this.authenticationState.set({
      status: 'deleting',
    });

    this.accountApi.deleteAccount().subscribe({
      next: () => {
        this.authenticationState.set({
          status: 'signedOut',
        });

        this.notificationStore.showSuccess('Votre compte et ses données ont été supprimés.');
      },
      error: (error) => {
        if (this.handleUnauthorized(error)) {
          return;
        }

        this.authenticationState.set(previousState);
        this.showRequestError(error, 'Impossible de supprimer votre compte.');
      },
    });
  }

  private handleAccountLoadingError(error: HttpErrorResponse): void {
    if (error.status === 401) {
      this.authenticationState.set({
        status: 'signedOut',
      });

      return;
    }

    this.authenticationState.set({
      status: 'error',
    });

    this.showRequestError(error, 'Impossible de vérifier votre connexion.');
  }

  private handleUnauthorized(error: HttpErrorResponse): boolean {
    if (error.status !== 401) {
      return false;
    }

    this.authenticationState.set({
      status: 'signedOut',
    });

    return true;
  }

  private showRequestError(error: HttpErrorResponse, fallbackMessage: string): void {
    this.notificationStore.showError(
      error.status === 0 ? 'Le serveur est actuellement inaccessible.' : fallbackMessage,
    );
  }
}
