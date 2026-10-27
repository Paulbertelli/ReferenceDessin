import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DrawingSessionStore } from '../drawing-session-store';
import { DrawingSession } from '../drawing-session';

@Component({
  selector: 'app-drawing-session-page',
  templateUrl: './drawing-session-page.html',
  styleUrl: './drawing-session-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DrawingSession],
})
export class DrawingSessionPage {
  protected readonly sessionStore = inject(DrawingSessionStore);
}
