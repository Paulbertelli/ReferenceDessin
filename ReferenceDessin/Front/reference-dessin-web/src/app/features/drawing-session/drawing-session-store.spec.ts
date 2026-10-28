import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReferenceImage } from '../../shared/models/reference-image';
import { DrawingSessionStore } from './drawing-session-store';

describe('DrawingSessionStore', () => {
  let store: DrawingSessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DrawingSessionStore],
    });

    store = TestBed.inject(DrawingSessionStore);
  });

  it('commence avec une séance vide', () => {
    expect(store.images()).toEqual([]);
    expect(store.currentIndex()).toBe(0);
    expect(store.currentImage()).toBeNull();
    expect(store.hasPrevious()).toBe(false);
    expect(store.hasNext()).toBe(false);
  });

  it('démarre une séance avec un instantané de la sélection', () => {
    const selectedImages = createImages();

    store.start(selectedImages);

    expect(store.images()).toEqual(selectedImages);
    expect(store.images()).not.toBe(selectedImages);
    expect(store.currentIndex()).toBe(0);
    expect(store.currentImage()).toBe(selectedImages[0]);
    expect(store.hasPrevious()).toBe(false);
    expect(store.hasNext()).toBe(true);
  });

  it('réinitialise la position au démarrage d’une nouvelle séance', () => {
    const images = createImages();

    store.start(images);
    store.selectNext();

    expect(store.currentIndex()).toBe(1);

    store.start([images[1]]);

    expect(store.currentIndex()).toBe(0);
    expect(store.currentImage()).toBe(images[1]);
    expect(store.hasPrevious()).toBe(false);
    expect(store.hasNext()).toBe(false);
  });

  it('navigue entre les références sans dépasser les limites', () => {
    const images = createImages();

    store.start(images);

    store.selectPrevious();

    expect(store.currentIndex()).toBe(0);
    expect(store.currentImage()).toBe(images[0]);

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
    expect(store.hasPrevious()).toBe(false);
    expect(store.hasNext()).toBe(true);
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