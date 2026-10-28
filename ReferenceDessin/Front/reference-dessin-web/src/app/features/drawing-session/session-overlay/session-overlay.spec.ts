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

    expect(component).toBeTruthy();

    expect(displayedImage?.src).toContain('current.jpg');

    expect(
      element.querySelector('.overlay-image-counter')?.textContent?.replace(/\s+/g, ' ').trim(),
    ).toBe('2 / 5');
  });

  it('demande la fermeture de l’overlay', () => {
    let closeRequested = false;

    component.closeRequested.subscribe(() => {
      closeRequested = true;
    });

    fixture.detectChanges();

    const closeButton = fixture.nativeElement.querySelector('.overlay-close') as HTMLButtonElement;

    closeButton.click();

    expect(closeRequested).toBe(true);
  });

  it('affiche la référence suivante et demande son ouverture', () => {
    const nextImage = createImage('next', 'next.jpg');

    fixture.componentRef.setInput('nextImage', nextImage);

    let nextRequested = false;

    component.nextRequested.subscribe(() => {
      nextRequested = true;
    });

    fixture.detectChanges();

    const nextButton = fixture.nativeElement.querySelector(
      '.overlay-next-image',
    ) as HTMLButtonElement;

    const nextImageElement = nextButton.querySelector('img');

    expect(nextImageElement?.getAttribute('src')).toContain('next.jpg');

    nextButton.click();

    expect(nextRequested).toBe(true);
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