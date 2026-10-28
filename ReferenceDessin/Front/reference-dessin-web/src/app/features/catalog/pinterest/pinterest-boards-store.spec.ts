import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { PinterestApi } from './pinterest-api';
import { PinterestBoard } from './pinterest-board';
import { PinterestBoardsStore } from './pinterest-boards-store';

describe('PinterestBoardsStore', () => {
  let store: PinterestBoardsStore;
  let api: StubPinterestApi;

  beforeEach(() => {
    api = new StubPinterestApi();

    TestBed.configureTestingModule({
      providers: [
        PinterestBoardsStore,
        {
          provide: PinterestApi,
          useValue: api,
        },
      ],
    });

    store = TestBed.inject(PinterestBoardsStore);
  });

  it('commence sans tableau chargé', () => {
    expect(store.boards()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('');
    expect(store.loaded()).toBe(false);
  });

  it('charge et conserve les tableaux', () => {
    const boards: PinterestBoard[] = [
      {
        id: '123',
        name: 'Portraits',
        description: '',
      },
    ];

    store.load();

    expect(api.callCount).toBe(1);
    expect(store.loading()).toBe(true);

    api.latestResponse.next(boards);
    api.latestResponse.complete();

    expect(store.boards()).toEqual(boards);
    expect(store.loading()).toBe(false);
    expect(store.loaded()).toBe(true);
  });

  it('ne recharge pas des tableaux déjà chargés', () => {
    store.load();

    api.latestResponse.next([]);
    api.latestResponse.complete();

    store.load();

    expect(api.callCount).toBe(1);
  });

  it('permet de forcer le rechargement', () => {
    store.load();

    api.latestResponse.next([]);
    api.latestResponse.complete();

    store.load(true);

    expect(api.callCount).toBe(2);
    expect(store.loading()).toBe(true);
  });

  it('expose le détail d’une erreur HTTP', () => {
    store.load();

    api.latestResponse.error(
      new HttpErrorResponse({
        status: 503,
        error: {
          detail: 'L’accès à Pinterest n’est pas encore activé.',
        },
      }),
    );

    expect(store.loading()).toBe(false);
    expect(store.loaded()).toBe(false);
    expect(store.error()).toBe('L’accès à Pinterest n’est pas encore activé.');
  });
});

class StubPinterestApi {
  private response = new Subject<PinterestBoard[]>();

  callCount = 0;

  get latestResponse(): Subject<PinterestBoard[]> {
    return this.response;
  }

  getBoards(): Observable<PinterestBoard[]> {
    this.callCount++;

    this.response = new Subject<PinterestBoard[]>();

    return this.response.asObservable();
  }
}