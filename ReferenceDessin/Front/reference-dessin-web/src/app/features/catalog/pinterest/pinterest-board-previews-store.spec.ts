import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  Observable,
  Subject,
} from 'rxjs';
import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { PinterestApi } from './pinterest-api';
import { PinterestBoardPreviewsStore } from './pinterest-board-previews-store';

describe('PinterestBoardPreviewsStore', () => {
  let store: PinterestBoardPreviewsStore;
  let api: StubPinterestApi;

  beforeEach(() => {
    api = new StubPinterestApi();

    TestBed.configureTestingModule({
      providers: [
        PinterestBoardPreviewsStore,
        {
          provide: PinterestApi,
          useValue: api,
        },
      ],
    });

    store = TestBed.inject(
      PinterestBoardPreviewsStore,
    );
  });

  it('charge et conserve l’aperçu d’un tableau', () => {
    const images = [createImage('1'), createImage('2')];

    expect(store.hasLoaded('board-123')).toBe(false);

    store.load('board-123');

    expect(store.isLoading('board-123')).toBe(true);
    expect(store.hasLoaded('board-123')).toBe(false);

    expect(api.requests).toHaveLength(1);
    expect(api.requests[0].boardId).toBe('board-123');
    expect(api.requests[0].count).toBe(3);

    api.requests[0].response.next(images);
    api.requests[0].response.complete();

    expect(store.imagesFor('board-123')).toEqual(images);
    expect(store.isLoading('board-123')).toBe(false);
    expect(store.hasLoaded('board-123')).toBe(true);
    expect(store.errorFor('board-123')).toBe('');
  });

  it('ne recharge pas un aperçu déjà récupéré', () => {
    store.load('board-123');

    api.requests[0].response.next([]);
    api.requests[0].response.complete();

    store.load('board-123');

    expect(api.requests).toHaveLength(1);
  });

  it('conserve une erreur propre à chaque tableau', () => {
    store.load('board-123');

    api.requests[0].response.error(
      new HttpErrorResponse({
        status: 502,
        error: {
          detail:
            'Pinterest est temporairement indisponible.',
        },
      }),
    );

    expect(store.isLoading('board-123')).toBe(
      false,
    );

    expect(store.errorFor('board-123')).toBe(
      'Pinterest est temporairement indisponible.',
    );

    expect(store.imagesFor('board-123')).toEqual(
      [],
    );
  });

  function createImage(
    externalId: string,
  ): ReferenceImage {
    return {
      externalId,
      imageUrl:
        `https://i.pinimg.com/${externalId}.jpg`,
      sourceName: 'Pinterest',
      originalUrl:
        `https://www.pinterest.com/pin/${externalId}/`,
      authorName: null,
      authorUrl: null,
      description: '',
      averageColor: null,
    };
  }
});

class StubPinterestApi {
  readonly requests: PreviewRequest[] = [];

  getBoardPreviewImages(
    boardId: string,
    count: number,
  ): Observable<ReferenceImage[]> {
    const response =
      new Subject<ReferenceImage[]>();

    this.requests.push({
      boardId,
      count,
      response,
    });

    return response.asObservable();
  }
}

interface PreviewRequest {
  boardId: string;
  count: number;
  response: Subject<ReferenceImage[]>;
}