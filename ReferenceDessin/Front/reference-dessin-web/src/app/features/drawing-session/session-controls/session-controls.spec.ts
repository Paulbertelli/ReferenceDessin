import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { SessionControls } from './session-controls';

describe('SessionControls', () => {
  let fixture: ComponentFixture<SessionControls>;
  let component: SessionControls;

  const images = [createImage('1'), createImage('2'), createImage('3')];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionControls],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionControls);
    component = fixture.componentInstance;

    configureRequiredInputs();
  });

  it('affiche les images précédente et suivante', () => {
    fixture.detectChanges();

    const previousImage = fixture.nativeElement.querySelector(
      '.navigation-preview--previous img',
    ) as HTMLImageElement;

    const nextImage = fixture.nativeElement.querySelector(
      '.navigation-preview--next img',
    ) as HTMLImageElement;

    expect(previousImage).not.toBeNull();
    expect(nextImage).not.toBeNull();

    expect(previousImage.src).toContain('1.jpg');
    expect(nextImage.src).toContain('3.jpg');
  });

  it('émet une demande de navigation vers l’image précédente', () => {
    let requested = false;

    component.previousRequested.subscribe(() => {
      requested = true;
    });

    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '.navigation-preview--previous',
    ) as HTMLButtonElement;

    button.click();

    expect(requested).toBe(true);
  });

  it('émet une demande de navigation vers l’image suivante', () => {
    let requested = false;

    component.nextRequested.subscribe(() => {
      requested = true;
    });

    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '.navigation-preview--next',
    ) as HTMLButtonElement;

    button.click();

    expect(requested).toBe(true);
  });

  it('désactive la navigation lorsqu’aucune image adjacente n’est disponible', () => {
    fixture.componentRef.setInput('previousImage', null);
    fixture.componentRef.setInput('nextImage', null);

    fixture.componentRef.setInput('hasPrevious', false);
    fixture.componentRef.setInput('hasNext', false);

    fixture.detectChanges();

    const previousButton = fixture.nativeElement.querySelector(
      '.navigation-preview--previous',
    ) as HTMLButtonElement;

    const nextButton = fixture.nativeElement.querySelector(
      '.navigation-preview--next',
    ) as HTMLButtonElement;

    expect(previousButton.disabled).toBe(true);
    expect(nextButton.disabled).toBe(true);

    expect(previousButton.querySelector('img')).toBeNull();
    expect(nextButton.querySelector('img')).toBeNull();
  });

  function configureRequiredInputs(): void {
    fixture.componentRef.setInput('previousImage', images[0]);
    fixture.componentRef.setInput('nextImage', images[2]);

    fixture.componentRef.setInput('hasPrevious', true);
    fixture.componentRef.setInput('hasNext', true);

    fixture.componentRef.setInput('running', false);
    fixture.componentRef.setInput('disabled', false);

    fixture.componentRef.setInput('formattedTime', '02:00');
    fixture.componentRef.setInput('progress', 100);
    fixture.componentRef.setInput('durationMinutes', 2);
  }
});

function createImage(externalId: string): ReferenceImage {
  return {
    externalId,
    imageUrl: `https://images.example/${externalId}.jpg`,
    sourceName: 'Pinterest',
    originalUrl: `https://www.pinterest.com/pin/${externalId}/`,
    authorName: null,
    authorUrl: null,
    description: 'Référence de dessin',
    averageColor: null,
  };
}