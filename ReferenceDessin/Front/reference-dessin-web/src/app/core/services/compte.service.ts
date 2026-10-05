import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CompteUtilisateur } from '../models/compte-utilisateur.model';
import { Observable, switchMap } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class CompteService {
    private readonly httpClient = inject(HttpClient);
    private readonly apiCompteUrl = '/api/compte';
    private readonly apiJetonUrl = '/api/securite/jeton-antifalsification';
    private readonly apiDeconnexionUrl = '/api/auth/deconnexion';


    getCompte(): Observable<CompteUtilisateur> {
        return this.httpClient.get<CompteUtilisateur>(
            this.apiCompteUrl
        );
    }

    deconnecter(): Observable<void> {
        return this.httpClient
        .get<void>(this.apiJetonUrl)
        .pipe(
            switchMap(() =>
                this.httpClient.post<void>(
                    this.apiDeconnexionUrl,
                    null
                )
            )
        );
    }

    supprimerCompte(): Observable<void> {
        return this.httpClient
            .get<void>(this.apiJetonUrl)
            .pipe(
                switchMap(() =>
                    this.httpClient.delete<void>(this.apiCompteUrl)
                )
            );
    }
}