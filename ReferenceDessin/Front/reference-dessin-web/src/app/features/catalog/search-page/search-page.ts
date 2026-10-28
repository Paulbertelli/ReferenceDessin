import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { ReferenceCard } from '../../../shared/reference-card/reference-card';
import { ReferenceSelectionStore } from '../../selection/reference-selection-store';
import { SelectionLauncher } from '../../selection/selection-launcher/selection-launcher';
import { PexelsSearchStore } from '../pexels/pexels-search-store';

@Component({
  selector: 'app-search-page',
  imports: [FormsModule, ReferenceCard, SelectionLauncher],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPage {
  protected readonly searchStore = inject(PexelsSearchStore);

  protected readonly selectionStore = inject(ReferenceSelectionStore);

  protected searchTerm = '';

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    let initialized = false;

    this.route.queryParamMap
      .pipe(
        map((parameters) => parameters.get('q')?.trim() ?? ''),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((query) => {
        this.searchTerm = query;

        if (query || initialized || !this.searchStore.hasSearched()) {
          this.searchStore.search(query);
        }

        initialized = true;
      });
  }

  protected search(): void {
    const query = this.searchTerm.trim();

    const currentQuery = this.route.snapshot.queryParamMap.get('q')?.trim() ?? '';

    if (query === currentQuery) {
      this.searchStore.search(query);
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: query ? { q: query } : {},
      replaceUrl: true,
    });
  }

  protected toggleSelection(image: ReferenceImage): void {
    this.selectionStore.toggle(image);
  }

  protected selectAllDisplayed(): void {
    this.selectionStore.addAll(this.searchStore.images());
  }
}