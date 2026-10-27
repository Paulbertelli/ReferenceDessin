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

  it('charge les sections et les références du tableau', () => {
    const sections: PinterestBoardSection[] = [
      {
        id: 'section-1',
        name: 'Portraits',
      },
    ];

    const images = [createImage('1'), createImage('2')];

    store.load('  board-1  ');

    expect(api.receivedBoardId).toBe('board-1');
    expect(store.boardId()).toBe('board-1');
    expect(store.loading()).toBe(true);

    api.sectionsResponse.next(sections);
    api.sectionsResponse.complete();

    api.boardImagesResponse.next(images);
    api.boardImagesResponse.complete();

    expect(store.sections()).toEqual(sections);
    expect(store.images()).toEqual(images);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('');
  });

  it('charge les références de la section sélectionnée', () => {
    completeInitialLoad();

    const sectionImages = [createImage('3')];

    store.selectSection('  section-1  ');

    expect(api.receivedSectionId).toBe('section-1');

    expect(store.selectedSectionId()).toBe('section-1');

    expect(store.loading()).toBe(true);

    api.sectionImagesResponse.next(sectionImages);

    api.sectionImagesResponse.complete();

    expect(store.images()).toEqual(sectionImages);

    expect(store.loading()).toBe(false);
  });

  it('revient à toutes les références du tableau', () => {
    completeInitialLoad();

    store.selectSection('section-1');

    api.sectionImagesResponse.next([createImage('3')]);

    api.sectionImagesResponse.complete();

    store.selectSection(null);

    const boardImages = [createImage('1'), createImage('2')];

    api.boardImagesResponse.next(boardImages);

    api.boardImagesResponse.complete();

    expect(store.selectedSectionId()).toBeNull();
    expect(store.images()).toEqual(boardImages);
  });

  it('expose le détail d’une erreur HTTP', () => {
    store.load('board-1');

    api.sectionsResponse.error(
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

  function completeInitialLoad(): void {
    store.load('board-1');

    api.sectionsResponse.next([]);
    api.sectionsResponse.complete();

    api.boardImagesResponse.next([]);
    api.boardImagesResponse.complete();
  }
});

class StubPinterestApi {
  sectionsResponse = new Subject<PinterestBoardSection[]>();

  boardImagesResponse = new Subject<ReferenceImage[]>();

  sectionImagesResponse = new Subject<ReferenceImage[]>();

  receivedBoardId: string | undefined;
  receivedSectionId: string | undefined;

  getBoardSections(boardId: string): Observable<PinterestBoardSection[]> {
    this.receivedBoardId = boardId;

    this.sectionsResponse = new Subject<PinterestBoardSection[]>();

    return this.sectionsResponse.asObservable();
  }

  getBoardImages(boardId: string): Observable<ReferenceImage[]> {
    this.receivedBoardId = boardId;

    this.boardImagesResponse = new Subject<ReferenceImage[]>();

    return this.boardImagesResponse.asObservable();
  }

  getSectionImages(boardId: string, sectionId: string): Observable<ReferenceImage[]> {
    this.receivedBoardId = boardId;
    this.receivedSectionId = sectionId;

    this.sectionImagesResponse = new Subject<ReferenceImage[]>();

    return this.sectionImagesResponse.asObservable();
  }
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