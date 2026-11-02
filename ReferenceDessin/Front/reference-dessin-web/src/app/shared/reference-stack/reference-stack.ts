import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ReferenceImage } from '../models/reference-image';

@Component({
  selector: 'app-reference-stack',
  templateUrl: './reference-stack.html',
  styleUrl: './reference-stack.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenceStack {
  readonly images = input.required<readonly ReferenceImage[]>();

  readonly total = input.required<number>();

  readonly displayedImages = computed(() => this.images().slice(-3));
}