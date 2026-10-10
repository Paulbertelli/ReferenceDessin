import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { DrawingSessionStore } from './drawing-session-store';
import { ReferenceImage } from './reference-image';
import { ReferenceImageApi } from './reference-image-api';

describe('DrawingSessionStore', () => {
  let store: DrawingSessionStore;
  let api: StubReferenceImageApi;

  beforeEach(() => {
    api = new StubReferenceImageApi();

    TestBed.configureTestingModule({
      providers: [
        DrawingSessionStore,
        {
          provide: ReferenceImageApi,
          useValue: api,
        },
      ],
    });

    store = TestBed.inject(DrawingSessionStore);
  });

  it('starts with an empty state', () => {
    expect(store.images()).toEqual([]);
    expect(store.currentIndex()).toBe(0);
    expect(store.currentImage()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('');
    expect(store.hasPrevious()).toBe(false);
    expect(store.hasNext()).toBe(false);
  });

  it('searches images and selects the first result', () => {
    const images = createImages();

    store.search('portrait');

    expect(api.receivedSearchTerm).toBe('portrait');
    expect(store.loading()).toBe(true);

    api.response.next(images);
    api.response.complete();

    expect(store.images()).toEqual(images);
    expect(store.currentIndex()).toBe(0);
    expect(store.currentImage()).toBe(images[0]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('');
  });

  it('reports an empty search result', () => {
    store.search('inconnu');

    api.response.next([]);
    api.response.complete();

    expect(store.images()).toEqual([]);
    expect(store.currentImage()).toBeNull();
    expect(store.error()).toBe('Aucune image trouvée pour cette recherche.');
  });

  it('uses the error detail returned by the API', () => {
    store.search();

    api.response.error(
      new HttpErrorResponse({
        status: 502,
        error: {
          detail: 'Le service d’images est indisponible.',
        },
      }),
    );

    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('Le service d’images est indisponible.');
  });

  it('uses a fallback message without an error detail', () => {
    store.search();

    api.response.error(
      new HttpErrorResponse({
        status: 500,
        error: {},
      }),
    );

    expect(store.error()).toBe('Impossible de récupérer les images.');
  });

  it('navigates between images without exceeding boundaries', () => {
    const images = createImages();

    store.search();
    api.response.next(images);
    api.response.complete();

    store.selectPrevious();

    expect(store.currentIndex()).toBe(0);

    store.selectNext();

    expect(store.currentIndex()).toBe(1);
    expect(store.currentImage()).toBe(images[1]);
    expect(store.hasPrevious()).toBe(true);
    expect(store.hasNext()).toBe(false);

    store.selectNext();

    expect(store.currentIndex()).toBe(1);

    store.selectPrevious();

    expect(store.currentIndex()).toBe(0);
    expect(store.currentImage()).toBe(images[0]);
  });

  function createImages(): ReferenceImage[] {
    return [
      {
        externalId: '1',
        imageUrl: 'https://images.example/1.jpeg',
        sourceName: 'Pexels',
        originalUrl: 'https://example.com/1',
        authorName: 'Jane',
        authorUrl: null,
        description: 'Première image',
        averageColor: '#111111',
      },
      {
        externalId: '2',
        imageUrl: 'https://images.example/2.jpeg',
        sourceName: 'Pexels',
        originalUrl: 'https://example.com/2',
        authorName: 'John',
        authorUrl: null,
        description: 'Deuxième image',
        averageColor: '#222222',
      },
    ];
  }
});

class StubReferenceImageApi {
  readonly response = new Subject<ReferenceImage[]>();

  receivedSearchTerm: string | undefined;

  searchImages(searchTerm: string = ''): Observable<ReferenceImage[]> {
    this.receivedSearchTerm = searchTerm;

    return this.response.asObservable();
  }
}