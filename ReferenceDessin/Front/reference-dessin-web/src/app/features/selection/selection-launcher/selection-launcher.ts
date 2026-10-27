import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DrawingSessionStore } from '../../drawing-session/drawing-session-store';
import { ReferenceSelectionStore } from '../reference-selection-store';

@Component({
  selector: 'app-selection-launcher',
  imports: [RouterLink],
  templateUrl: './selection-launcher.html',
  styleUrl: './selection-launcher.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionLauncher {
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