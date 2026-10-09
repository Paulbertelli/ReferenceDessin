import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { ReferenceImage } from './reference-image';
import { ReferenceImageApi } from './reference-image-api';

@Injectable({
  providedIn: 'root',
})
export class DrawingSessionStore {
  private readonly referenceImageApi = inject(ReferenceImageApi);

  private readonly referenceImages = signal<ReferenceImage[]>([]);

  private readonly selectedIndex = signal(0);
  private readonly loadingState = signal(false);
  private readonly errorMessage = signal('');

  readonly images = this.referenceImages.asReadonly();
  readonly currentIndex = this.selectedIndex.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorMessage.asReadonly();

  readonly currentImage = computed(() => this.referenceImages()[this.selectedIndex()] ?? null);

  readonly hasPrevious = computed(() => this.selectedIndex() > 0);

  readonly hasNext = computed(() => this.selectedIndex() < this.referenceImages().length - 1);

  search(searchTerm: string = ''): void {
    this.loadingState.set(true);
    this.errorMessage.set('');

    this.referenceImageApi
      .searchImages(searchTerm)
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (images) => {
          this.referenceImages.set(images);
          this.selectedIndex.set(0);

          if (images.length === 0) {
            this.errorMessage.set('Aucune image trouvée pour cette recherche.');
          }
        },
        error: (response: HttpErrorResponse) => {
          const detail = response.error?.detail;

          this.errorMessage.set(
            typeof detail === 'string' && detail.trim().length > 0
              ? detail
              : 'Impossible de récupérer les images.',
          );
        },
      });
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
