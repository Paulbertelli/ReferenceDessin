import {
  Component,
  computed,
  effect,
  HostListener,
  inject,
  OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ReferenceImage } from './features/drawing-session/reference-image';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideSearch,
  LucideMaximize2,
  LucideX,
} from '@lucide/angular';
import { Timer } from './features/drawing-session/timer/timer';
import { AuthenticationStore } from './features/account/authentication-store';
import { DrawingSessionStore } from './features/drawing-session/drawing-session-store';
import { NotificationBanner } from './shared/notification/notification-banner';
import { AccountDeletionConfirmation } from './features/account/account-deletion-confirmation/account-deletion-confirmation';

@Component({
  imports: [
    FormsModule,
    Timer,
    NotificationBanner,
    LucideChevronLeft,
    LucideChevronRight,
    LucideSearch,
    LucideMaximize2,
    LucideX,
    AccountDeletionConfirmation,
  ],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnDestroy {
  protected readonly authenticationStore = inject(AuthenticationStore);
  protected readonly drawingSessionStore = inject(DrawingSessionStore);
  protected readonly photos = this.drawingSessionStore.images;

  protected readonly currentIndex = this.drawingSessionStore.currentIndex;

  protected readonly loading = this.drawingSessionStore.loading;

  protected readonly error = this.drawingSessionStore.error;

  protected readonly currentPhoto = this.drawingSessionStore.currentImage;

  protected readonly confirmationSuppressionCompteOuverte = signal(false);

  protected searchQuery = '';

  constructor() {
    this.authenticationStore.loadAccount();
    this.drawingSessionStore.search();
  }

  protected openAccountDeletionConfirmation(): void {
    this.confirmationSuppressionCompteOuverte.set(true);
  }

  protected cancelAccountDeletion(): void {
    this.confirmationSuppressionCompteOuverte.set(false);
  }

  protected confirmAccountDeletion(): void {
    this.confirmationSuppressionCompteOuverte.set(false);

    this.authenticationStore.deleteAccount();
  }

  protected search(): void {
    this.drawingSessionStore.search(this.searchQuery);
  }

  protected previous(): void {
    if (!this.drawingSessionStore.hasPrevious()) {
      return;
    }

    this.drawingSessionStore.selectPrevious();
    this.loadSelectedImage();
    this.restartTimerForCurrentPhoto();
  }

  protected next(): void {
    if (!this.drawingSessionStore.hasNext()) {
      return;
    }

    this.drawingSessionStore.selectNext();
    this.loadSelectedImage();
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

  private readonly imagesChangedEffect = effect(() => {
    const images = this.drawingSessionStore.images();

    untracked(() => {
      this.handleImagesChanged(images);
    });
  });

  private handleImagesChanged(images: ReferenceImage[]): void {
    this.imageRequestId++;

    this.displayedPhoto.set(null);
    this.displayedIndex.set(0);
    this.imageLoading.set(false);
    this.imageError.set(false);

    this.preloadedImages.clear();
    this.resetTimer();

    if (images.length > 0) {
      this.loadSelectedImage();
    }
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

    const seconds = (remaining % 60).toString().padStart(2, '0');

    return `${minutes}:${seconds}`;
  });

  protected readonly timerProgress = computed(() => {
    const total = this.getDurationInSeconds();

    if (total === 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, (this.remainingSeconds() / total) * 100));
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
        this.remainingSeconds.update((value) => value - 1);
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
    if (!this.drawingSessionStore.hasNext()) {
      this.remainingSeconds.set(0);
      this.stopTimer();
      return;
    }

    this.drawingSessionStore.selectNext();
    this.loadSelectedImage();
    this.remainingSeconds.set(this.getDurationInSeconds());
  }

  private getDurationInSeconds(): number {
    const duration = Number(this.durationMinutes);

    if (!Number.isFinite(duration)) {
      return 120;
    }

    const safeDuration = Math.min(60, Math.max(0.1, duration));

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
    if (this.displayedPhoto()) {
      this.imageExpanded.set(true);
    }
  }

  protected closeImageOverlay(): void {
    this.imageExpanded.set(false);
  }

  // état pour le chargement
  protected readonly displayedPhoto = signal<ReferenceImage | null>(null);
  protected readonly displayedIndex = signal(0);
  protected readonly imageLoading = signal(false);
  protected readonly imageError = signal(false);

  private imageRequestId = 0;

  private readonly preloadedImages = new Map<string, HTMLImageElement>();

  private loadSelectedImage(): void {
    const photo = this.currentPhoto();

    if (!photo) {
      this.displayedPhoto.set(null);
      this.imageLoading.set(false);
      return;
    }

    const requestedIndex = this.currentIndex();
    const requestId = ++this.imageRequestId;
    const cachedImage = this.preloadedImages.get(photo.imageUrl);
    const image = cachedImage ?? new Image();

    this.imageLoading.set(true);
    this.imageError.set(false);

    const handleSuccess = (): void => {
      if (requestId !== this.imageRequestId) {
        return;
      }

      this.displayedPhoto.set(photo);
      this.displayedIndex.set(requestedIndex);
      this.imageLoading.set(false);
      this.imageError.set(false);

      this.preloadNextImage(requestedIndex);
    };

    const handleError = (): void => {
      if (requestId !== this.imageRequestId) {
        return;
      }

      this.preloadedImages.delete(photo.imageUrl);
      this.imageLoading.set(false);
      this.imageError.set(true);
    };

    image.onload = handleSuccess;
    image.onerror = handleError;

    if (cachedImage) {
      if (image.complete) {
        if (image.naturalWidth > 0) {
          handleSuccess();
        } else {
          handleError();
        }
      }

      return;
    }

    image.decoding = 'async';
    image.src = photo.imageUrl;
  }

  private preloadNextImage(currentIndex: number): void {
    const nextPhoto = this.drawingSessionStore.images()[currentIndex + 1];

    if (!nextPhoto || this.preloadedImages.has(nextPhoto.imageUrl)) {
      return;
    }

    const image = new Image();

    image.decoding = 'async';

    image.onload = () => {
      this.preloadedImages.set(nextPhoto.imageUrl, image);
    };

    image.onerror = () => {
      this.preloadedImages.delete(nextPhoto.imageUrl);
    };

    image.src = nextPhoto.imageUrl;

    this.preloadedImages.set(nextPhoto.imageUrl, image);
  }

  protected retryCurrentImage(): void {
    const photo = this.currentPhoto();

    if (!photo) {
      return;
    }

    this.preloadedImages.delete(photo.imageUrl);
    this.loadSelectedImage();
  }

  protected skipCurrentImage(): void {
    if (this.drawingSessionStore.hasNext()) {
      this.next();
    }
  }
}
