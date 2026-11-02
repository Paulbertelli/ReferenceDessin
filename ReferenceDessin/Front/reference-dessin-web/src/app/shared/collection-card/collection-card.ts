import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReferenceImage } from '../models/reference-image';

export type CollectionDisplayMode = 'compact' | 'detailed';

@Component({
  selector: 'app-collection-card',
  imports: [RouterLink],
  templateUrl: './collection-card.html',
  styleUrl: './collection-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionCard {
  readonly collectionId = input.required<string>();

  readonly collectionName = input.required<string>();

  readonly collectionDescription = input<string | null>(null);

  readonly images = input.required<readonly ReferenceImage[]>();

  readonly displayMode = input<CollectionDisplayMode>('compact');

  readonly loading = input(false);

  readonly error = input('');

  readonly retryRequested = output<void>();

  readonly referenceCount = input<number | null>(null);

  readonly sectionCount = input<number | null>(null);
}