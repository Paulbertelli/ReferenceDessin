import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SelectionLauncher } from '../../selection/selection-launcher/selection-launcher';
import { PinterestBoardPreviewsStore } from '../pinterest/pinterest-board-previews-store';
import { PinterestBoardsStore } from '../pinterest/pinterest-boards-store';

@Component({
  selector: 'app-collection-list-page',
  templateUrl: './collection-list-page.html',
  styleUrl: './collection-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectionLauncher, RouterLink],
})
export class CollectionListPage {
  protected readonly boardsStore = inject(PinterestBoardsStore);

  protected readonly previewsStore = inject(PinterestBoardPreviewsStore);

  constructor() {
    effect(() => {
      for (const board of this.boardsStore.boards()) {
        this.previewsStore.load(board.id);
      }
    });

    this.boardsStore.load();
  }

  protected reload(): void {
    this.boardsStore.load(true);
  }

  protected reloadPreview(boardId: string): void {
    this.previewsStore.load(boardId, true);
  }

  protected readonly displayedBoards = computed(() =>
    this.boardsStore
      .boards()
      .filter(
        (board) =>
          (this.previewsStore.hasLoaded(board.id) &&
            this.previewsStore.imagesFor(board.id).length > 0) ||
          this.previewsStore.errorFor(board.id).length > 0,
      ),
  );

  protected readonly previewsResolved = computed(() =>
    this.boardsStore
      .boards()
      .every(
        (board) =>
          this.previewsStore.hasLoaded(board.id) ||
          this.previewsStore.errorFor(board.id).length > 0,
      ),
  );
}