import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReferenceStack } from '../../../shared/reference-stack/reference-stack';
import { DrawingSessionStore } from '../../drawing-session/drawing-session-store';
import { ReferenceSelectionStore } from '../reference-selection-store';

export type SelectionLauncherDisplayMode = 'summary' | 'action-only';

@Component({
  selector: 'app-selection-launcher',
  imports: [RouterLink, ReferenceStack],
  templateUrl: './selection-launcher.html',
  styleUrl: './selection-launcher.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionLauncher {
  readonly displayMode = input<SelectionLauncherDisplayMode>('summary');

  protected readonly selectionStore = inject(ReferenceSelectionStore);

  private readonly drawingSessionStore = inject(DrawingSessionStore);

  private readonly router = inject(Router);

  protected launchSession(): void {
    const selectedImages = this.selectionStore.images();

    if (selectedImages.length === 0) {
      return;
    }

    this.drawingSessionStore.start(selectedImages);

    void this.router.navigate(['/session']);
  }
}