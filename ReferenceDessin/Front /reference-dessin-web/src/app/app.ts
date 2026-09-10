import { Component, computed, HostListener, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PhotoReference } from './core/models/photo-reference.model';
import { PhotoService } from './core/services/photo.service';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucidePause,
  LucidePlay,
  LucideRotateCcw,
  LucideSearch,
  LucideMaximize2,
  LucideX
} from '@lucide/angular';

@Component({
  imports: [
    FormsModule,
    LucideChevronLeft,
    LucideChevronRight,
    LucidePause,
    LucidePlay,
    LucideRotateCcw,
    LucideSearch,
    LucideMaximize2,
    LucideX
  ],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnDestroy {
  
  // Logique chargement images, précèdent/suivant
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
    if (this.currentIndex() === 0) {
      return;
    }

    this.currentIndex.update(index => index - 1);
    this.restartTimerForCurrentPhoto();
  }

  protected next(): void {
    if (this.currentIndex() >= this.photos().length - 1) {
      return;
    }

    this.currentIndex.update(index => index + 1);
    this.restartTimerForCurrentPhoto();
  }

  private restartTimerForCurrentPhoto(): void {
    const shouldContinue = this.timerRunning();

    this.stopTimer();
    this.remainingSeconds.set(this.getDurationInSeconds());

    if (shouldContinue) {
      this.startTimer();
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
          this.resetTimer();

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

  // Logique chronomètre 

  private timerId?: ReturnType<typeof setInterval>;

  protected durationMinutes = 2;

  protected readonly remainingSeconds = signal(120);
  protected readonly timerRunning = signal(false);

  protected readonly formattedTime = computed(() => {
    const remaining = this.remainingSeconds();
    const minutes = Math.floor(remaining / 60)
      .toString()
      .padStart(2, '0');

    const seconds = (remaining % 60)
      .toString()
      .padStart(2, '0');

    return `${minutes}:${seconds}`;
  });

  protected readonly timerProgress = computed(() => {
    const total = this.getDurationInSeconds();

    if (total === 0) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(100, (this.remainingSeconds() / total) * 100)
    );
  });

  protected toggleTimer(): void {
    if (this.timerRunning()) {
      this.stopTimer();
    } else {
      this.startTimer();
    }
  }

  protected resetTimer(): void {
    this.stopTimer();
    this.remainingSeconds.set(this.getDurationInSeconds());
  }

  private startTimer(): void {
    if (!this.currentPhoto()) {
      return;
    }

    if (this.remainingSeconds() <= 0) {
      this.remainingSeconds.set(this.getDurationInSeconds());
    }

    this.timerRunning.set(true);

    this.timerId = setInterval(() => {
      if (this.remainingSeconds() > 1) {
        this.remainingSeconds.update(value => value - 1);
        return;
      }

      this.moveToNextPhotoAutomatically();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== undefined) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }

    this.timerRunning.set(false);
  }

  private moveToNextPhotoAutomatically(): void {
    const hasNextPhoto =
      this.currentIndex() < this.photos().length - 1;

    if (!hasNextPhoto) {
      this.remainingSeconds.set(0);
      this.stopTimer();
      return;
    }

    this.currentIndex.update(index => index + 1);
    this.remainingSeconds.set(this.getDurationInSeconds());
  }

  private getDurationInSeconds(): number {
    const duration = Number(this.durationMinutes);

    if (!Number.isFinite(duration)) {
      return 120;
    }

    const safeDuration = Math.min(
      60,
      Math.max(0.1, duration)
    );

    return Math.round(safeDuration * 60);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  @HostListener('window:keydown', ['$event'])
  protected handleKeyboard(event: KeyboardEvent): void {

    if (event.key === 'Escape' && this.imageExpanded()) {
      this.closeImageOverlay();
      return;
    }
    
    const target = event.target as HTMLElement | null;

    if (target?.tagName === 'INPUT') {
      return;
    }

    if (event.key === 'ArrowLeft') {
      this.previous();
    }

    if (event.key === 'ArrowRight') {
      this.next();
    }

    if (event.code === 'Space') {
      event.preventDefault();
      this.toggleTimer();
    }
  }

  // Expenssion de l'image 

  protected readonly imageExpanded = signal(false);

  protected openImageOverlay(): void {
    if (this.currentPhoto()) {
      this.imageExpanded.set(true);
    }
  }

  protected closeImageOverlay(): void {
    this.imageExpanded.set(false);
  }
}
