import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { SessionOverlay } from './session-overlay';

describe('SessionOverlay', () => {
  let fixture: ComponentFixture<SessionOverlay>;
  let component: SessionOverlay;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionOverlay],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionOverlay);
    component = fixture.componentInstance;

    configureRequiredInputs();
  });

  it('crée l’overlay avec les informations de la séance', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    const displayedImage = element.querySelector<HTMLImageElement>('.overlay-content img');

    const counter = element.querySelector('.overlay-image-counter');

    expect(component).toBeTruthy();
    expect(displayedImage?.src).toContain('current.jpg');

    expect(counter?.textContent?.replace(/\s+/g, ' ').trim()).toBe('2 / 5');
  });

  it('demande la fermeture de l’overlay', () => {
    let requested = false;

    component.closeRequested.subscribe(() => {
      requested = true;
    });

    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.overlay-close') as HTMLButtonElement;

    button.click();

    expect(requested).toBe(true);
  });

  it('affiche l’image précédente et demande son ouverture', () => {
    fixture.componentRef.setInput('previousImage', createImage('previous', 'previous.jpg'));

    let requested = false;

    component.previousRequested.subscribe(() => {
      requested = true;
    });

    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '.overlay-navigation--previous',
    ) as HTMLButtonElement;

    const image = button.querySelector('img');

    expect(image?.getAttribute('src')).toContain('previous.jpg');

    button.click();

    expect(requested).toBe(true);
  });

  it('affiche l’image suivante et demande son ouverture', () => {
    fixture.componentRef.setInput('nextImage', createImage('next', 'next.jpg'));

    let requested = false;

    component.nextRequested.subscribe(() => {
      requested = true;
    });

    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '.overlay-navigation--next',
    ) as HTMLButtonElement;

    const image = button.querySelector('img');

    expect(image?.getAttribute('src')).toContain('next.jpg');

    button.click();

    expect(requested).toBe(true);
  });

  it('désactive la navigation sans image adjacente', () => {
    fixture.detectChanges();

    const previousButton = fixture.nativeElement.querySelector(
      '.overlay-navigation--previous',
    ) as HTMLButtonElement;

    const nextButton = fixture.nativeElement.querySelector(
      '.overlay-navigation--next',
    ) as HTMLButtonElement;

    expect(previousButton.disabled).toBe(true);
    expect(nextButton.disabled).toBe(true);
  });

  function configureRequiredInputs(): void {
    fixture.componentRef.setInput('image', createImage('current', 'current.jpg'));

    fixture.componentRef.setInput('currentIndex', 1);
    fixture.componentRef.setInput('totalImages', 5);

    fixture.componentRef.setInput('running', false);
    fixture.componentRef.setInput('formattedTime', '02:00');
    fixture.componentRef.setInput('progress', 100);
    fixture.componentRef.setInput('durationMinutes', 2);
  }
});

function createImage(externalId: string, filename: string): ReferenceImage {
  return {
    externalId,
    imageUrl: `https://images.example/${filename}`,
    sourceName: 'Pinterest',
    originalUrl: `https://www.pinterest.com/pin/${externalId}/`,
    authorName: null,
    authorUrl: null,
    description: 'Référence de dessin',
    averageColor: null,
  };
}