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
import { LucideChevronLeft, LucideChevronRight, LucideMaximize2, LucideX } from '@lucide/angular';
import { DrawingSessionStore } from './drawing-session-store';
import { ReferenceImage } from './reference-image';
import { Timer } from './timer/timer';

@Component({
  selector: 'app-drawing-session',
  imports: [Timer, LucideChevronLeft, LucideChevronRight, LucideMaximize2, LucideX],
  templateUrl: './drawing-session.html',
  styleUrl: './drawing-session.scss',
})
export class DrawingSession implements OnDestroy {
  protected readonly store = inject(DrawingSessionStore);

  protected durationMinutes = 2;

  protected readonly remainingSeconds = signal(120);
  protected readonly timerRunning = signal(false);

  protected readonly displayedImage = signal<ReferenceImage | null>(null);

  protected readonly displayedIndex = signal(0);
  protected readonly imageLoading = signal(false);
  protected readonly imageError = signal(false);
  protected readonly imageExpanded = signal(false);

  private timerId?: ReturnType<typeof setInterval>;
  private imageRequestId = 0;

  private readonly preloadedImages = new Map<string, HTMLImageElement>();

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

  private readonly imagesChangedEffect = effect(() => {
    const images = this.store.images();

    untracked(() => {
      this.handleImagesChanged(images);
    });
  });

  protected previous(): void {
    if (!this.store.hasPrevious()) {
      return;
    }

    this.store.selectPrevious();
    this.loadSelectedImage();
    this.restartTimerForCurrentImage();
  }

  protected next(): void {
    if (!this.store.hasNext()) {
      return;
    }

    this.store.selectNext();
    this.loadSelectedImage();
    this.restartTimerForCurrentImage();
  }

  protected toggleTimer(): void {
    if (this.timerRunning()) {
      this.stopTimer();
      return;
    }

    this.startTimer();
  }

  protected resetTimer(): void {
    this.stopTimer();

    this.remainingSeconds.set(this.getDurationInSeconds());
  }

  protected openImageOverlay(): void {
    if (this.displayedImage()) {
      this.imageExpanded.set(true);
    }
  }

  protected closeImageOverlay(): void {
    this.imageExpanded.set(false);
  }

  protected retryCurrentImage(): void {
    const image = this.store.currentImage();

    if (!image) {
      return;
    }

    this.preloadedImages.delete(image.imageUrl);
    this.loadSelectedImage();
  }

  protected skipCurrentImage(): void {
    if (this.store.hasNext()) {
      this.next();
    }
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

  ngOnDestroy(): void {
    this.stopTimer();
    this.imageRequestId++;
    this.preloadedImages.clear();
  }

  private handleImagesChanged(images: ReferenceImage[]): void {
    this.imageRequestId++;

    this.displayedImage.set(null);
    this.displayedIndex.set(0);
    this.imageLoading.set(false);
    this.imageError.set(false);
    this.imageExpanded.set(false);

    this.preloadedImages.clear();
    this.resetTimer();

    if (images.length > 0) {
      this.loadSelectedImage();
    }
  }

  private restartTimerForCurrentImage(): void {
    const shouldContinue = this.timerRunning();

    this.stopTimer();

    this.remainingSeconds.set(this.getDurationInSeconds());

    if (shouldContinue) {
      this.startTimer();
    }
  }

  private startTimer(): void {
    if (!this.store.currentImage()) {
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

      this.moveToNextImageAutomatically();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== undefined) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }

    this.timerRunning.set(false);
  }

  private moveToNextImageAutomatically(): void {
    if (!this.store.hasNext()) {
      this.remainingSeconds.set(0);
      this.stopTimer();
      return;
    }

    this.store.selectNext();
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

  private loadSelectedImage(): void {
    const referenceImage = this.store.currentImage();

    if (!referenceImage) {
      this.displayedImage.set(null);
      this.imageLoading.set(false);
      return;
    }

    const requestedIndex = this.store.currentIndex();
    const requestId = ++this.imageRequestId;

    const cachedImage = this.preloadedImages.get(referenceImage.imageUrl);

    const browserImage = cachedImage ?? new Image();

    this.imageLoading.set(true);
    this.imageError.set(false);

    const handleSuccess = (): void => {
      if (requestId !== this.imageRequestId) {
        return;
      }

      this.displayedImage.set(referenceImage);
      this.displayedIndex.set(requestedIndex);
      this.imageLoading.set(false);
      this.imageError.set(false);

      this.preloadNextImage(requestedIndex);
    };

    const handleError = (): void => {
      if (requestId !== this.imageRequestId) {
        return;
      }

      this.preloadedImages.delete(referenceImage.imageUrl);

      this.imageLoading.set(false);
      this.imageError.set(true);
    };

    browserImage.onload = handleSuccess;
    browserImage.onerror = handleError;

    if (cachedImage) {
      if (browserImage.complete) {
        if (browserImage.naturalWidth > 0) {
          handleSuccess();
        } else {
          handleError();
        }
      }

      return;
    }

    browserImage.decoding = 'async';
    browserImage.src = referenceImage.imageUrl;
  }

  private preloadNextImage(currentIndex: number): void {
    const nextImage = this.store.images()[currentIndex + 1];

    if (!nextImage || this.preloadedImages.has(nextImage.imageUrl)) {
      return;
    }

    const browserImage = new Image();

    browserImage.decoding = 'async';

    browserImage.onload = () => {
      this.preloadedImages.set(nextImage.imageUrl, browserImage);
    };

    browserImage.onerror = () => {
      this.preloadedImages.delete(nextImage.imageUrl);
    };

    browserImage.src = nextImage.imageUrl;

    this.preloadedImages.set(nextImage.imageUrl, browserImage);
  }
}
