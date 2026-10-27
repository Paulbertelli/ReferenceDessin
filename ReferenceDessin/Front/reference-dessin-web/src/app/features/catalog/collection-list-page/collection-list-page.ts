import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PinterestBoardsStore } from '../pinterest/pinterest-boards-store';
import { SelectionLauncher } from '../../selection/selection-launcher/selection-launcher';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-collection-list-page',
  templateUrl: './collection-list-page.html',
  styleUrl: './collection-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectionLauncher, RouterLink],
})
export class CollectionListPage {
  protected readonly boardsStore = inject(PinterestBoardsStore);

  constructor() {
    this.boardsStore.load();
  }

  protected reload(): void {
    this.boardsStore.load(true);
  }
}
