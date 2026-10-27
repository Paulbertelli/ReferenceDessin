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

  it('charge le tableau, les sections et leurs références', () => {
    const sections: PinterestBoardSection[] = [
      {
        id: 'section-1',
        name: 'Portraits',
      },
      {
        id: 'section-2',
        name: 'Personnages',
      },
    ];

    const boardImages = [createImage('1'), createImage('2'), createImage('3')];

    store.load('  board-1  ');

    expect(store.boardId()).toBe('board-1');
    expect(store.loading()).toBe(true);

    expect(api.sectionListRequests).toHaveLength(1);

    expect(api.boardImageRequests).toHaveLength(1);

    expect(api.sectionListRequests[0].boardId).toBe('board-1');

    flush(api.sectionListRequests[0], sections);

    flush(api.boardImageRequests[0], boardImages);

    /*
     * Les requêtes de sections commencent après
     * le chargement de la liste des sections et
     * des références du tableau.
     */
    expect(api.sectionImageRequests).toHaveLength(2);

    expect(api.sectionImageRequests[0].sectionId).toBe('section-1');

    expect(api.sectionImageRequests[1].sectionId).toBe('section-2');

    expect(store.loading()).toBe(true);

    flush(api.sectionImageRequests[0], [createImage('1'), createImage('2')]);

    flush(api.sectionImageRequests[1], [createImage('3')]);

    expect(store.sections()).toEqual(sections);

    expect(store.images()).toEqual(boardImages);

    expect(store.totalImageCount()).toBe(3);

    expect(store.sectionImageCount('section-1')).toBe(2);

    expect(store.sectionImageCount('section-2')).toBe(1);

    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('');
  });

  it('sélectionne une section depuis le cache', () => {
    completeInitialLoad();

    const requestCountBeforeSelection = api.sectionImageRequests.length;

    store.selectSection('  section-1  ');

    expect(store.selectedSectionId()).toBe('section-1');

    expect(store.images()).toEqual([createImage('3')]);

    expect(store.totalImageCount()).toBe(2);

    /*
     * La sélection ne déclenche pas de nouvelle
     * requête HTTP.
     */
    expect(api.sectionImageRequests).toHaveLength(requestCountBeforeSelection);
  });

  it('revient aux références complètes depuis le cache', () => {
    completeInitialLoad();

    store.selectSection('section-1');

    expect(store.images()).toEqual([createImage('3')]);

    store.selectSection(null);

    expect(store.selectedSectionId()).toBeNull();

    expect(store.images()).toEqual([createImage('1'), createImage('2')]);

    expect(store.totalImageCount()).toBe(2);
  });

  it('ne change rien lorsque la section est déjà sélectionnée', () => {
    completeInitialLoad();

    store.selectSection('section-1');

    const imagesBeforeSecondSelection = store.images();

    store.selectSection('section-1');

    expect(store.images()).toBe(imagesBeforeSecondSelection);
  });

  it('charge correctement un tableau sans section', () => {
    store.load('board-1');

    flush(api.sectionListRequests[0], []);

    flush(api.boardImageRequests[0], [createImage('1')]);

    expect(api.sectionImageRequests).toHaveLength(0);

    expect(store.sections()).toEqual([]);
    expect(store.images()).toEqual([createImage('1')]);

    expect(store.totalImageCount()).toBe(1);
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

    expect(store.loading()).toBe(false);

    expect(store.error()).toBe('Impossible de récupérer cette collection Pinterest.');
  });

  function completeInitialLoad(): void {
    store.load('board-1');

    flush(api.sectionListRequests[0], [
      {
        id: 'section-1',
        name: 'Portraits',
      },
    ]);

    flush(api.boardImageRequests[0], [createImage('1'), createImage('2')]);

    flush(api.sectionImageRequests[0], [createImage('3')]);
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