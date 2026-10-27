import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-collection-list-page',
  templateUrl: './collection-list-page.html',
  styleUrl: './collection-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionListPage {}
