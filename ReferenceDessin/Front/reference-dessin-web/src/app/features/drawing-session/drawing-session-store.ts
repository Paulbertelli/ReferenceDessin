import { computed, Injectable, signal } from '@angular/core';
import { ReferenceImage } from '../../shared/models/reference-image';

export type DrawingSessionOrder = 'sequential' | 'random';

export interface DrawingSessionOptions {
  durationMinutes?: number;
  order?: DrawingSessionOrder;
}

@Injectable({
  providedIn: 'root',
})
export class DrawingSessionStore {
  private readonly sessionImages = signal<ReferenceImage[]>([]);

  private readonly selectedIndex = signal(0);

  private readonly sessionDurationMinutes = signal(2);

  readonly images = this.sessionImages.asReadonly();

  readonly currentIndex = this.selectedIndex.asReadonly();

  readonly durationMinutes = this.sessionDurationMinutes.asReadonly();

  readonly currentImage = computed(() => this.sessionImages()[this.selectedIndex()] ?? null);

  readonly hasPrevious = computed(() => this.selectedIndex() > 0);

  readonly hasNext = computed(() => this.selectedIndex() < this.sessionImages().length - 1);

  start(images: readonly ReferenceImage[], options: DrawingSessionOptions = {}): void {
    const durationMinutes = this.normalizeDuration(options.durationMinutes ?? 2);

    const sessionImages = options.order === 'random' ? this.shuffle(images) : [...images];

    this.sessionImages.set(sessionImages);
    this.sessionDurationMinutes.set(durationMinutes);
    this.selectedIndex.set(0);
  }

  selectPrevious(): void {
    if (!this.hasPrevious()) {
      return;
    }

    this.selectedIndex.update((index) => index - 1);
  }

  selectNext(): void {
    if (!this.hasNext()) {
      return;
    }

    this.selectedIndex.update((index) => index + 1);
  }

  private normalizeDuration(durationMinutes: number): number {
    if (!Number.isFinite(durationMinutes)) {
      return 2;
    }

    return Math.min(60, Math.max(0.1, durationMinutes));
  }

  private shuffle(images: readonly ReferenceImage[]): ReferenceImage[] {
    const shuffledImages = [...images];

    for (let index = shuffledImages.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));

      [shuffledImages[index], shuffledImages[randomIndex]] = [
        shuffledImages[randomIndex],
        shuffledImages[index],
      ];
    }

    return shuffledImages;
  }
}