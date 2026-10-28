import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucidePlay,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';
import {
  DrawingSessionOrder,
  DrawingSessionStore,
} from '../../drawing-session/drawing-session-store';
import { ReferenceSelectionStore } from '../../selection/reference-selection-store';
import { ReferenceImage } from '../../../shared/models/reference-image';

@Component({
  selector: 'app-home-session',
  imports: [
    FormsModule,
    RouterLink,
    LucideChevronLeft,
    LucideChevronRight,
    LucidePlay,
    LucideTrash2,
    LucideX,
  ],
  templateUrl: './home-session.html',
  styleUrl: './home-session.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSession {
  protected readonly selectionStore = inject(ReferenceSelectionStore);

  private readonly sessionStore = inject(DrawingSessionStore);

  private readonly router = inject(Router);

  private readonly selectionTrack = viewChild<ElementRef<HTMLElement>>('selectionTrack');

  protected readonly durationMinutes = signal(5);

  protected readonly sessionOrder = signal<DrawingSessionOrder>('sequential');

  protected readonly estimatedDuration = computed(() => {
    const totalMinutes = Math.round(this.selectionStore.count() * this.durationMinutes());

    if (totalMinutes < 60) {
      return `≈ ${totalMinutes} min`;
    }

    const hours = Math.floor(totalMinutes / 60);

    const minutes = totalMinutes % 60;

    return minutes === 0 ? `≈ ${hours} h` : `≈ ${hours} h ${minutes}`;
  });

  protected updateDuration(value: number): void {
    const duration = Number(value);

    if (!Number.isFinite(duration)) {
      return;
    }

    this.durationMinutes.set(Math.min(60, Math.max(0.5, duration)));
  }

  protected updateOrder(value: DrawingSessionOrder): void {
    this.sessionOrder.set(value);
  }

  protected removeImage(image: ReferenceImage): void {
    this.selectionStore.remove(image);
  }

  protected clearSelection(): void {
    this.selectionStore.clear();
  }

  protected scrollSelection(direction: -1 | 1): void {
    this.selectionTrack()?.nativeElement.scrollBy({
      left: direction * 420,
      behavior: 'smooth',
    });
  }

  protected launchSession(): void {
    const images = this.selectionStore.images();

    if (images.length === 0) {
      return;
    }

    this.sessionStore.start(images, {
      durationMinutes: this.durationMinutes(),
      order: this.sessionOrder(),
    });

    void this.router.navigate(['/session']);
  }
}