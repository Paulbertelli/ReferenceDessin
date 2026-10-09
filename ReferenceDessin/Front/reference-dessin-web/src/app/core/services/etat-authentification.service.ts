import { inject, Injectable, signal } from '@angular/core';
import { CompteService } from './compte.service';
import { EtatAuthentification } from '../models/etat-authentification.model';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationStore } from '../../shared/notification/notification-store';

@Injectable({
  providedIn: 'root',
})
export class EtatAuthentificationService {
  private readonly compteService = inject(CompteService);
  private readonly notificationStore = inject(NotificationStore);

  private readonly etatAuthentification = signal<EtatAuthentification>({
    statut: 'chargement',
  });
  readonly etat = this.etatAuthentification.asReadonly();

  chargerCompte(): void {
    this.etatAuthentification.set({
      statut: 'chargement',
    });
    this.compteService.getCompte().subscribe({
      next: (compte) => {
        this.etatAuthentification.set({
          statut: 'connecte',
          compte,
        });
      },
      error: (erreur: HttpErrorResponse) => {
        if (erreur.status === 401) {
          this.etatAuthentification.set({
            statut: 'deconnecte',
          });

          return;
        }

        this.etatAuthentification.set({
          statut: 'erreur',
        });

        if (erreur.status === 0) {
          this.notificationStore.showError('Le serveur est actuellement inaccessible.');

          return;
        }

        this.notificationStore.showError('Impossible de vérifier votre connexion.');
      },
    });
  }

  deconnecter(): void {
    const etatAvantDeconnexion = this.etatAuthentification();

    if (etatAvantDeconnexion.statut !== 'connecte') {
      return;
    }

    this.etatAuthentification.set({
      statut: 'deconnexion',
    });

    this.compteService.deconnecter().subscribe({
      next: () => {
        this.etatAuthentification.set({ statut: 'deconnecte' });

        this.notificationStore.showSuccess('Vous êtes maintenant déconnecté.');
      },
      error: (erreur: HttpErrorResponse) => {
        if (erreur.status === 401) {
          this.etatAuthentification.set({ statut: 'deconnecte' });

          return;
        }

        this.etatAuthentification.set(etatAvantDeconnexion);

        if (erreur.status === 0) {
          this.notificationStore.showError('Le serveur est actuellement inaccessible.');

          return;
        }

        this.notificationStore.showError('Impossible de vous déconnecter.');
      },
    });
  }

  supprimerCompte(): void {
    const etatAvantSuppression = this.etatAuthentification();

    if (etatAvantSuppression.statut !== 'connecte') {
      return;
    }

    this.etatAuthentification.set({
      statut: 'suppression',
    });

    this.compteService.supprimerCompte().subscribe({
      next: () => {
        this.etatAuthentification.set({
          statut: 'deconnecte',
        });

        this.notificationStore.showSuccess('Votre compte et ses données ont été supprimés.');
      },

      error: (erreur: HttpErrorResponse) => {
        if (erreur.status === 401) {
          this.etatAuthentification.set({
            statut: 'deconnecte',
          });

          return;
        }

        this.etatAuthentification.set(etatAvantSuppression);

        if (erreur.status === 0) {
          this.notificationStore.showError('Le serveur est actuellement inaccessible.');

          return;
        }

        this.notificationStore.showError('Impossible de supprimer votre compte.');
      },
    });
  }
}