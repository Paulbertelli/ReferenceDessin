import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotificationStore } from '../../shared/notification/notification-store';
import { AccountApi } from './account-api';
import { AuthenticationStore } from './authentication-store';
import { UserAccount } from './user-account';

describe('AuthenticationStore', () => {
  let store: AuthenticationStore;
  let accountApi: StubAccountApi;
  let notificationStore: StubNotificationStore;

  const account: UserAccount = {
    displayName: 'Paul',
    email: 'paul@example.com',
    createdAtUtc: '2026-10-09T20:00:00Z',
  };

  beforeEach(() => {
    accountApi = new StubAccountApi();
    notificationStore = new StubNotificationStore();

    TestBed.configureTestingModule({
      providers: [
        AuthenticationStore,
        {
          provide: AccountApi,
          useValue: accountApi,
        },
        {
          provide: NotificationStore,
          useValue: notificationStore,
        },
      ],
    });

    store = TestBed.inject(AuthenticationStore);
  });

  it('starts in the loading state', () => {
    expect(store.state()).toEqual({
      status: 'loading',
    });
  });

  it('stores the authenticated account', () => {
    store.loadAccount();

    accountApi.accountResponse.next(account);

    expect(store.state()).toEqual({
      status: 'signedIn',
      account,
    });
  });

  it('sets the signed-out state when loading returns 401', () => {
    store.loadAccount();

    accountApi.accountResponse.error(createHttpError(401));

    expect(store.state()).toEqual({
      status: 'signedOut',
    });

    expect(notificationStore.errors).toEqual([]);
  });

  it('reports an inaccessible server while loading', () => {
    store.loadAccount();

    accountApi.accountResponse.error(createHttpError(0));

    expect(store.state()).toEqual({
      status: 'error',
    });

    expect(notificationStore.errors).toEqual(['Le serveur est actuellement inaccessible.']);
  });

  it('signs out an authenticated account', () => {
    authenticate();

    store.signOut();

    expect(store.state()).toEqual({
      status: 'signingOut',
    });

    accountApi.signOutResponse.next();
    accountApi.signOutResponse.complete();

    expect(store.state()).toEqual({
      status: 'signedOut',
    });

    expect(notificationStore.successes).toEqual(['Vous êtes maintenant déconnecté.']);
  });

  it('restores the account when signing out fails', () => {
    authenticate();

    store.signOut();

    accountApi.signOutResponse.error(createHttpError(500));

    expect(store.state()).toEqual({
      status: 'signedIn',
      account,
    });

    expect(notificationStore.errors).toEqual(['Impossible de vous déconnecter.']);
  });

  it('deletes an authenticated account', () => {
    authenticate();

    store.deleteAccount();

    expect(store.state()).toEqual({
      status: 'deleting',
    });

    accountApi.deleteResponse.next();
    accountApi.deleteResponse.complete();

    expect(store.state()).toEqual({
      status: 'signedOut',
    });

    expect(notificationStore.successes).toEqual(['Votre compte et ses données ont été supprimés.']);
  });

  it('restores the account when deletion fails', () => {
    authenticate();

    store.deleteAccount();

    accountApi.deleteResponse.error(createHttpError(500));

    expect(store.state()).toEqual({
      status: 'signedIn',
      account,
    });

    expect(notificationStore.errors).toEqual(['Impossible de supprimer votre compte.']);
  });

  it('ignores sign-out and deletion while signed out', () => {
    store.loadAccount();

    accountApi.accountResponse.error(createHttpError(401));

    store.signOut();
    store.deleteAccount();

    expect(accountApi.signOutCallCount).toBe(0);
    expect(accountApi.deleteCallCount).toBe(0);
  });

  function authenticate(): void {
    store.loadAccount();
    accountApi.accountResponse.next(account);
  }
});

function createHttpError(status: number): HttpErrorResponse {
  return new HttpErrorResponse({
    status,
  });
}

class StubAccountApi {
  readonly accountResponse = new Subject<UserAccount>();

  readonly signOutResponse = new Subject<void>();

  readonly deleteResponse = new Subject<void>();

  signOutCallCount = 0;
  deleteCallCount = 0;

  getAccount(): Observable<UserAccount> {
    return this.accountResponse.asObservable();
  }

  signOut(): Observable<void> {
    this.signOutCallCount++;

    return this.signOutResponse.asObservable();
  }

  deleteAccount(): Observable<void> {
    this.deleteCallCount++;

    return this.deleteResponse.asObservable();
  }
}

class StubNotificationStore {
  readonly errors: string[] = [];
  readonly successes: string[] = [];

  showError(message: string): void {
    this.errors.push(message);
  }

  showSuccess(message: string): void {
    this.successes.push(message);
  }
}