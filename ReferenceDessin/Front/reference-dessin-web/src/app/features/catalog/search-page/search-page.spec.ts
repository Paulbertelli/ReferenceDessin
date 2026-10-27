import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { ReferenceSelectionStore } from '../../selection/reference-selection-store';
import { PexelsSearchStore } from '../pexels/pexels-search-store';
import { SearchPage } from './search-page';
import { provideRouter } from '@angular/router';

describe('SearchPage', () => {
  let fixture: ComponentFixture<SearchPage>;
  let selectionStore: ReferenceSelectionStore;

  const images: ReferenceImage[] = [createImage('1'), createImage('2')];

  const search = vi.fn();

  beforeEach(async () => {
    search.mockClear();

    const searchStore = {
      images: signal(images).asReadonly(),
      loading: signal(false).asReadonly(),
      error: signal('').asReadonly(),
      hasSearched: signal(true).asReadonly(),
      noResults: signal(false).asReadonly(),
      search,
    };

    await TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [
        provideRouter([]),
        ReferenceSelectionStore,
        {
          provide: PexelsSearchStore,
          useValue: searchStore,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPage);
    selectionStore = TestBed.inject(ReferenceSelectionStore);

    fixture.detectChanges();
  });

  it('lance la recherche avec le terme saisi', () => {
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;

    input.value = 'portrait';
    input.dispatchEvent(new Event('input'));

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    form.dispatchEvent(new Event('submit'));

    expect(search).toHaveBeenCalledWith('portrait');
  });

  it('ajoute une référence à la sélection', () => {
    const selectionButton = fixture.nativeElement.querySelector(
      '.reference-card__selection',
    ) as HTMLButtonElement;

    selectionButton.click();

    expect(selectionStore.isSelected(images[0])).toBe(true);
  });

  it('ajoute toutes les références affichées', () => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    const selectAllButton = buttons.find(
      (button) => button.textContent?.trim() === 'Tout sélectionner',
    );

    expect(selectAllButton).toBeDefined();

    selectAllButton!.click();

    expect(selectionStore.images()).toEqual(images);
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