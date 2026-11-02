import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { PexelsApi } from './pexels-api';
import { PexelsSearchStore } from './pexels-search-store';

describe('PexelsSearchStore', () => {
  let store: PexelsSearchStore;
  let api: StubPexelsApi;

  beforeEach(() => {
    api = new StubPexelsApi();

    TestBed.configureTestingModule({
      providers: [
        PexelsSearchStore,
        {
          provide: PexelsApi,
          useValue: api,
        },
      ],
    });

    store = TestBed.inject(PexelsSearchStore);
  });

  it('commence sans résultat ni recherche', () => {
    expect(store.images()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('');
    expect(store.hasSearched()).toBe(false);
    expect(store.noResults()).toBe(false);
  });

  it('recherche et conserve les références reçues', () => {
    const images = [createImage('1'), createImage('2')];

    store.search('portrait', 20);

    expect(api.receivedSearchTerm).toBe('portrait');
    expect(api.receivedCount).toBe(20);
    expect(store.loading()).toBe(true);

    api.latestResponse.next(images);
    api.latestResponse.complete();

    expect(store.images()).toEqual(images);
    expect(store.loading()).toBe(false);
    expect(store.hasSearched()).toBe(true);
    expect(store.noResults()).toBe(false);
  });

  it('signale explicitement une recherche vide', () => {
    store.search('inconnu');

    api.latestResponse.next([]);
    api.latestResponse.complete();

    expect(store.error()).toBe('');
    expect(store.hasSearched()).toBe(true);
    expect(store.noResults()).toBe(true);
  });

  it('utilise le détail de l’erreur HTTP', () => {
    store.search('portrait');

    api.latestResponse.error(
      new HttpErrorResponse({
        status: 502,
        error: {
          detail: 'Le service d’images est indisponible.',
        },
      }),
    );

    expect(store.loading()).toBe(false);
    expect(store.images()).toEqual([]);
    expect(store.error()).toBe('Le service d’images est indisponible.');
  });

  it('ignore la réponse d’une recherche remplacée', () => {
    store.search('première');

    const firstResponse = api.latestResponse;

    store.search('seconde');

    const secondResponse = api.latestResponse;
    const expectedImage = createImage('2');

    firstResponse.next([createImage('1')]);
    firstResponse.complete();

    expect(store.images()).toEqual([]);
    expect(store.loading()).toBe(true);

    secondResponse.next([expectedImage]);
    secondResponse.complete();

    expect(store.images()).toEqual([expectedImage]);
    expect(store.loading()).toBe(false);
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
});

class StubPexelsApi {
  private response = new Subject<ReferenceImage[]>();

  receivedSearchTerm: string | undefined;
  receivedCount: number | undefined;

  get latestResponse(): Subject<ReferenceImage[]> {
    return this.response;
  }

  searchReferenceImages(searchTerm: string = '', count: number = 30): Observable<ReferenceImage[]> {
    this.receivedSearchTerm = searchTerm;
    this.receivedCount = count;
    this.response = new Subject<ReferenceImage[]>();

    return this.response.asObservable();
  }
}