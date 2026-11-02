import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PinterestBoardPreviewsStore } from '../../catalog/pinterest/pinterest-board-previews-store';
import { PinterestBoardsStore } from '../../catalog/pinterest/pinterest-boards-store';
import { HomeCollections } from './home-collections';

describe('HomeCollections', () => {
  let fixture: ComponentFixture<HomeCollections>;

  const boardsStore = {
    boards: signal([]),
    loading: signal(false),
    error: signal(''),
    load: vi.fn(),
  };

  const previewsStore = {
    load: vi.fn(),
    imagesFor: vi.fn(() => []),
    hasLoaded: vi.fn(() => true),
    errorFor: vi.fn(() => ''),
  };

  beforeEach(async () => {
    boardsStore.boards.set([]);
    boardsStore.loading.set(false);
    boardsStore.error.set('');

    boardsStore.load.mockClear();
    previewsStore.load.mockClear();
    previewsStore.imagesFor.mockClear();
    previewsStore.hasLoaded.mockClear();
    previewsStore.errorFor.mockClear();

    await TestBed.configureTestingModule({
      imports: [HomeCollections],
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

    fixture = TestBed.createComponent(HomeCollections);

    fixture.detectChanges();
  });

  it('crée l’aperçu des collections', () => {
    expect(fixture.componentInstance).toBeTruthy();

    expect(boardsStore.load).toHaveBeenCalledOnce();
  });
});