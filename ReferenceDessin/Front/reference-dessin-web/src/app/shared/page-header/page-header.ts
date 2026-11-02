import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageBackButton } from '../page-back-button/page-back-button';

@Component({
  selector: 'app-page-header',
  imports: [PageBackButton],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  readonly title = input.required<string>();

  readonly subtitle = input<string>('');

  readonly fallbackUrl = input.required<string>();

  readonly alignment = input<'start' | 'center'>('start');
}