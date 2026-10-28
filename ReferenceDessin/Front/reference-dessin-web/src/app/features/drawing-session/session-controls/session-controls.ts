import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { Timer } from '../timer/timer';

@Component({
  selector: 'app-session-controls',
  imports: [Timer, LucideChevronLeft, LucideChevronRight],
  templateUrl: './session-controls.html',
  styleUrl: './session-controls.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionControls {
  readonly previewImages = input.required<readonly ReferenceImage[]>();

  readonly totalImages = input.required<number>();

  readonly nextImage = input<ReferenceImage | null>(null);

  readonly hasPrevious = input.required<boolean>();

  readonly hasNext = input.required<boolean>();

  readonly running = input.required<boolean>();

  readonly disabled = input.required<boolean>();

  readonly formattedTime = input.required<string>();

  readonly progress = input.required<number>();

  readonly durationMinutes = model.required<number>();

  readonly previousRequested = output<void>();

  readonly nextRequested = output<void>();

  readonly toggleTimerRequested = output<void>();

  readonly resetTimerRequested = output<void>();
}