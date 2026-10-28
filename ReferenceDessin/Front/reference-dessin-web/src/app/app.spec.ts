import { Component, signal } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  provideRouter,
  Router,
  Routes,
} from '@angular/router';
import { App } from './app';
import { AuthenticationState } from './features/account/authentication-state';
import { AuthenticationStore } from './features/account/authentication-store';
import { AppShell } from './layout/app-shell/app-shell';

@Component({
  standalone: true,
  template: '',
})
class EmptyPage {}

const testRoutes: Routes = [
  {
    path: 'login',
    component: EmptyPage,
  },
  {
    path: '',
    component: AppShell,
    children: [
      {
        path: '',
        component: EmptyPage,
      },
    ],
  },
];

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;

  const authenticationState =
    signal<AuthenticationState>({
      status: 'signedIn',
      account: {
        displayName: 'Paul',
        email: 'paul@example.com',
        profileImageUrl: null,
        createdAtUtc: '2026-10-27T12:00:00Z',
      },
    });

  beforeEach(async () => {
    authenticationState.set({
      status: 'signedIn',
      account: {
        displayName: 'Paul',
        email: 'paul@example.com',
        profileImageUrl: null,
        createdAtUtc: '2026-10-27T12:00:00Z',
      },
    });

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(testRoutes),
        {
          provide: AuthenticationStore,
          useValue: {
            state: authenticationState,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    router = TestBed.inject(Router);

    fixture.detectChanges();
  });

  it('crée l’application', () => {
    expect(
      fixture.componentInstance,
    ).toBeTruthy();
  });

  it(
    'affiche la navigation dans le shell principal',
    async () => {
      await router.navigateByUrl('/');

      fixture.detectChanges();

      const navigation =
        fixture.nativeElement.querySelector(
          'app-main-navigation',
        );

      expect(navigation).not.toBeNull();
    },
  );

  it(
    'n’affiche pas la navigation sur la page de connexion',
    async () => {
      await router.navigateByUrl('/login');

      fixture.detectChanges();

      const navigation =
        fixture.nativeElement.querySelector(
          'app-main-navigation',
        );

      expect(navigation).toBeNull();
    },
  );
});
