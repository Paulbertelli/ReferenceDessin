import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
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

  private readonly boardImagesState = signal<ReferenceImage[]>([]);

  private readonly sectionImagesState = signal<Record<string, ReferenceImage[]>>({});

  private readonly totalImageCountState = signal(0);

  private readonly selectedSectionIdentifier = signal<string | null>(null);

  private readonly initialLoadingState = signal(false);

  private readonly sectionLoadingState = signal(false);

  private readonly errorMessage = signal('');

  private activeLoadRequest?: Subscription;

  private activeSectionRequest?: Subscription;

  private currentLoadRequestId = 0;

  private currentSectionRequestId = 0;

  readonly boardId = this.boardIdentifier.asReadonly();

  readonly sections = this.sectionItems.asReadonly();

  readonly images = this.referenceImages.asReadonly();

  readonly totalImageCount = this.totalImageCountState.asReadonly();

  readonly selectedSectionId = this.selectedSectionIdentifier.asReadonly();

  readonly initialLoading = this.initialLoadingState.asReadonly();

  readonly sectionLoading = this.sectionLoadingState.asReadonly();

  readonly loading = computed(() => this.initialLoading() || this.sectionLoading());

  readonly error = this.errorMessage.asReadonly();

  load(boardId: string): void {
    const normalizedBoardId = boardId.trim();

    if (!normalizedBoardId) {
      this.errorMessage.set('L’identifiant de la collection est invalide.');

      return;
    }

    const requestId = ++this.currentLoadRequestId;

    this.currentSectionRequestId++;

    this.activeLoadRequest?.unsubscribe();
    this.activeSectionRequest?.unsubscribe();

    this.boardIdentifier.set(normalizedBoardId);
    this.selectedSectionIdentifier.set(null);

    this.sectionItems.set([]);
    this.referenceImages.set([]);
    this.boardImagesState.set([]);
    this.sectionImagesState.set({});
    this.totalImageCountState.set(0);

    this.initialLoadingState.set(true);
    this.sectionLoadingState.set(false);
    this.errorMessage.set('');

    this.activeLoadRequest = forkJoin({
      sections: this.pinterestApi.getBoardSections(normalizedBoardId),
      images: this.pinterestApi.getBoardImages(normalizedBoardId),
    })
      .pipe(
        finalize(() => {
          if (requestId === this.currentLoadRequestId) {
            this.initialLoadingState.set(false);
          }
        }),
      )
      .subscribe({
        next: ({ sections, images }) => {
          if (requestId !== this.currentLoadRequestId) {
            return;
          }

          this.sectionItems.set(sections);

          this.boardImagesState.set(images);
          this.referenceImages.set(images);

          this.totalImageCountState.set(images.length);
        },
        error: (response: HttpErrorResponse) => {
          if (requestId !== this.currentLoadRequestId) {
            return;
          }

          this.errorMessage.set(this.getErrorMessage(response));
        },
      });
  }

  selectSection(sectionId: string | null, force: boolean = false): void {
    const normalizedSectionId = sectionId?.trim() || null;

    if (normalizedSectionId === this.selectedSectionIdentifier() && !force) {
      return;
    }

    this.currentSectionRequestId++;
    this.activeSectionRequest?.unsubscribe();

    this.selectedSectionIdentifier.set(normalizedSectionId);

    this.sectionLoadingState.set(false);
    this.errorMessage.set('');

    if (normalizedSectionId === null) {
      this.referenceImages.set(this.boardImagesState());

      return;
    }

    const cachedSectionImages = this.sectionImagesState();

    if (!force && Object.prototype.hasOwnProperty.call(cachedSectionImages, normalizedSectionId)) {
      this.referenceImages.set(cachedSectionImages[normalizedSectionId]);

      return;
    }

    const boardId = this.boardIdentifier();

    if (boardId === null) {
      this.referenceImages.set([]);
      return;
    }

    const requestId = this.currentSectionRequestId;

    this.referenceImages.set([]);
    this.sectionLoadingState.set(true);

    this.activeSectionRequest = this.pinterestApi
      .getSectionImages(boardId, normalizedSectionId)
      .pipe(
        finalize(() => {
          if (requestId === this.currentSectionRequestId) {
            this.sectionLoadingState.set(false);
          }
        }),
      )
      .subscribe({
        next: (images) => {
          if (
            requestId !== this.currentSectionRequestId ||
            normalizedSectionId !== this.selectedSectionIdentifier()
          ) {
            return;
          }

          this.sectionImagesState.update((currentImages) => ({
            ...currentImages,
            [normalizedSectionId]: images,
          }));

          this.referenceImages.set(images);
        },
        error: (response: HttpErrorResponse) => {
          if (requestId !== this.currentSectionRequestId) {
            return;
          }

          this.errorMessage.set(this.getErrorMessage(response));
        },
      });
  }

  sectionImageCount(sectionId: string): number {
    const section = this.sectionItems().find((candidate) => candidate.id === sectionId);

    return section?.referenceCount ?? 0;
  }

  retrySelectedSection(): void {
    const sectionId = this.selectedSectionIdentifier();

    if (sectionId === null) {
      const boardId = this.boardIdentifier();

      if (boardId !== null) {
        this.load(boardId);
      }

      return;
    }

    this.selectSection(sectionId, true);
  }

  private getErrorMessage(response: HttpErrorResponse): string {
    const detail = response.error?.detail;

    return typeof detail === 'string' && detail.trim().length > 0
      ? detail
      : 'Impossible de récupérer cette collection Pinterest.';
  }
}