import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthenticationStore } from '../../account/authentication-store';
import { HomePage } from './home-page';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;

  const authenticationState = signal<unknown>({
    status: 'signedOut',
  });

  const authenticationStore = {
    state: authenticationState,
  };

  beforeEach(async () => {
    sessionStorage.clear();

    authenticationState.set({
      status: 'signedOut',
    });

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        {
          provide: AuthenticationStore,
          useValue: authenticationStore,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);

    fixture.detectChanges();
  });

  it('masque les collections Pinterest lorsque l’utilisateur est déconnecté', () => {
    const collections = fixture.nativeElement.querySelector('app-home-collections');

    expect(collections).toBeNull();
  });

  it('affiche toujours le préparateur de séance lorsque l’utilisateur est déconnecté', () => {
    const session = fixture.nativeElement.querySelector('app-home-session');

    expect(session).not.toBeNull();
  });
});