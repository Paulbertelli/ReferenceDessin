import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotificationStore } from './notification-store';

describe('NotificationStore', () => {
  let store: NotificationStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationStore],
    });

    store = TestBed.inject(NotificationStore);
  });

  it('starts without a notification', () => {
    expect(store.notification()).toBeNull();
  });

  it('shows an error notification', () => {
    store.showError('Une erreur est survenue.');

    expect(store.notification()).toEqual({
      type: 'error',
      message: 'Une erreur est survenue.',
    });
  });

  it('shows a success notification', () => {
    store.showSuccess('Opération réussie.');

    expect(store.notification()).toEqual({
      type: 'success',
      message: 'Opération réussie.',
    });
  });

  it('shows an information notification', () => {
    store.showInformation('Information utile.');

    expect(store.notification()).toEqual({
      type: 'info',
      message: 'Information utile.',
    });
  });

  it('clears the current notification', () => {
    store.showError('Une erreur est survenue.');

    store.clear();

    expect(store.notification()).toBeNull();
  });
});