import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { UserAccount } from './user-account';

interface AccountResponse {
  estAuthentifie: boolean;
  nomAffiche: string;
  email: string;
  creeLeUtc: string;
}

@Injectable({
  providedIn: 'root',
})
export class AccountApi {
  private readonly httpClient = inject(HttpClient);

  private readonly accountUrl = '/api/compte';
  private readonly antiforgeryTokenUrl = '/api/securite/jeton-antifalsification';
  private readonly signOutUrl = '/api/auth/deconnexion';

  getAccount(): Observable<UserAccount> {
    return this.httpClient.get<AccountResponse>(this.accountUrl).pipe(
      map((response) => ({
        displayName: response.nomAffiche,
        email: response.email,
        createdAtUtc: response.creeLeUtc,
      })),
    );
  }

  signOut(): Observable<void> {
    return this.getAntiforgeryToken().pipe(
      switchMap(() => this.httpClient.post<void>(this.signOutUrl, null)),
    );
  }

  deleteAccount(): Observable<void> {
    return this.getAntiforgeryToken().pipe(
      switchMap(() => this.httpClient.delete<void>(this.accountUrl)),
    );
  }

  private getAntiforgeryToken(): Observable<void> {
    return this.httpClient.get<void>(this.antiforgeryTokenUrl);
  }
}
