import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-selection-page',
  templateUrl: './selection-page.html',
  styleUrl: './selection-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionPage {}
