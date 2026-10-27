import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-collection-detail-page',
  templateUrl: './collection-detail-page.html',
  styleUrl: './collection-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionDetailPage {}
