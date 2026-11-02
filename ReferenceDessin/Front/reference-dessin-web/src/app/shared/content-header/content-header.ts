import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-content-header',
  templateUrl: './content-header.html',
  styleUrl: './content-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentHeader {
  readonly title = input<string>('');
}