import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReferenceImage } from '../../shared/models/reference-image';
import { ReferenceSelectionStore } from './reference-selection-store';

describe('ReferenceSelectionStore', () => {
  let store: ReferenceSelectionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    store = TestBed.inject(ReferenceSelectionStore);
  });

  it('commence avec une sélection vide', () => {
    expect(store.images()).toEqual([]);
    expect(store.count()).toBe(0);
    expect(store.isEmpty()).toBe(true);
  });

  it('ajoute puis retire une référence', () => {
    const image = createImage('Pexels', '123');

    store.toggle(image);

    expect(store.images()).toEqual([image]);
    expect(store.isSelected(image)).toBe(true);

    store.toggle(image);

    expect(store.images()).toEqual([]);
    expect(store.isSelected(image)).toBe(false);
  });

  it('distingue les références provenant de sources différentes', () => {
    const pexelsImage = createImage('Pexels', '123');

    const pinterestImage = createImage('Pinterest', '123');

    store.addAll([pexelsImage, pinterestImage]);

    expect(store.images()).toEqual([pexelsImage, pinterestImage]);

    expect(store.count()).toBe(2);
  });

  it('ajoute plusieurs références sans doublon', () => {
    const firstImage = createImage('Pexels', '123');

    const secondImage = createImage('Pexels', '456');

    store.addAll([firstImage]);

    store.addAll([firstImage, secondImage, secondImage]);

    expect(store.images()).toEqual([firstImage, secondImage]);
  });

  it('vide entièrement la sélection', () => {
    store.addAll([createImage('Pexels', '123'), createImage('Pinterest', '456')]);

    store.clear();

    expect(store.images()).toEqual([]);
    expect(store.count()).toBe(0);
    expect(store.isEmpty()).toBe(true);
  });

  function createImage(sourceName: string, externalId: string): ReferenceImage {
    return {
      externalId,
      sourceName,
      imageUrl: `https://images.example/${externalId}.jpg`,
      originalUrl: `https://source.example/${externalId}`,
      authorName: null,
      authorUrl: null,
      description: '',
      averageColor: null,
    };
  }
});