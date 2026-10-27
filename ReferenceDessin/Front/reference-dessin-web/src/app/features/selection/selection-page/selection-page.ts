import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { ReferenceCard } from '../../../shared/reference-card/reference-card';
import { ReferenceSelectionStore } from '../reference-selection-store';
import { SelectionLauncher } from '../selection-launcher/selection-launcher';

@Component({
  selector: 'app-selection-page',
  imports: [RouterLink, ReferenceCard, SelectionLauncher],
  templateUrl: './selection-page.html',
  styleUrl: './selection-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionPage {
  protected readonly selectionStore = inject(ReferenceSelectionStore);

  protected remove(image: ReferenceImage): void {
    this.selectionStore.remove(image);
  }

  protected clear(): void {
    this.selectionStore.clear();
  }
}