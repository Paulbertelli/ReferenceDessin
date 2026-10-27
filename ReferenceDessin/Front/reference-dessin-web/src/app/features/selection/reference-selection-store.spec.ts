import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReferenceImage } from '../../shared/models/reference-image';
import { ReferenceSelectionStore } from './reference-selection-store';

describe('ReferenceSelectionStore', () => {
  const storageKey = 'reference-dessin.selection';

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({});
  });

  it('commence avec une sélection vide', () => {
    const store = createStore();

    expect(store.images()).toEqual([]);
    expect(store.count()).toBe(0);
    expect(store.isEmpty()).toBe(true);
  });

  it('ajoute puis retire une référence', () => {
    const store = createStore();
    const image = createImage('Pexels', '123');

    store.toggle(image);

    expect(store.images()).toEqual([image]);
    expect(store.isSelected(image)).toBe(true);

    store.toggle(image);

    expect(store.images()).toEqual([]);
    expect(store.isSelected(image)).toBe(false);
  });

  it('distingue les références provenant de sources différentes', () => {
    const store = createStore();
    const pexelsImage = createImage('Pexels', '123');
    const pinterestImage = createImage('Pinterest', '123');

    store.addAll([pexelsImage, pinterestImage]);

    expect(store.images()).toEqual([pexelsImage, pinterestImage]);

    expect(store.count()).toBe(2);
  });

  it('ajoute plusieurs références sans doublon', () => {
    const store = createStore();
    const firstImage = createImage('Pexels', '123');
    const secondImage = createImage('Pexels', '456');

    store.addAll([firstImage]);

    store.addAll([firstImage, secondImage, secondImage]);

    expect(store.images()).toEqual([firstImage, secondImage]);
  });

  it('vide entièrement la sélection', () => {
    const store = createStore();

    store.addAll([createImage('Pexels', '123'), createImage('Pinterest', '456')]);

    store.clear();

    expect(store.images()).toEqual([]);
    expect(store.count()).toBe(0);
    expect(store.isEmpty()).toBe(true);
  });

  it('sauvegarde la sélection dans la session', () => {
    const store = createStore();
    const image = createImage('Pexels', '123');

    store.toggle(image);

    expect(JSON.parse(sessionStorage.getItem(storageKey) ?? '[]')).toEqual([image]);
  });

  it('restaure la sélection enregistrée', () => {
    const image = createImage('Pinterest', '456');

    sessionStorage.setItem(storageKey, JSON.stringify([image]));

    const store = createStore();

    expect(store.images()).toEqual([image]);
    expect(store.count()).toBe(1);
  });

  it('ignore et supprime une sélection corrompue', () => {
    sessionStorage.setItem(storageKey, '{"invalid":true}');

    const store = createStore();

    expect(store.images()).toEqual([]);
    expect(sessionStorage.getItem(storageKey)).toBeNull();
  });

  function createStore(): ReferenceSelectionStore {
    return TestBed.inject(ReferenceSelectionStore);
  }

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