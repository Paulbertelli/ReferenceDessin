import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { PinterestApi } from './pinterest-api';

@Injectable({
  providedIn: 'root',
})
export class PinterestBoardPreviewsStore {
  private readonly pinterestApi = inject(PinterestApi);

  private readonly previewItems = signal<Record<string, ReferenceImage[]>>({});

  private readonly loadingBoardIds = signal<ReadonlySet<string>>(new Set());

  private readonly errorMessages = signal<Record<string, string>>({});

  imagesFor(boardId: string): ReferenceImage[] {
    return this.previewItems()[boardId] ?? [];
  }

  isLoading(boardId: string): boolean {
    return this.loadingBoardIds().has(boardId);
  }

  errorFor(boardId: string): string {
    return this.errorMessages()[boardId] ?? '';
  }

  load(boardId: string, force: boolean = false): void {
    const normalizedBoardId = boardId.trim();

    if (normalizedBoardId.length === 0 || this.isLoading(normalizedBoardId)) {
      return;
    }

    const alreadyLoaded = Object.prototype.hasOwnProperty.call(
      this.previewItems(),
      normalizedBoardId,
    );

    if (alreadyLoaded && !force) {
      return;
    }

    this.setLoading(normalizedBoardId, true);
    this.setError(normalizedBoardId, '');

    this.pinterestApi
      .getBoardPreviewImages(normalizedBoardId, 3)
      .pipe(finalize(() => this.setLoading(normalizedBoardId, false)))
      .subscribe({
        next: (images) => {
          this.previewItems.update((currentItems) => ({
            ...currentItems,
            [normalizedBoardId]: images,
          }));
        },
        error: (response: HttpErrorResponse) => {
          const detail = response.error?.detail;

          this.setError(
            normalizedBoardId,
            typeof detail === 'string' && detail.trim().length > 0
              ? detail
              : 'Aperçu indisponible.',
          );
        },
      });
  }

  private setLoading(boardId: string, loading: boolean): void {
    this.loadingBoardIds.update((currentIds) => {
      const updatedIds = new Set(currentIds);

      if (loading) {
        updatedIds.add(boardId);
      } else {
        updatedIds.delete(boardId);
      }

      return updatedIds;
    });
  }

  private setError(boardId: string, message: string): void {
    this.errorMessages.update((currentMessages) => ({
      ...currentMessages,
      [boardId]: message,
    }));
  }

  hasLoaded(boardId: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.previewItems(), boardId);
  }
}