import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { LucideX } from '@lucide/angular';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { Timer } from '../timer/timer';

@Component({
  selector: 'app-session-overlay',
  imports: [Timer, LucideX],
  templateUrl: './session-overlay.html',
  styleUrl: './session-overlay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionOverlay {
  readonly image = input.required<ReferenceImage>();

  readonly nextImage = input<ReferenceImage | null>(null);

  readonly currentIndex = input.required<number>();

  readonly totalImages = input.required<number>();

  readonly running = input.required<boolean>();

  readonly formattedTime = input.required<string>();

  readonly progress = input.required<number>();

  readonly durationMinutes = model.required<number>();

  readonly closeRequested = output<void>();

  readonly nextRequested = output<void>();

  readonly toggleTimerRequested = output<void>();

  readonly resetTimerRequested = output<void>();
}