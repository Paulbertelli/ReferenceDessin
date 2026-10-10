import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AccountApi } from './account-api';
import { UserAccount } from './user-account';

describe('AccountApi', () => {
  let accountApi: AccountApi;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AccountApi, provideHttpClient(), provideHttpClientTesting()],
    });

    accountApi = TestBed.inject(AccountApi);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('maps the account response', () => {
    let receivedAccount: UserAccount | undefined;

    accountApi.getAccount().subscribe((account) => {
      receivedAccount = account;
    });

    const request = httpController.expectOne('/api/compte');

    expect(request.request.method).toBe('GET');

    request.flush({
      estAuthentifie: true,
      nomAffiche: 'Paul',
      email: 'paul@example.com',
      creeLeUtc: '2026-10-09T20:00:00Z',
    });

    expect(receivedAccount).toEqual({
      displayName: 'Paul',
      email: 'paul@example.com',
      createdAtUtc: '2026-10-09T20:00:00Z',
    });
  });

  it('gets an antiforgery token before signing out', () => {
    let signOutCompleted = false;

    accountApi.signOut().subscribe(() => {
      signOutCompleted = true;
    });

    const tokenRequest = httpController.expectOne('/api/securite/jeton-antifalsification');

    expect(tokenRequest.request.method).toBe('GET');

    httpController.expectNone('/api/auth/deconnexion');

    tokenRequest.flush(null);

    const signOutRequest = httpController.expectOne('/api/auth/deconnexion');

    expect(signOutRequest.request.method).toBe('POST');
    expect(signOutRequest.request.body).toBeNull();
    expect(signOutCompleted).toBe(false);

    signOutRequest.flush(null);

    expect(signOutCompleted).toBe(true);
  });

  it('gets an antiforgery token before deleting the account', () => {
    let deletionCompleted = false;

    accountApi.deleteAccount().subscribe(() => {
      deletionCompleted = true;
    });

    const tokenRequest = httpController.expectOne('/api/securite/jeton-antifalsification');

    expect(tokenRequest.request.method).toBe('GET');

    httpController.expectNone('/api/compte');

    tokenRequest.flush(null);

    const deletionRequest = httpController.expectOne('/api/compte');

    expect(deletionRequest.request.method).toBe('DELETE');
    expect(deletionCompleted).toBe(false);

    deletionRequest.flush(null);

    expect(deletionCompleted).toBe(true);
  });
});
