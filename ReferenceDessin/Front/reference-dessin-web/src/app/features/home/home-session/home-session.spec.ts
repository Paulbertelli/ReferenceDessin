import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { ReferenceSelectionStore } from '../../selection/reference-selection-store';
import { HomeSession } from './home-session';

describe('HomeSession', () => {
  let fixture: ComponentFixture<HomeSession>;
  let selectionStore: ReferenceSelectionStore;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [HomeSession],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeSession);

    selectionStore = TestBed.inject(ReferenceSelectionStore);
    router = TestBed.inject(Router);

    selectionStore.clear();

    fixture.detectChanges();
  });

  it('crée le préparateur de séance', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('redirige vers la page de sélection au clic sur une carte', () => {
    selectionStore.addAll([createImage('1')]);

    fixture.detectChanges();

    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const selectionLink = fixture.nativeElement.querySelector(
      '.selection-image__link',
    ) as HTMLAnchorElement;

    expect(selectionLink).not.toBeNull();
    expect(selectionLink.getAttribute('href')).toBe('/selection');

    selectionLink.click();

    expect(navigateByUrl).toHaveBeenCalled();
  });

  it('retire une référence sans naviguer vers la page de sélection', () => {
    const image = createImage('1');

    selectionStore.addAll([image]);

    fixture.detectChanges();

    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const removeButton = fixture.nativeElement.querySelector(
      '.selection-image > button',
    ) as HTMLButtonElement;

    expect(removeButton).not.toBeNull();

    removeButton.click();

    fixture.detectChanges();

    expect(selectionStore.count()).toBe(0);
    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.selection-image')).toBeNull();
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
    description: 'Référence de dessin',
    averageColor: null,
  };
}