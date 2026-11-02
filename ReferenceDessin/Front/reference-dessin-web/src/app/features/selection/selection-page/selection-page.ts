import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucidePlus, LucideTrash2 } from '@lucide/angular';
import { PageHeader } from '../../../shared/page-header/page-header';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { ReferenceCard } from '../../../shared/reference-card/reference-card';
import { ReferenceSelectionStore } from '../reference-selection-store';
import { SelectionLauncher } from '../selection-launcher/selection-launcher';
import { ContentHeader } from '../../../shared/content-header/content-header';
import { AuthenticationStore } from '../../account/authentication-store';

@Component({
  selector: 'app-selection-page',
  imports: [
    RouterLink,
    LucidePlus,
    LucideTrash2,
    PageHeader,
    ContentHeader,
    ReferenceCard,
    SelectionLauncher,
  ],
  templateUrl: './selection-page.html',
  styleUrl: './selection-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionPage {
  protected readonly selectionStore = inject(ReferenceSelectionStore);
  private readonly authenticationStore = inject(AuthenticationStore);

  protected readonly isSignedIn = computed(
    () => this.authenticationStore.state()?.status === 'signedIn',
  );

  protected remove(image: ReferenceImage): void {
    this.selectionStore.remove(image);
  }

  protected clear(): void {
    this.selectionStore.clear();
  }
}