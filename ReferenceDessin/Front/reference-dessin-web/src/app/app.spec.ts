import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('doit afficher le nom de l’application', async () => {
    const fixture = TestBed.createComponent(App);

    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const nomApplication = element.querySelector(
      '.brand span'
    );

    expect(nomApplication).not.toBeNull();
    expect(nomApplication?.textContent?.trim()).toBe(
      'Référence Dessin'
    );
  });
});
