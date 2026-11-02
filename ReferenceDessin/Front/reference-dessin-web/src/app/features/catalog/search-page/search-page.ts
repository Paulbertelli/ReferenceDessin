import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { LucidePlus, LucideX } from '@lucide/angular';
import { distinctUntilChanged, map } from 'rxjs';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { PageHeader } from '../../../shared/page-header/page-header';
import { PageState } from '../../../shared/page-state/page-state';
import { ReferenceCard } from '../../../shared/reference-card/reference-card';
import { ReferenceSelectionStore } from '../../selection/reference-selection-store';
import { SelectionLauncher } from '../../selection/selection-launcher/selection-launcher';
import { PexelsSearchStore } from '../pexels/pexels-search-store';

@Component({
  selector: 'app-search-page',
  imports: [PageHeader, PageState, ReferenceCard, SelectionLauncher, LucidePlus, LucideX],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPage {
  protected readonly searchStore = inject(PexelsSearchStore);
  protected readonly selectionStore = inject(ReferenceSelectionStore);

  protected readonly searchTerm = signal('');

  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly displayedImages = computed(() => this.searchStore.images());

  constructor() {
    let initialized = false;

    this.route.queryParamMap
      .pipe(
        map((parameters) => parameters.get('q')?.trim() ?? ''),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((query) => {
        this.searchTerm.set(query);

        if (query || initialized || !this.searchStore.hasSearched()) {
          this.searchStore.search(query);
        }

        initialized = true;
      });
  }

  protected retrySearch(): void {
    this.searchStore.search(this.searchTerm());
  }

  protected toggleSelection(image: ReferenceImage): void {
    this.selectionStore.toggle(image);
  }

  protected selectAllDisplayed(): void {
    this.selectionStore.addAll(this.displayedImages());
  }

  protected deselectAllDisplayed(): void {
    this.selectionStore.removeAll(this.displayedImages());
  }

  protected readonly allDisplayedSelected = computed(() => {
    const images = this.displayedImages();

    return images.length > 0 && images.every((image) => this.selectionStore.isSelected(image));
  });

  protected readonly hasDisplayedSelection = computed(() =>
    this.displayedImages().some((image) => this.selectionStore.isSelected(image)),
  );

  protected readonly resultSubtitle = computed(() => {
    if (this.searchStore.loading()) {
      return 'Recherche en cours…';
    }

    if (this.searchStore.error()) {
      return 'Résultats indisponibles';
    }

    const count = this.searchStore.images().length;

    return `${count} ${count === 1 ? 'référence' : 'références'}`;
  });

  protected readonly emptyStateTitle = computed(() =>
    this.searchTerm() ? 'Aucune référence trouvée' : 'Aucune référence disponible',
  );

  protected readonly emptyStateMessage = computed(() =>
    this.searchTerm()
      ? 'Essayez un autre thème ou une recherche plus générale.'
      : 'Aucune référence ne peut être proposée pour le moment.',
  );
}