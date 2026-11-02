import { computed, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { ReferenceSelectionStore } from '../../selection/reference-selection-store';
import { PexelsSearchStore } from '../pexels/pexels-search-store';
import { SearchPage } from './search-page';

describe('SearchPage', () => {
  let fixture: ComponentFixture<SearchPage>;

  let selectionStore: ReferenceSelectionStore;

  let imagesState: WritableSignal<ReferenceImage[]>;
  let loadingState: WritableSignal<boolean>;
  let errorState: WritableSignal<string>;
  let searchedState: WritableSignal<boolean>;

  const queryParameters = new BehaviorSubject<ParamMap>(convertToParamMap({}));

  const images: ReferenceImage[] = [createImage('1'), createImage('2')];

  const search = vi.fn();

  beforeEach(async () => {
    sessionStorage.clear();

    search.mockClear();

    queryParameters.next(convertToParamMap({}));

    imagesState = signal(images);
    loadingState = signal(false);
    errorState = signal('');
    searchedState = signal(true);

    const searchStore = {
      images: imagesState.asReadonly(),
      loading: loadingState.asReadonly(),
      error: errorState.asReadonly(),
      hasSearched: searchedState.asReadonly(),

      noResults: computed(
        () => searchedState() && !loadingState() && !errorState() && imagesState().length === 0,
      ),

      search,
    };

    await TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [
        provideRouter([]),
        ReferenceSelectionStore,
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParameters.asObservable(),
          },
        },
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

  it('affiche le terme de l’URL et lance la recherche', () => {
    queryParameters.next(
      convertToParamMap({
        q: 'portrait',
      }),
    );

    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('h1') as HTMLHeadingElement;

    expect(title.textContent?.trim()).toBe('Résultats pour « portrait »');

    expect(search).toHaveBeenCalledWith('portrait');
  });

  it('ajoute une référence à la sélection', () => {
    const referenceImage = fixture.nativeElement.querySelector(
      '.reference-card__image',
    ) as HTMLImageElement;

    expect(referenceImage).not.toBeNull();

    referenceImage.dispatchEvent(new Event('load'));

    fixture.detectChanges();

    const selectionButton = fixture.nativeElement.querySelector(
      '.reference-card__selection-surface',
    ) as HTMLButtonElement;

    expect(selectionButton).not.toBeNull();

    selectionButton.click();

    fixture.detectChanges();

    expect(selectionStore.isSelected(images[0])).toBe(true);
  });

  it('ajoute toutes les références affichées', () => {
    const selectAllButton = findButton('Tout sélectionner');

    selectAllButton.click();

    fixture.detectChanges();

    expect(selectionStore.images()).toEqual(images);
  });

  it('affiche les deux actions lorsque la sélection est partielle', () => {
    selectionStore.addAll([images[0]]);

    fixture.detectChanges();

    expect(findButton('Tout désélectionner')).not.toBeNull();

    expect(findButton('Tout sélectionner')).not.toBeNull();
  });

  it('retire toutes les références affichées', () => {
    selectionStore.addAll(images);

    fixture.detectChanges();

    const deselectAllButton = findButton('Tout désélectionner');

    deselectAllButton.click();

    fixture.detectChanges();

    expect(selectionStore.images()).toEqual([]);

    expect(sessionStorage.getItem('reference-dessin.selection')).toBeNull();
  });

  it('affiche l’état de chargement', () => {
    imagesState.set([]);
    loadingState.set(true);
    errorState.set('');

    fixture.detectChanges();

    const loading = fixture.nativeElement.querySelector('.page-state--loading') as HTMLElement;

    expect(loading).not.toBeNull();
    expect(loading.getAttribute('role')).toBe('status');

    expect(loading.textContent).toContain('Chargement des références…');

    expect(fixture.nativeElement.textContent).toContain('Recherche en cours…');

    expect(fixture.nativeElement.querySelector('.reference-grid')).toBeNull();

    expect(fixture.nativeElement.querySelector('.selection-actions')).toBeNull();
  });

  it('affiche l’erreur avec une action pour réessayer', () => {
    imagesState.set([]);
    loadingState.set(false);
    errorState.set('Le service d’images est indisponible.');

    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('.page-state--error') as HTMLElement;

    expect(error).not.toBeNull();
    expect(error.getAttribute('role')).toBe('alert');

    expect(error.querySelector('h2')?.textContent?.trim()).toBe(
      'Impossible de charger les références',
    );

    expect(error.textContent).toContain('Le service d’images est indisponible.');

    expect(fixture.nativeElement.textContent).toContain('Résultats indisponibles');
  });

  it('relance la dernière recherche après une erreur', () => {
    queryParameters.next(
      convertToParamMap({
        q: 'portrait',
      }),
    );

    imagesState.set([]);
    loadingState.set(false);
    errorState.set('Le service est indisponible.');

    fixture.detectChanges();

    search.mockClear();

    const retryButton = fixture.nativeElement.querySelector(
      '.page-state--error button',
    ) as HTMLButtonElement;

    expect(retryButton).not.toBeNull();

    retryButton.click();

    expect(search).toHaveBeenCalledOnce();
    expect(search).toHaveBeenCalledWith('portrait');
  });

  it('affiche un état vide lorsqu’une recherche ne retourne aucun résultat', () => {
    queryParameters.next(
      convertToParamMap({
        q: 'recherche introuvable',
      }),
    );

    imagesState.set([]);
    loadingState.set(false);
    errorState.set('');
    searchedState.set(true);

    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.page-state--empty') as HTMLElement;

    expect(emptyState).not.toBeNull();

    expect(emptyState.querySelector('h2')?.textContent?.trim()).toBe('Aucune référence trouvée');

    expect(emptyState.textContent).toContain(
      'Essayez un autre thème ou une recherche plus générale.',
    );

    expect(fixture.nativeElement.querySelector('.reference-grid')).toBeNull();
  });

  it('affiche un état vide différent pour les références à découvrir', () => {
    queryParameters.next(convertToParamMap({}));

    imagesState.set([]);
    loadingState.set(false);
    errorState.set('');
    searchedState.set(true);

    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.page-state--empty') as HTMLElement;

    expect(emptyState).not.toBeNull();

    expect(emptyState.querySelector('h2')?.textContent?.trim()).toBe('Aucune référence disponible');

    expect(emptyState.textContent).toContain(
      'Aucune référence ne peut être proposée pour le moment.',
    );
  });

  function findButton(label: string): HTMLButtonElement {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.selection-actions button'),
    ) as HTMLButtonElement[];

    const button = buttons.find((candidate) => candidate.textContent?.trim() === label);

    expect(button).toBeDefined();

    return button as HTMLButtonElement;
  }
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