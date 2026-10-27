import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPage {}
