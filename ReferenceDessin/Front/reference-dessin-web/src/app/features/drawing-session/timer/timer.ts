import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucidePause, LucidePlay, LucideRotateCcw } from '@lucide/angular';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [FormsModule, LucidePause, LucidePlay, LucideRotateCcw],
  templateUrl: './timer.html',
  styleUrl: './timer.scss',
})
export class Timer {
  readonly running = input.required<boolean>();
  readonly disabled = input.required<boolean>();
  readonly formattedTime = input.required<string>();
  readonly progress = input.required<number>();

  readonly durationMinutes = model.required<number>();

  readonly toggleRequested = output<void>();
  readonly resetRequested = output<void>();

  protected updateDuration(value: number): void {
    this.durationMinutes.set(Number(value));
  }
}
