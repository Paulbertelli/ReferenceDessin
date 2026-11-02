import { HttpErrorResponse } from '@angular/common/http';
import { Subject, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReferenceImage } from '../../../shared/models/reference-image';
import { ReferenceSelectionStore } from '../../selection/reference-selection-store';
import { PinterestApi } from '../pinterest/pinterest-api';
import { PinterestBoardDetailStore } from '../pinterest/pinterest-board-detail-store';
import { CollectionDetailPage } from './collection-detail-page';

describe('CollectionDetailPage', () => {
  const images: ReferenceImage[] = [
    {
      externalId: 'image-1',
      sourceName: 'Pinterest',
      imageUrl: '/image-1.jpg',
      originalUrl: '/image-1.jpg',
      authorName: null,
      authorUrl: null,
      description: 'Image 1',
      averageColor: null,
    },
    {
      externalId: 'image-2',
      sourceName: 'Pinterest',
      imageUrl: '/image-2.jpg',
      originalUrl: '/image-2.jpg',
      authorName: null,
      authorUrl: null,
      description: 'Image 2',
      averageColor: null,
    },
  ];

  const sections = [
    {
      id: 'section-1',
      name: 'Portraits',
      referenceCount: 1,
    },
    {
      id: 'section-2',
      name: 'Paysages',
      referenceCount: 1,
    },
  ];

  let selectionStore: ReferenceSelectionStore;
  let detailStore: PinterestBoardDetailStore;
  let element: HTMLElement;

  beforeEach(async () => {
    sessionStorage.removeItem('reference-dessin.selection');

    const api = {
      getBoards: vi.fn().mockReturnValue(of([])),
      getBoardSections: vi.fn().mockReturnValue(of(sections)),
      getBoardImages: vi.fn().mockReturnValue(of(images)),
      getSectionImages: vi.fn().mockReturnValue(of([images[0]])),
    };

    await TestBed.configureTestingModule({
      imports: [CollectionDetailPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({
                boardId: 'board-1',
              }),
            },
          },
        },
        {
          provide: PinterestApi,
          useValue: api,
        },
        ReferenceSelectionStore,
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CollectionDetailPage);

    selectionStore = TestBed.inject(ReferenceSelectionStore);
    detailStore = fixture.debugElement.injector.get(PinterestBoardDetailStore);

    element = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();

    // Permet de rafraîchir le template après modification des signals.
    refresh = () => fixture.detectChanges();
  });

  let refresh: () => void;

  function button(label: string): HTMLButtonElement {
    const result = Array.from(element.querySelectorAll('button')).find((item) =>
      item.textContent?.includes(label),
    );

    if (!result) {
      throw new Error(`Bouton introuvable : ${label}`);
    }

    return result;
  }

  it('permet de naviguer entre les sections', () => {
    const selectSection = vi.spyOn(detailStore, 'selectSection');

    const portraits = button('Portraits');

    expect(portraits.getAttribute('aria-pressed')).toBe('false');

    portraits.click();
    refresh();

    expect(selectSection).toHaveBeenCalledWith('section-1');
    expect(detailStore.selectedSectionId()).toBe('section-1');

    expect(button('Portraits').getAttribute('aria-pressed')).toBe('true');

    expect(button('Toutes').getAttribute('aria-pressed')).toBe('false');

    button('Toutes').click();
    refresh();

    expect(selectSection).toHaveBeenCalledWith(null);
    expect(detailStore.selectedSectionId()).toBeNull();

    expect(button('Toutes').getAttribute('aria-pressed')).toBe('true');
  });

  it('sélectionne uniquement les images affichées', () => {
    const addAll = vi.spyOn(selectionStore, 'addAll');

    button('Tout sélectionner').click();
    refresh();

    expect(addAll).toHaveBeenCalledExactlyOnceWith(images);

    expect(selectionStore.count()).toBe(2);

    expect(selectionStore.isSelected(images[0])).toBe(true);
    expect(selectionStore.isSelected(images[1])).toBe(true);
  });

  it('désélectionne uniquement les images affichées', () => {
    const imageExterieure: ReferenceImage = {
      ...images[0],
      externalId: 'image-exterieure',
    };

    selectionStore.addAll([...images, imageExterieure]);
    refresh();

    const removeAll = vi.spyOn(selectionStore, 'removeAll');

    button('Tout désélectionner').click();
    refresh();

    expect(removeAll).toHaveBeenCalledExactlyOnceWith(images);

    expect(selectionStore.isSelected(images[0])).toBe(false);
    expect(selectionStore.isSelected(images[1])).toBe(false);

    // La sélection extérieure reste intacte.
    expect(selectionStore.isSelected(imageExterieure)).toBe(true);
    expect(selectionStore.count()).toBe(1);
  });

  it('relance le chargement après une erreur initiale', () => {
    const api = TestBed.inject(PinterestApi);
    const getBoardImages = vi.mocked(api.getBoardImages);

    getBoardImages.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 503,
            error: { detail: 'Service indisponible' },
          }),
      ),
    );

    detailStore.load('board-1');
    refresh();

    expect(element.textContent).toContain('Service indisponible');

    const callsBeforeRetry = getBoardImages.mock.calls.length;

    button('Réessayer').click();
    refresh();

    expect(getBoardImages).toHaveBeenCalledTimes(callsBeforeRetry + 1);
    expect(detailStore.error()).toBe('');
    expect(detailStore.images()).toEqual(images);
    expect(element.textContent).not.toContain('Service indisponible');
  });

  it('relance uniquement la section en erreur', () => {
    const api = TestBed.inject(PinterestApi);
    const getBoardImages = vi.mocked(api.getBoardImages);
    const getBoardSections = vi.mocked(api.getBoardSections);
    const getSectionImages = vi.mocked(api.getSectionImages);

    getSectionImages.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 503,
            error: { detail: 'Erreur de section' },
          }),
      ),
    );

    button('Portraits').click();
    refresh();

    expect(detailStore.selectedSectionId()).toBe('section-1');
    expect(element.textContent).toContain('Erreur de section');

    const boardCalls = getBoardImages.mock.calls.length;
    const sectionsCalls = getBoardSections.mock.calls.length;
    const sectionImageCalls = getSectionImages.mock.calls.length;

    button('Réessayer').click();
    refresh();

    expect(getSectionImages).toHaveBeenCalledTimes(sectionImageCalls + 1);
    expect(getSectionImages).toHaveBeenLastCalledWith('board-1', 'section-1');

    expect(getBoardImages).toHaveBeenCalledTimes(boardCalls);
    expect(getBoardSections).toHaveBeenCalledTimes(sectionsCalls);
  });

  it('efface une erreur et réaffiche les images après relance', () => {
    const api = TestBed.inject(PinterestApi);
    const getSectionImages = vi.mocked(api.getSectionImages);

    getSectionImages
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
              error: { detail: 'Chargement impossible' },
            }),
        ),
      )
      .mockReturnValueOnce(of([images[0]]));

    button('Portraits').click();
    refresh();

    expect(detailStore.error()).toBe('Chargement impossible');
    expect(detailStore.images()).toEqual([]);
    expect(element.textContent).toContain('Chargement impossible');

    button('Réessayer').click();
    refresh();

    expect(detailStore.error()).toBe('');
    expect(detailStore.images()).toEqual([images[0]]);
    expect(detailStore.sectionLoading()).toBe(false);

    expect(element.textContent).not.toContain('Chargement impossible');

    expect(element.querySelectorAll('.reference-grid app-reference-card')).toHaveLength(1);
  });

  it('sélectionne une image sans modifier les autres', () => {
    const cards = element.querySelectorAll('app-reference-card');

    expect(cards).toHaveLength(2);

    const selectionButton = cards[0].querySelector(
      'button.selection-indicator',
    ) as HTMLButtonElement;

    // Les boutons apparaissent après le chargement des images.
    const imageElement = cards[0].querySelector('img.reference-card__image');
    imageElement?.dispatchEvent(new Event('load'));
    refresh();

    const button = cards[0].querySelector('button.selection-indicator') as HTMLButtonElement;

    button.click();
    refresh();

    expect(selectionStore.count()).toBe(1);
    expect(selectionStore.isSelected(images[0])).toBe(true);
    expect(selectionStore.isSelected(images[1])).toBe(false);

    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('désélectionne une image sans modifier les autres', () => {
    selectionStore.addAll(images);
    refresh();

    const cards = element.querySelectorAll('app-reference-card');

    const imageElement = cards[0].querySelector('img.reference-card__image');
    imageElement?.dispatchEvent(new Event('load'));
    refresh();

    const button = cards[0].querySelector('button.selection-indicator') as HTMLButtonElement;

    expect(button.getAttribute('aria-pressed')).toBe('true');

    button.click();
    refresh();

    expect(selectionStore.count()).toBe(1);
    expect(selectionStore.isSelected(images[0])).toBe(false);
    expect(selectionStore.isSelected(images[1])).toBe(true);

    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('affiche un état vide sans actions de sélection globale', () => {
    const api = TestBed.inject(PinterestApi);
    const getSectionImages = vi.mocked(api.getSectionImages);

    getSectionImages.mockReturnValueOnce(of([]));

    button('Portraits').click();
    refresh();

    expect(detailStore.selectedSectionId()).toBe('section-1');
    expect(detailStore.images()).toEqual([]);

    expect(element.textContent).toContain('Section vide');
    expect(element.textContent).toContain('Cette section ne contient aucune référence.');

    expect(element.querySelectorAll('app-reference-card')).toHaveLength(0);

    const buttons = Array.from(element.querySelectorAll('button'));
    const labels = buttons.map((item) => item.textContent?.trim() ?? '');

    expect(labels).not.toContain('Tout sélectionner');
    expect(labels).not.toContain('Tout désélectionner');
  });

  it('affiche le chargement initial sans montrer les sections ni les images', () => {
    const api = TestBed.inject(PinterestApi);
    const pendingImages = new Subject<ReferenceImage[]>();

    vi.mocked(api.getBoardImages).mockReturnValueOnce(pendingImages.asObservable());

    detailStore.load('board-1');
    refresh();

    expect(detailStore.initialLoading()).toBe(true);

    expect(element.textContent).toContain('Chargement de la collection…');

    expect(element.querySelector('.section-filter')).toBeNull();

    expect(element.querySelectorAll('app-reference-card')).toHaveLength(0);

    pendingImages.next(images);
    pendingImages.complete();
    refresh();

    expect(detailStore.initialLoading()).toBe(false);

    expect(element.querySelector('.section-filter')).not.toBeNull();

    expect(element.querySelectorAll('app-reference-card')).toHaveLength(2);
  });

  it('affiche 12 placeholders pendant le chargement d’une section', () => {
    const api = TestBed.inject(PinterestApi);
    const pendingImages = new Subject<ReferenceImage[]>();

    vi.mocked(api.getSectionImages).mockReturnValueOnce(pendingImages.asObservable());

    expect(element.querySelectorAll('app-reference-card')).toHaveLength(2);

    button('Portraits').click();
    refresh();

    expect(detailStore.sectionLoading()).toBe(true);
    expect(detailStore.images()).toEqual([]);

    const loadingGrid = element.querySelector('.reference-grid--loading');

    expect(loadingGrid).not.toBeNull();
    expect(loadingGrid?.getAttribute('aria-busy')).toBe('true');

    expect(loadingGrid?.querySelectorAll('.reference-skeleton')).toHaveLength(12);

    expect(element.querySelectorAll('app-reference-card')).toHaveLength(0);

    pendingImages.next([images[0]]);
    pendingImages.complete();
    refresh();

    expect(detailStore.sectionLoading()).toBe(false);

    expect(element.querySelector('.reference-grid--loading')).toBeNull();

    expect(element.querySelectorAll('app-reference-card')).toHaveLength(1);
  });

  it('empêche la sélection globale pendant le chargement d’une section', () => {
    const api = TestBed.inject(PinterestApi);
    const pendingImages = new Subject<ReferenceImage[]>();

    vi.mocked(api.getSectionImages).mockReturnValueOnce(pendingImages.asObservable());

    const addAll = vi.spyOn(selectionStore, 'addAll');
    const removeAll = vi.spyOn(selectionStore, 'removeAll');

    button('Portraits').click();
    refresh();

    expect(detailStore.sectionLoading()).toBe(true);

    const selectButton = button('Tout sélectionner');

    expect(selectButton.disabled).toBe(true);

    selectButton.click();
    refresh();

    expect(addAll).not.toHaveBeenCalled();
    expect(removeAll).not.toHaveBeenCalled();
    expect(selectionStore.count()).toBe(0);

    pendingImages.next([images[0]]);
    pendingImages.complete();
    refresh();

    expect(detailStore.sectionLoading()).toBe(false);

    const enabledButton = button('Tout sélectionner');

    expect(enabledButton.disabled).toBe(false);

    enabledButton.click();
    refresh();

    expect(addAll).toHaveBeenCalledExactlyOnceWith([images[0]]);

    expect(selectionStore.count()).toBe(1);
  });
});
