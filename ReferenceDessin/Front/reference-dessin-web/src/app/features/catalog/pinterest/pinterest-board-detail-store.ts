import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, forkJoin, map, of, Subscription, switchMap } from 'rxjs';
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

  private readonly loadingState = signal(false);

  private readonly errorMessage = signal('');

  private activeRequest?: Subscription;

  private currentRequestId = 0;

  readonly boardId = this.boardIdentifier.asReadonly();

  readonly sections = this.sectionItems.asReadonly();

  readonly images = this.referenceImages.asReadonly();

  readonly totalImageCount = this.totalImageCountState.asReadonly();

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
    this.boardImagesState.set([]);
    this.sectionImagesState.set({});
    this.totalImageCountState.set(0);

    this.loadingState.set(true);
    this.errorMessage.set('');

    this.activeRequest = forkJoin({
      sections: this.pinterestApi.getBoardSections(normalizedBoardId),
      images: this.pinterestApi.getBoardImages(normalizedBoardId),
    })
      .pipe(
        switchMap(({ sections, images }) => {
          if (sections.length === 0) {
            return of({
              sections,
              images,
              sectionImages: {} as Record<string, ReferenceImage[]>,
            });
          }

          const sectionRequests = sections.map((section) =>
            this.pinterestApi
              .getSectionImages(normalizedBoardId, section.id)
              .pipe(map((sectionImages) => [section.id, sectionImages] as const)),
          );

          return forkJoin(sectionRequests).pipe(
            map((entries) => ({
              sections,
              images,
              sectionImages: Object.fromEntries(entries) as Record<string, ReferenceImage[]>,
            })),
          );
        }),
        finalize(() => {
          if (requestId === this.currentRequestId) {
            this.loadingState.set(false);
          }
        }),
      )
      .subscribe({
        next: ({ sections, images, sectionImages }) => {
          if (requestId !== this.currentRequestId) {
            return;
          }

          this.sectionItems.set(sections);

          this.boardImagesState.set(images);
          this.referenceImages.set(images);

          this.sectionImagesState.set(sectionImages);

          this.totalImageCountState.set(images.length);
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
    const normalizedSectionId = sectionId?.trim() || null;

    if (normalizedSectionId === this.selectedSectionIdentifier()) {
      return;
    }

    this.selectedSectionIdentifier.set(normalizedSectionId);

    this.errorMessage.set('');

    const images = normalizedSectionId
      ? (this.sectionImagesState()[normalizedSectionId] ?? [])
      : this.boardImagesState();

    this.referenceImages.set(images);
  }

  sectionImageCount(sectionId: string): number {
    return this.sectionImagesState()[sectionId]?.length ?? 0;
  }

  private getErrorMessage(response: HttpErrorResponse): string {
    const detail = response.error?.detail;

    return typeof detail === 'string' && detail.trim().length > 0
      ? detail
      : 'Impossible de récupérer cette collection Pinterest.';
  }
}