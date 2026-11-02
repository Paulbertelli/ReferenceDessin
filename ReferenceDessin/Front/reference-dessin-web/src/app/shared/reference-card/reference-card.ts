import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnChanges,
  output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { LucideExternalLink, LucideX } from '@lucide/angular';
import { ReferenceImage } from '../models/reference-image';

@Component({
  selector: 'app-reference-card',
  imports: [LucideExternalLink, LucideX],
  templateUrl: './reference-card.html',
  styleUrl: './reference-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenceCard implements OnChanges {
  readonly image = input.required<ReferenceImage>();

  readonly selected = input(false);

  readonly action = input<'select' | 'remove'>('select');

  readonly selectionRequested = output<ReferenceImage>();

  protected readonly imageLoading = signal(true);

  protected readonly imageError = signal(false);

  protected readonly providerLogo = computed((): string | null => {
    const sourceName = this.image().sourceName.trim().toLowerCase();

    switch (sourceName) {
      case 'pexels':
        return '/pexels-logo.png';

      case 'pinterest':
        return '/pinterest-logo.png';

      default:
        return null;
    }
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['image']) {
      return;
    }

    this.imageLoading.set(true);
    this.imageError.set(false);
  }

  protected handleImageLoaded(): void {
    this.imageLoading.set(false);
    this.imageError.set(false);
  }

  protected handleImageError(): void {
    this.imageLoading.set(false);
    this.imageError.set(true);
  }

  protected toggleSelection(): void {
    this.selectionRequested.emit(this.image());
  }
}