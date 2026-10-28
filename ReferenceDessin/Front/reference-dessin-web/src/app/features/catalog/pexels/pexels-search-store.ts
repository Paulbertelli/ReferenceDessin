import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, Subscription } from 'rxjs';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { PexelsApi } from './pexels-api';

@Injectable({
  providedIn: 'root',
})
export class PexelsSearchStore {
  private readonly pexelsApi = inject(PexelsApi);

  private readonly resultImages = signal<ReferenceImage[]>([]);

  private readonly loadingState = signal(false);
  private readonly errorMessage = signal('');
  private readonly searchedState = signal(false);

  private activeRequest?: Subscription;
  private currentRequestId = 0;

  readonly images = this.resultImages.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorMessage.asReadonly();
  readonly hasSearched = this.searchedState.asReadonly();

  readonly noResults = computed(
    () => this.hasSearched() && !this.loading() && !this.error() && this.images().length === 0,
  );

  search(searchTerm: string = '', count: number = 30): void {
    const requestId = ++this.currentRequestId;

    this.activeRequest?.unsubscribe();

    this.loadingState.set(true);
    this.errorMessage.set('');
    this.searchedState.set(false);
    this.resultImages.set([]);

    this.activeRequest = this.pexelsApi
      .searchReferenceImages(searchTerm, count)
      .pipe(
        finalize(() => {
          if (requestId === this.currentRequestId) {
            this.loadingState.set(false);
          }
        }),
      )
      .subscribe({
        next: (images) => {
          if (requestId !== this.currentRequestId) {
            return;
          }

          this.resultImages.set(images);
          this.searchedState.set(true);
        },
        error: (response: HttpErrorResponse) => {
          if (requestId !== this.currentRequestId) {
            return;
          }

          const detail = response.error?.detail;

          this.errorMessage.set(
            typeof detail === 'string' && detail.trim().length > 0
              ? detail
              : 'Impossible de récupérer les références.',
          );

          this.searchedState.set(true);
        },
      });
  }
}