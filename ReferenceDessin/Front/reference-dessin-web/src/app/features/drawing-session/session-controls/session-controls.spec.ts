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

  it('affiche les références et leur nombre total', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    const previews = element.querySelectorAll('.session-preview__images img');

    expect(component).toBeTruthy();
    expect(previews.length).toBe(3);

    expect(element.querySelector('.session-preview__count')?.textContent?.trim()).toBe('5');
  });

  it('affiche l’image suivante', () => {
    fixture.componentRef.setInput('nextImage', images[1]);

    fixture.detectChanges();

    const nextImage = fixture.nativeElement.querySelector(
      '.next-image-preview img',
    ) as HTMLImageElement;

    expect(nextImage.src).toContain('2.jpg');
  });

  it('émet une demande de navigation vers l’image suivante', () => {
    fixture.componentRef.setInput('nextImage', images[1]);

    let nextRequested = false;

    component.nextRequested.subscribe(() => {
      nextRequested = true;
    });

    fixture.detectChanges();

    const nextButton = fixture.nativeElement.querySelector(
      '.next-image-preview',
    ) as HTMLButtonElement;

    nextButton.click();

    expect(nextRequested).toBe(true);
  });

  function configureRequiredInputs(): void {
    fixture.componentRef.setInput('previewImages', images);

    fixture.componentRef.setInput('totalImages', 5);

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