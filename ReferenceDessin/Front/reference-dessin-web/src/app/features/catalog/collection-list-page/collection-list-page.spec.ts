import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { CollectionCard } from '../../../shared/collection-card/collection-card';
import { PinterestBoard } from '../pinterest/pinterest-board';
import { PinterestBoardPreviewsStore } from '../pinterest/pinterest-board-previews-store';
import { PinterestBoardsStore } from '../pinterest/pinterest-boards-store';
import { CollectionListPage } from './collection-list-page';

describe('CollectionListPage', () => {
  let fixture: ComponentFixture<CollectionListPage>;

  let boardsState: WritableSignal<PinterestBoard[]>;
  let loadingState: WritableSignal<boolean>;
  let errorState: WritableSignal<string>;
  let loadedState: WritableSignal<boolean>;

  let previewImages: Map<string, ReferenceImage[]>;
  let loadedPreviews: Set<string>;
  let loadingPreviews: Set<string>;
  let previewErrors: Map<string, string>;

  const loadBoards = vi.fn();
  const loadPreview = vi.fn();

  const board = createBoard('board-1');

  beforeEach(async () => {
    sessionStorage.clear();

    loadBoards.mockClear();
    loadPreview.mockClear();

    boardsState = signal([board]);
    loadingState = signal(false);
    errorState = signal('');
    loadedState = signal(true);

    previewImages = new Map([[board.id, [createImage('1')]]]);

    loadedPreviews = new Set([board.id]);
    loadingPreviews = new Set();
    previewErrors = new Map();

    const boardsStore = {
      boards: boardsState.asReadonly(),
      loading: loadingState.asReadonly(),
      error: errorState.asReadonly(),
      loaded: loadedState.asReadonly(),
      load: loadBoards,
    };

    const previewsStore = {
      imagesFor: vi.fn((boardId: string) => previewImages.get(boardId) ?? []),

      hasLoaded: vi.fn((boardId: string) => loadedPreviews.has(boardId)),

      isLoading: vi.fn((boardId: string) => loadingPreviews.has(boardId)),

      errorFor: vi.fn((boardId: string) => previewErrors.get(boardId) ?? ''),

      load: loadPreview,
    };

    await TestBed.configureTestingModule({
      imports: [CollectionListPage],
      providers: [
        provideRouter([]),
        {
          provide: PinterestBoardsStore,
          useValue: boardsStore,
        },
        {
          provide: PinterestBoardPreviewsStore,
          useValue: previewsStore,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionListPage);

    fixture.detectChanges();
  });

  it('charge les collections et leurs aperçus', () => {
    expect(loadBoards).toHaveBeenCalledOnce();

    expect(loadPreview).toHaveBeenCalledWith(board.id);
  });

  it('affiche l’état de chargement', () => {
    boardsState.set([]);
    loadingState.set(true);
    loadedState.set(false);
    errorState.set('');

    fixture.detectChanges();

    const loading = fixture.nativeElement.querySelector('.page-state--loading') as HTMLElement;

    expect(loading).not.toBeNull();
    expect(loading.getAttribute('role')).toBe('status');

    expect(loading.textContent).toContain('Chargement des collections…');

    expect(fixture.nativeElement.querySelector('.collection-grid')).toBeNull();
  });

  it('affiche une erreur et permet de réessayer', () => {
    boardsState.set([]);
    loadingState.set(false);
    errorState.set('Vérifiez votre connexion internet, puis réessayez.');

    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('.page-state--error') as HTMLElement;

    expect(error).not.toBeNull();
    expect(error.getAttribute('role')).toBe('alert');

    expect(error.querySelector('h2')?.textContent?.trim()).toBe(
      'Impossible de charger les collections',
    );

    expect(error.textContent).toContain('Vérifiez votre connexion internet, puis réessayez.');

    loadBoards.mockClear();

    const retryButton = error.querySelector('button') as HTMLButtonElement;

    retryButton.click();

    expect(loadBoards).toHaveBeenCalledOnce();
    expect(loadBoards).toHaveBeenCalledWith(true);
  });

  it('affiche un état vide lorsqu’aucune collection n’existe', () => {
    boardsState.set([]);
    loadingState.set(false);
    errorState.set('');
    loadedState.set(true);

    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.page-state--empty') as HTMLElement;

    expect(emptyState).not.toBeNull();

    expect(emptyState.querySelector('h2')?.textContent?.trim()).toBe(
      'Aucune collection disponible',
    );

    expect(emptyState.textContent).toContain(
      'Les collections apparaîtront ici dès qu’elles seront disponibles.',
    );
  });

  it('affiche un état vide lorsque les collections ne contiennent aucune référence', () => {
    previewImages.set(board.id, []);
    loadedPreviews.add(board.id);
    previewErrors.delete(board.id);

    boardsState.set([...boardsState()]);

    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.page-state--empty') as HTMLElement;

    expect(emptyState).not.toBeNull();

    expect(emptyState.querySelector('h2')?.textContent?.trim()).toBe('Aucune référence disponible');

    expect(emptyState.textContent).toContain(
      'Les collections disponibles ne contiennent aucune référence exploitable.',
    );

    expect(fixture.nativeElement.querySelector('.collection-grid')).toBeNull();
  });

  it('affiche les collections contenant des références', () => {
    const cards = fixture.nativeElement.querySelectorAll('app-collection-card');

    expect(cards.length).toBe(1);

    expect(fixture.nativeElement.querySelector('.collection-grid')).not.toBeNull();

    expect(fixture.nativeElement.textContent).toContain(board.name);
  });

  it('permet de changer le mode d’affichage', () => {
    const toggleButton = fixture.nativeElement.querySelector(
      '[contentHeaderActions] button',
    ) as HTMLButtonElement;

    expect(toggleButton.textContent?.trim()).toBe('Vue compacte');

    toggleButton.click();

    fixture.detectChanges();

    expect(toggleButton.textContent?.trim()).toBe('Vue détaillée');

    expect(toggleButton.getAttribute('aria-label')).toBe(
      'Afficher les collections en vue détaillée',
    );
  });

  it('permet de relancer le chargement d’un aperçu', () => {
    loadPreview.mockClear();

    const cardDebugElement = fixture.debugElement.query(By.directive(CollectionCard));

    expect(cardDebugElement).not.toBeNull();

    const card = cardDebugElement.componentInstance as CollectionCard;

    card.retryRequested.emit();

    expect(loadPreview).toHaveBeenCalledOnce();

    expect(loadPreview).toHaveBeenCalledWith(board.id, true);
  });
});

function createBoard(id: string): PinterestBoard {
  return {
    id,
    name: 'Portraits',
    description: 'Références de portraits',
    referenceCount: 12,
    sectionCount: 2,
  };
}

function createImage(externalId: string): ReferenceImage {
  return {
    externalId,
    imageUrl: `https://images.example/${externalId}.jpg`,
    sourceName: 'Pinterest',
    originalUrl: `https://www.pinterest.com/pin/${externalId}/`,
    authorName: null,
    authorUrl: null,
    description: 'Référence Pinterest',
    averageColor: null,
  };
}