import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReferenceImage } from '../models/reference-image';
import { LucideTrash2 } from '@lucide/angular';

@Component({
  selector: 'app-reference-card',
  imports: [LucideTrash2],
  templateUrl: './reference-card.html',
  styleUrl: './reference-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenceCard {
  readonly image = input.required<ReferenceImage>();

  readonly selected = input(false);

  readonly action = input<'select' | 'remove'>('select');

  readonly selectionRequested = output<ReferenceImage>();

  protected toggleSelection(): void {
    this.selectionRequested.emit(this.image());
  }
}