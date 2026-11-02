import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthenticationStore } from '../../features/account/authentication-store';
import { MainNavigation } from './main-navigation';

@Component({
  standalone: true,
  template: '',
})
class EmptyPage {}

describe('MainNavigation', () => {
  let fixture: ComponentFixture<MainNavigation>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainNavigation],
      providers: [
        provideRouter([
          {
            path: '',
            component: EmptyPage,
          },
          {
            path: 'search',
            component: EmptyPage,
          },
          {
            path: 'collections',
            component: EmptyPage,
          },
        ]),
        {
          provide: AuthenticationStore,
          useValue: {
            state: signal({
              status: 'signedOut',
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainNavigation);

    router = TestBed.inject(Router);

    await router.navigateByUrl('/');

    fixture.detectChanges();
  });

  it('navigue vers la recherche avec le terme saisi', async () => {
    const input = fixture.nativeElement.querySelector('#global-search-input') as HTMLInputElement;

    const form = fixture.nativeElement.querySelector('.global-search') as HTMLFormElement;

    input.value = 'portrait';
    input.dispatchEvent(new Event('input'));

    fixture.detectChanges();
    await fixture.whenStable();

    form.dispatchEvent(
      new Event('submit', {
        bubbles: true,
        cancelable: true,
      }),
    );

    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/search?q=portrait');
  });

  it('restaure le terme présent dans l’URL', async () => {
    await router.navigateByUrl('/search?q=portrait');

    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('#global-search-input') as HTMLInputElement;

    expect(input.value).toBe('portrait');
  });

  it('vide le champ sur une URL sans recherche', async () => {
    await router.navigateByUrl('/search?q=portrait');

    await fixture.whenStable();
    fixture.detectChanges();

    await router.navigateByUrl('/collections');

    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('#global-search-input') as HTMLInputElement;

    expect(input.value).toBe('');
  });
});
