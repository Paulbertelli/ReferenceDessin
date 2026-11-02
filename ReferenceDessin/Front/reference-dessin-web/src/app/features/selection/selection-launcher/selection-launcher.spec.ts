import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { DrawingSessionStore } from '../../drawing-session/drawing-session-store';
import { ReferenceSelectionStore } from '../reference-selection-store';
import { SelectionLauncher } from './selection-launcher';

describe('SelectionLauncher', () => {
  let fixture: ComponentFixture<SelectionLauncher>;
  let selectionStore: ReferenceSelectionStore;
  let sessionStore: DrawingSessionStore;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [SelectionLauncher],
      providers: [ReferenceSelectionStore, DrawingSessionStore, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectionLauncher);

    selectionStore = TestBed.inject(ReferenceSelectionStore);
    sessionStore = TestBed.inject(DrawingSessionStore);
    router = TestBed.inject(Router);

    selectionStore.clear();

    fixture.detectChanges();
  });

  it('reste masqué lorsque la sélection est vide', () => {
    expect(fixture.nativeElement.querySelector('.selection-launcher')).toBeNull();
  });

  it('affiche le résumé de la sélection en mode normal', () => {
    selectionStore.addAll([createImage('1'), createImage('2')]);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.selection-summary')).not.toBeNull();

    expect(fixture.nativeElement.querySelector('app-reference-stack')).not.toBeNull();
  });

  it('affiche uniquement le bouton en mode action-only', () => {
    selectionStore.addAll([createImage('1'), createImage('2')]);

    fixture.componentRef.setInput('displayMode', 'action-only');

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.selection-summary')).toBeNull();

    expect(fixture.nativeElement.querySelector('app-reference-stack')).toBeNull();

    expect(fixture.nativeElement.querySelector('.launch-button')).not.toBeNull();
  });

  it('démarre une séance et navigue vers celle-ci', () => {
    const images = [createImage('1'), createImage('2')];

    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    selectionStore.addAll(images);

    fixture.detectChanges();

    const launchButton = fixture.nativeElement.querySelector('.launch-button') as HTMLButtonElement;

    launchButton.click();

    expect(sessionStore.images()).toEqual(images);
    expect(navigate).toHaveBeenCalledWith(['/session']);
  });
});

function createImage(externalId: string): ReferenceImage {
  return {
    externalId,
    imageUrl: `https://images.example/${externalId}.jpg`,
    sourceName: 'Pexels',
    originalUrl: `https://www.pexels.com/photo/${externalId}`,
    authorName: null,
    authorUrl: null,
    description: '',
    averageColor: null,
  };
}