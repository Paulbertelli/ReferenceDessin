import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PhotoReference } from './core/models/photo-reference.model';
import { PhotoService } from './core/services/photo.service';

@Component({
  imports: [FormsModule],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly photoService = inject(PhotoService);

  protected readonly photos = signal<PhotoReference[]>([]);
  protected readonly currentIndex = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected searchQuery = '';

  protected readonly currentPhoto = computed(
    () => this.photos()[this.currentIndex()] ?? null
  );

  constructor() {
    this.loadPhotos();
  }

  protected search(): void {
    this.loadPhotos(this.searchQuery);
  }

  protected previous(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(index => index - 1);
    }
  }

  protected next(): void {
    if (this.currentIndex() < this.photos().length - 1) {
      this.currentIndex.update(index => index + 1);
    }
  }

  private loadPhotos(query: string = ''): void {
    this.loading.set(true);
    this.error.set('');

    this.photoService
      .getPhotos(query)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: photos => {
          this.photos.set(photos);
          this.currentIndex.set(0);

          if (photos.length === 0) {
            this.error.set(
              'Aucune photo trouvée pour cette recherche.'
            );
          }
        },
        error: () => {
          this.error.set(
            'Impossible de récupérer les photos.'
          );
        }
      });
  }
}
