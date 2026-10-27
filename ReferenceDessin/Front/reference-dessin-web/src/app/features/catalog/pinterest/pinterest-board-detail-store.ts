import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, forkJoin, Subscription } from 'rxjs';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { PinterestApi } from './pinterest-api';
import { PinterestBoardSection } from './pinterest-board-section';

@Injectable()
export class PinterestBoardDetailStore {
  private readonly pinterestApi = inject(PinterestApi);

  private readonly boardIdentifier = signal<string | null>(null);

  private readonly sectionItems = signal<PinterestBoardSection[]>([]);

  private readonly referenceImages = signal<ReferenceImage[]>([]);

  private readonly selectedSectionIdentifier = signal<string | null>(null);

  private readonly loadingState = signal(false);
  private readonly errorMessage = signal('');

  private activeRequest?: Subscription;
  private currentRequestId = 0;

  readonly boardId = this.boardIdentifier.asReadonly();

  readonly sections = this.sectionItems.asReadonly();

  readonly images = this.referenceImages.asReadonly();

  readonly selectedSectionId = this.selectedSectionIdentifier.asReadonly();

  readonly loading = this.loadingState.asReadonly();

  readonly error = this.errorMessage.asReadonly();

  load(boardId: string): void {
    const normalizedBoardId = boardId.trim();

    if (!normalizedBoardId) {
      this.errorMessage.set('L’identifiant de la collection est invalide.');

      return;
    }

    const requestId = ++this.currentRequestId;

    this.activeRequest?.unsubscribe();

    this.boardIdentifier.set(normalizedBoardId);
    this.selectedSectionIdentifier.set(null);
    this.sectionItems.set([]);
    this.referenceImages.set([]);
    this.loadingState.set(true);
    this.errorMessage.set('');

    this.activeRequest = forkJoin({
      sections: this.pinterestApi.getBoardSections(normalizedBoardId),
      images: this.pinterestApi.getBoardImages(normalizedBoardId),
    })
      .pipe(
        finalize(() => {
          if (requestId === this.currentRequestId) {
            this.loadingState.set(false);
          }
        }),
      )
      .subscribe({
        next: ({ sections, images }) => {
          if (requestId !== this.currentRequestId) {
            return;
          }

          this.sectionItems.set(sections);
          this.referenceImages.set(images);
        },
        error: (response: HttpErrorResponse) => {
          if (requestId !== this.currentRequestId) {
            return;
          }

          this.errorMessage.set(this.getErrorMessage(response));
        },
      });
  }

  selectSection(sectionId: string | null): void {
    const boardId = this.boardIdentifier();

    if (!boardId) {
      return;
    }

    const normalizedSectionId = sectionId?.trim() || null;

    if (normalizedSectionId === this.selectedSectionIdentifier()) {
      return;
    }

    const requestId = ++this.currentRequestId;

    this.activeRequest?.unsubscribe();

    this.selectedSectionIdentifier.set(normalizedSectionId);

    this.referenceImages.set([]);
    this.loadingState.set(true);
    this.errorMessage.set('');

    const request = normalizedSectionId
      ? this.pinterestApi.getSectionImages(boardId, normalizedSectionId)
      : this.pinterestApi.getBoardImages(boardId);

    this.activeRequest = request
      .pipe(
        finalize(() => {
          if (requestId === this.currentRequestId) {
            this.loadingState.set(false);
          }
        }),
      )
      .subscribe({
        next: (images) => {
          if (requestId === this.currentRequestId) {
            this.referenceImages.set(images);
          }
        },
        error: (response: HttpErrorResponse) => {
          if (requestId === this.currentRequestId) {
            this.errorMessage.set(this.getErrorMessage(response));
          }
        },
      });
  }

  private getErrorMessage(response: HttpErrorResponse): string {
    const detail = response.error?.detail;

    return typeof detail === 'string' && detail.trim().length > 0
      ? detail
      : 'Impossible de récupérer cette collection Pinterest.';
  }
}