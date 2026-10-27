import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReferenceImage } from '../models/reference-image';

@Component({
  selector: 'app-reference-card',
  templateUrl: './reference-card.html',
  styleUrl: './reference-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenceCard {
  readonly image = input.required<ReferenceImage>();
  readonly selected = input(false);

  readonly selectionRequested = output<ReferenceImage>();

  protected toggleSelection(): void {
    this.selectionRequested.emit(this.image());
  }
}