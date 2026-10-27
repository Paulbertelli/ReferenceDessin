import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    router = TestBed.inject(Router);

    fixture.detectChanges();
  });

  it('crée l’application', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('affiche la navigation dans le shell principal', async () => {
    await router.navigateByUrl('/');
    await fixture.whenStable();
    fixture.detectChanges();

    const navigation = fixture.nativeElement.querySelector('app-main-navigation');

    expect(navigation).not.toBeNull();
  });

  it('n’affiche pas la navigation sur la page de connexion', async () => {
    await router.navigateByUrl('/login');
    await fixture.whenStable();
    fixture.detectChanges();

    const navigation = fixture.nativeElement.querySelector('app-main-navigation');

    expect(navigation).toBeNull();
  });
});
