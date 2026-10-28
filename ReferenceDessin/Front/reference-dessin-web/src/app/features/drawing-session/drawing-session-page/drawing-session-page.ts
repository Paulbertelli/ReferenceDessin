import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronLeft, LucideImages, LucidePencil, LucideSearch } from '@lucide/angular';
import { DrawingSession } from '../drawing-session';
import { DrawingSessionStore } from '../drawing-session-store';

@Component({
  selector: 'app-drawing-session-page',
  imports: [
    RouterLink,
    DrawingSession,
    LucideChevronLeft,
    LucideImages,
    LucidePencil,
    LucideSearch,
  ],
  templateUrl: './drawing-session-page.html',
  styleUrl: './drawing-session-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingSessionPage {
  protected readonly sessionStore = inject(DrawingSessionStore);
}