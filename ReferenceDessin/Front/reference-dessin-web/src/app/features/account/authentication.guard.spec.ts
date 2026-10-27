import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthenticationState } from './authentication-state';
import { authenticationGuard } from './authentication.guard';
import { AuthenticationStore } from './authentication-store';

describe('authenticationGuard', () => {
  let authenticationState: ReturnType<typeof signal<AuthenticationState>>;

  let router: Router;

  beforeEach(() => {
    authenticationState = signal<AuthenticationState>({
      status: 'loading',
    });

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthenticationStore,
          useValue: {
            state: authenticationState,
          },
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('autorise un utilisateur connecté', async () => {
    authenticationState.set({
      status: 'signedIn',
      account: {
        displayName: 'Paul',
        email: 'paul@example.com',
        createdAtUtc: '2026-10-27T12:00:00Z',
      },
    });

    const result = await executeGuard();

    expect(result).toBe(true);
  });

  it('redirige un utilisateur déconnecté vers la connexion', async () => {
    authenticationState.set({
      status: 'signedOut',
    });

    const result = await executeGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('attend la fin du chargement de l’authentification', async () => {
    const guardResult = executeGuard();

    authenticationState.set({
      status: 'signedIn',
      account: {
        displayName: 'Paul',
        email: 'paul@example.com',
        createdAtUtc: '2026-10-27T12:00:00Z',
      },
    });

    expect(await guardResult).toBe(true);
  });

  function executeGuard(): Promise<boolean | UrlTree> {
    const result = TestBed.runInInjectionContext(() =>
      authenticationGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    return firstValueFrom(result as Observable<boolean | UrlTree>);
  }
});