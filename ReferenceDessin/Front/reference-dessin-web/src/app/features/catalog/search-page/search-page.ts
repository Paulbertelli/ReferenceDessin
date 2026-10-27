import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PexelsSearchStore } from '../pexels/pexels-search-store';
import { ReferenceSelectionStore } from '../../selection/reference-selection-store';
import { ReferenceCard } from '../../../shared/reference-card/reference-card';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { SelectionLauncher } from '../../selection/selection-launcher/selection-launcher';

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

  constructor() {
    if (!this.searchStore.hasSearched()) {
      this.searchStore.search();
    }
  }

  protected search(): void {
    this.searchStore.search(this.searchTerm);
  }

  protected toggleSelection(image: ReferenceImage): void {
    this.selectionStore.toggle(image);
  }

  protected selectAllDisplayed(): void {
    this.selectionStore.addAll(this.searchStore.images());
  }
}