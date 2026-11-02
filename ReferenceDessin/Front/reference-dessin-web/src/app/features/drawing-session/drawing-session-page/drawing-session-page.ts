import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronLeft, LucideImages, LucideSearch } from '@lucide/angular';
import { ReferenceSelectionStore } from '../../selection/reference-selection-store';
import { DrawingSession } from '../drawing-session';
import { DrawingSessionStore } from '../drawing-session-store';
import { AuthenticationStore } from '../../account/authentication-store';

@Component({
  selector: 'app-drawing-session-page',
  imports: [RouterLink, DrawingSession, LucideChevronLeft, LucideImages, LucideSearch],
  templateUrl: './drawing-session-page.html',
  styleUrl: './drawing-session-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingSessionPage {
  protected readonly sessionStore = inject(DrawingSessionStore);
  private readonly selectionStore = inject(ReferenceSelectionStore);
  private readonly authenticationStore = inject(AuthenticationStore);

  constructor() {
    if (this.sessionStore.images().length === 0 && !this.selectionStore.isEmpty()) {
      this.sessionStore.start(this.selectionStore.images());
    }
  }

  protected readonly isSignedIn = computed(
    () => this.authenticationStore.state()?.status === 'signedIn',
  );
}
