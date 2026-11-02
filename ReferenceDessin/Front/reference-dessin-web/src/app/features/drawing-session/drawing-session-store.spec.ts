import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('commence avec une séance vide', () => {
    expect(store.images()).toEqual([]);
    expect(store.currentIndex()).toBe(0);
    expect(store.currentImage()).toBeNull();
    expect(store.durationMinutes()).toBe(2);
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

  it('enregistre la durée configurée pour la séance', () => {
    store.start(createImages(), {
      durationMinutes: 5,
    });

    expect(store.durationMinutes()).toBe(5);
  });

  it.each([
    {
      duration: -5,
      expected: 0.1,
    },
    {
      duration: 100,
      expected: 60,
    },
    {
      duration: Number.NaN,
      expected: 2,
    },
  ])('normalise la durée $duration', ({ duration, expected }) => {
    store.start(createImages(), {
      durationMinutes: duration,
    });

    expect(store.durationMinutes()).toBe(expected);
  });

  it('mélange les références lorsque l’ordre est aléatoire', () => {
    const images = createImages();

    vi.spyOn(Math, 'random').mockReturnValue(0);

    store.start(images, {
      order: 'random',
    });

    expect(store.images()).toEqual([images[1], images[0]]);

    expect(store.images()).not.toBe(images);
  });

  it('conserve l’ordre de la sélection par défaut', () => {
    const images = createImages();

    store.start(images);

    expect(store.images()).toEqual(images);
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