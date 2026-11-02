import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { PinterestApi } from './pinterest-api';
import { PinterestBoardDetailStore } from './pinterest-board-detail-store';
import { PinterestBoardSection } from './pinterest-board-section';

describe('PinterestBoardDetailStore', () => {
  let store: PinterestBoardDetailStore;
  let api: StubPinterestApi;

  beforeEach(() => {
    api = new StubPinterestApi();

    TestBed.configureTestingModule({
      providers: [
        PinterestBoardDetailStore,
        {
          provide: PinterestApi,
          useValue: api,
        },
      ],
    });

    store = TestBed.inject(PinterestBoardDetailStore);
  });

  it('charge le tableau et les sections sans charger leurs images', () => {
    const sections = createSections();

    const boardImages = [createImage('1'), createImage('2'), createImage('3')];

    store.load('  board-1  ');

    expect(store.boardId()).toBe('board-1');

    expect(store.initialLoading()).toBe(true);
    expect(store.sectionLoading()).toBe(false);
    expect(store.loading()).toBe(true);

    expect(api.sectionListRequests).toHaveLength(1);
    expect(api.boardImageRequests).toHaveLength(1);

    expect(api.sectionListRequests[0].boardId).toBe('board-1');

    flush(api.sectionListRequests[0], sections);

    flush(api.boardImageRequests[0], boardImages);

    expect(api.sectionImageRequests).toHaveLength(0);

    expect(store.sections()).toEqual(sections);
    expect(store.images()).toEqual(boardImages);

    expect(store.totalImageCount()).toBe(3);

    expect(store.sectionImageCount('section-1')).toBe(2);

    expect(store.sectionImageCount('section-2')).toBe(1);

    expect(store.initialLoading()).toBe(false);
    expect(store.sectionLoading()).toBe(false);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('');
  });

  it('charge une section lorsqu’elle est sélectionnée', () => {
    completeInitialLoad();

    store.selectSection('  section-1  ');

    expect(store.selectedSectionId()).toBe('section-1');

    expect(api.sectionImageRequests).toHaveLength(1);

    expect(api.sectionImageRequests[0].boardId).toBe('board-1');

    expect(api.sectionImageRequests[0].sectionId).toBe('section-1');

    expect(store.images()).toEqual([]);

    expect(store.initialLoading()).toBe(false);
    expect(store.sectionLoading()).toBe(true);
    expect(store.loading()).toBe(true);

    const sectionImages = [createImage('3'), createImage('4')];

    flush(api.sectionImageRequests[0], sectionImages);

    expect(store.images()).toEqual(sectionImages);

    /*
     * Le total reste celui de la collection,
     * indépendamment de la section affichée.
     */
    expect(store.totalImageCount()).toBe(2);

    expect(store.initialLoading()).toBe(false);
    expect(store.sectionLoading()).toBe(false);
    expect(store.loading()).toBe(false);
  });

  it('réutilise les images d’une section depuis le cache', () => {
    completeInitialLoad();

    store.selectSection('section-1');

    flush(api.sectionImageRequests[0], [createImage('3')]);

    store.selectSection(null);

    expect(store.images()).toEqual([createImage('1'), createImage('2')]);

    const requestCount = api.sectionImageRequests.length;

    store.selectSection('section-1');

    expect(store.images()).toEqual([createImage('3')]);

    expect(api.sectionImageRequests).toHaveLength(requestCount);

    expect(store.sectionLoading()).toBe(false);
  });

  it('revient aux références complètes du tableau', () => {
    completeInitialLoad();

    store.selectSection('section-1');

    flush(api.sectionImageRequests[0], [createImage('3')]);

    store.selectSection(null);

    expect(store.selectedSectionId()).toBeNull();

    expect(store.images()).toEqual([createImage('1'), createImage('2')]);

    expect(store.totalImageCount()).toBe(2);

    expect(store.sectionLoading()).toBe(false);
  });

  it('ne relance pas le chargement lorsque la section est déjà sélectionnée', () => {
    completeInitialLoad();

    store.selectSection('section-1');

    expect(api.sectionImageRequests).toHaveLength(1);

    store.selectSection('section-1');

    expect(api.sectionImageRequests).toHaveLength(1);
  });

  it('réessaie uniquement le chargement de la section en erreur', () => {
    completeInitialLoad();

    store.selectSection('section-1');

    api.sectionImageRequests[0].response.error(
      new HttpErrorResponse({
        status: 503,
        error: {
          detail: 'Section temporairement indisponible.',
        },
      }),
    );

    expect(store.error()).toBe('Section temporairement indisponible.');

    expect(store.initialLoading()).toBe(false);
    expect(store.sectionLoading()).toBe(false);
    expect(store.loading()).toBe(false);

    expect(api.sectionImageRequests).toHaveLength(1);

    store.retrySelectedSection();

    expect(api.sectionImageRequests).toHaveLength(2);

    expect(store.initialLoading()).toBe(false);
    expect(store.sectionLoading()).toBe(true);
    expect(store.loading()).toBe(true);
    expect(store.error()).toBe('');

    flush(api.sectionImageRequests[1], [createImage('3')]);

    expect(store.images()).toEqual([createImage('3')]);

    expect(store.initialLoading()).toBe(false);
    expect(store.sectionLoading()).toBe(false);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('');
  });

  it('charge correctement un tableau sans section', () => {
    store.load('board-1');

    expect(store.initialLoading()).toBe(true);

    flush(api.sectionListRequests[0], []);

    flush(api.boardImageRequests[0], [createImage('1')]);

    expect(api.sectionImageRequests).toHaveLength(0);

    expect(store.sections()).toEqual([]);

    expect(store.images()).toEqual([createImage('1')]);

    expect(store.totalImageCount()).toBe(1);

    expect(store.initialLoading()).toBe(false);
    expect(store.sectionLoading()).toBe(false);
    expect(store.loading()).toBe(false);
  });

  it('expose le détail d’une erreur HTTP', () => {
    store.load('board-1');

    api.sectionListRequests[0].response.error(
      new HttpErrorResponse({
        status: 503,
        error: {
          detail: 'Pinterest est temporairement indisponible.',
        },
      }),
    );

    expect(store.initialLoading()).toBe(false);
    expect(store.sectionLoading()).toBe(false);
    expect(store.loading()).toBe(false);

    expect(store.error()).toBe('Pinterest est temporairement indisponible.');
  });

  it('utilise un message générique sans détail', () => {
    store.load('board-1');

    api.boardImageRequests[0].response.error(
      new HttpErrorResponse({
        status: 500,
        error: {},
      }),
    );

    expect(store.initialLoading()).toBe(false);
    expect(store.sectionLoading()).toBe(false);
    expect(store.loading()).toBe(false);

    expect(store.error()).toBe('Impossible de récupérer cette collection Pinterest.');
  });

  it('ignore une réponse obsolète après un changement de section', () => {
    completeInitialLoad();

    store.selectSection('section-1');
    const oldRequest = api.sectionImageRequests[0];

    store.selectSection('section-2');
    const newRequest = api.sectionImageRequests[1];

    expect(store.selectedSectionId()).toBe('section-2');
    expect(store.sectionLoading()).toBe(true);

    flush(oldRequest, [createImage('old')]);

    expect(store.images()).toEqual([]);
    expect(store.sectionLoading()).toBe(true);
    expect(store.error()).toBe('');

    flush(newRequest, [createImage('new')]);

    expect(store.images()).toEqual([createImage('new')]);
    expect(store.selectedSectionId()).toBe('section-2');
    expect(store.sectionLoading()).toBe(false);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('');
  });

  it('ignore les réponses obsolètes après un changement de collection', () => {
    store.load('board-1');

    const oldSectionsRequest = api.sectionListRequests[0];
    const oldImagesRequest = api.boardImageRequests[0];

    store.load('board-2');

    const newSectionsRequest = api.sectionListRequests[1];
    const newImagesRequest = api.boardImageRequests[1];

    expect(store.boardId()).toBe('board-2');
    expect(store.initialLoading()).toBe(true);

    flush(oldSectionsRequest, createSections());
    flush(oldImagesRequest, [createImage('old')]);

    expect(store.sections()).toEqual([]);
    expect(store.images()).toEqual([]);
    expect(store.totalImageCount()).toBe(0);
    expect(store.initialLoading()).toBe(true);
    expect(store.error()).toBe('');

    const newSections = [createSections()[1]];
    const newImages = [createImage('new')];

    flush(newSectionsRequest, newSections);
    flush(newImagesRequest, newImages);

    expect(store.boardId()).toBe('board-2');
    expect(store.sections()).toEqual(newSections);
    expect(store.images()).toEqual(newImages);
    expect(store.totalImageCount()).toBe(1);
    expect(store.initialLoading()).toBe(false);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('');
  });


it('recharge la collection après une erreur initiale', () => {
  store.load('board-1');

  api.boardImageRequests[0].response.error(
    new HttpErrorResponse({
      status: 503,
      error: {
        detail: 'Pinterest temporairement indisponible.',
      },
    }),
  );

  expect(store.loading()).toBe(false);
  expect(store.error()).toBe('Pinterest temporairement indisponible.');

  store.retrySelectedSection();

  expect(api.sectionListRequests).toHaveLength(2);
  expect(api.boardImageRequests).toHaveLength(2);
  expect(store.initialLoading()).toBe(true);
  expect(store.error()).toBe('');

  const sections = createSections();
  const images = [createImage('1'), createImage('2')];

  flush(api.sectionListRequests[1], sections);
  flush(api.boardImageRequests[1], images);

  expect(store.sections()).toEqual(sections);
  expect(store.images()).toEqual(images);
  expect(store.totalImageCount()).toBe(2);
  expect(store.initialLoading()).toBe(false);
  expect(store.loading()).toBe(false);
  expect(store.error()).toBe('');
});


  function completeInitialLoad(): void {
    store.load('board-1');

    flush(api.sectionListRequests[0], createSections());

    flush(api.boardImageRequests[0], [createImage('1'), createImage('2')]);
  }
});

