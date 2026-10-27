import { computed, Injectable, signal } from '@angular/core';
import { ReferenceImage } from '../../shared/models/reference-image';

@Injectable({
  providedIn: 'root',
})
export class DrawingSessionStore {
  private readonly sessionImages = signal<ReferenceImage[]>([]);

  private readonly selectedIndex = signal(0);

  readonly images = this.sessionImages.asReadonly();
  readonly currentIndex = this.selectedIndex.asReadonly();

  readonly currentImage = computed(() => this.sessionImages()[this.selectedIndex()] ?? null);

  readonly hasPrevious = computed(() => this.selectedIndex() > 0);

  readonly hasNext = computed(() => this.selectedIndex() < this.sessionImages().length - 1);

  start(images: readonly ReferenceImage[]): void {
    this.sessionImages.set([...images]);
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
}