import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DrawingSession } from './drawing-session';
import { DrawingSessionStore } from './drawing-session-store';
import { ReferenceImage } from './reference-image';

describe('DrawingSession', () => {
  let fixture: ComponentFixture<DrawingSession>;
  let store: StubDrawingSessionStore;

  beforeEach(async () => {
    store = new StubDrawingSessionStore();

    await TestBed.configureTestingModule({
      imports: [DrawingSession],
      providers: [
        {
          provide: DrawingSessionStore,
          useValue: store,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DrawingSession);
    fixture.detectChanges();
  });

  it('displays the loading state', () => {
    store.loading.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Chargement des références…');
  });

  it('displays the store error', () => {
    store.error.set('Impossible de récupérer les images.');

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Impossible de récupérer les images.');
  });

  it('disables navigation without images', () => {
    const previousButton = fixture.nativeElement.querySelector(
      '.previous-button',
    ) as HTMLButtonElement;

    const nextButton = fixture.nativeElement.querySelector('.next-button') as HTMLButtonElement;

    expect(previousButton.disabled).toBe(true);
    expect(nextButton.disabled).toBe(true);
  });

  it('navigates to the next image', () => {
    store.images.set(createImages());
    fixture.detectChanges();

    const nextButton = fixture.nativeElement.querySelector('.next-button') as HTMLButtonElement;

    expect(nextButton.disabled).toBe(false);

    nextButton.click();

    expect(store.currentIndex()).toBe(1);

    fixture.detectChanges();

    expect(nextButton.disabled).toBe(true);
  });

  it('navigates with the arrow keys', () => {
    store.images.set(createImages());
    fixture.detectChanges();

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
      }),
    );

    expect(store.currentIndex()).toBe(1);

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
      }),
    );

    expect(store.currentIndex()).toBe(0);
  });
});

class StubDrawingSessionStore {
  readonly images = signal<ReferenceImage[]>([]);
  readonly currentIndex = signal(0);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly currentImage = computed(() => this.images()[this.currentIndex()] ?? null);

  readonly hasPrevious = computed(() => this.currentIndex() > 0);

  readonly hasNext = computed(() => this.currentIndex() < this.images().length - 1);

  selectPrevious(): void {
    if (this.hasPrevious()) {
      this.currentIndex.update((index) => index - 1);
    }
  }

  selectNext(): void {
    if (this.hasNext()) {
      this.currentIndex.update((index) => index + 1);
    }
  }
}

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