class StubPinterestApi {
  readonly sectionListRequests: SectionListRequest[] = [];

  readonly boardImageRequests: BoardImageRequest[] = [];

  readonly sectionImageRequests: SectionImageRequest[] = [];

  getBoardSections(boardId: string): Observable<PinterestBoardSection[]> {
    const response = new Subject<PinterestBoardSection[]>();

    this.sectionListRequests.push({
      boardId,
      response,
    });

    return response.asObservable();
  }

  getBoardImages(boardId: string): Observable<ReferenceImage[]> {
    const response = new Subject<ReferenceImage[]>();

    this.boardImageRequests.push({
      boardId,
      response,
    });

    return response.asObservable();
  }

  getSectionImages(boardId: string, sectionId: string): Observable<ReferenceImage[]> {
    const response = new Subject<ReferenceImage[]>();

    this.sectionImageRequests.push({
      boardId,
      sectionId,
      response,
    });

    return response.asObservable();
  }
}

interface SectionListRequest {
  boardId: string;
  response: Subject<PinterestBoardSection[]>;
}

interface BoardImageRequest {
  boardId: string;
  response: Subject<ReferenceImage[]>;
}

interface SectionImageRequest {
  boardId: string;
  sectionId: string;
  response: Subject<ReferenceImage[]>;
}

function flush<T>(
  request: {
    response: Subject<T>;
  },
  value: T,
): void {
  request.response.next(value);
  request.response.complete();
}

function createSections(): PinterestBoardSection[] {
  return [
    {
      id: 'section-1',
      name: 'Portraits',
      referenceCount: 2,
    },
    {
      id: 'section-2',
      name: 'Personnages',
      referenceCount: 1,
    },
  ];
}

function createImage(externalId: string): ReferenceImage {
  return {
    externalId,
    imageUrl: `https://i.pinimg.com/${externalId}.jpg`,
    sourceName: 'Pinterest',
    originalUrl: `https://www.pinterest.com/pin/${externalId}/`,
    authorName: null,
    authorUrl: null,
    description: '',
    averageColor: null,
  };
}