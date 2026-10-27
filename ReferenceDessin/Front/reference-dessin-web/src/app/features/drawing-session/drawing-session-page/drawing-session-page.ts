import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-drawing-session-page',
  templateUrl: './drawing-session-page.html',
  styleUrl: './drawing-session-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingSessionPage {}
