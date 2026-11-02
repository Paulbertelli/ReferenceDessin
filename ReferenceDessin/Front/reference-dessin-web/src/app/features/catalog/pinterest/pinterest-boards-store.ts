import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { PinterestApi } from './pinterest-api';
import { PinterestBoard } from './pinterest-board';

@Injectable({
  providedIn: 'root',
})
export class PinterestBoardsStore {
  private readonly pinterestApi = inject(PinterestApi);

  private readonly boardItems = signal<PinterestBoard[]>([]);

  private readonly loadingState = signal(false);

  private readonly errorMessage = signal('');

  private readonly loadedState = signal(false);

  readonly boards = this.boardItems.asReadonly();

  readonly loading = this.loadingState.asReadonly();

  readonly error = this.errorMessage.asReadonly();

  readonly loaded = this.loadedState.asReadonly();

  load(force: boolean = false): void {
    if (this.loadingState() || (this.loadedState() && !force)) {
      return;
    }

    this.loadingState.set(true);
    this.errorMessage.set('');

    this.pinterestApi
      .getBoards()
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (boards) => {
          this.boardItems.set(boards);
          this.loadedState.set(true);
        },
        error: (response: HttpErrorResponse) => {
          const detail = response.error?.detail;

          if (typeof detail === 'string' && detail.trim().length > 0) {
            this.errorMessage.set(detail);
          } else if (response.status === 0) {
            this.errorMessage.set('Vérifiez votre connexion internet, puis réessayez.');
          } else {
            this.errorMessage.set('Le service Pinterest est temporairement indisponible.');
          }
        },
      });
  }
}