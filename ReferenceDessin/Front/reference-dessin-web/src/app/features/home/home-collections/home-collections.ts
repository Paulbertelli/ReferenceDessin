import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PinterestBoardPreviewsStore } from '../../catalog/pinterest/pinterest-board-previews-store';
import { PinterestBoardsStore } from '../../catalog/pinterest/pinterest-boards-store';

@Component({
  selector: 'app-home-collections',
  imports: [RouterLink],
  templateUrl: './home-collections.html',
  styleUrl: './home-collections.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeCollections {
  protected readonly boardsStore = inject(PinterestBoardsStore);

  protected readonly previewsStore = inject(PinterestBoardPreviewsStore);

  protected readonly displayedBoards = computed(() =>
    this.boardsStore
      .boards()
      .filter((board) => this.previewsStore.imagesFor(board.id).length > 0)
      .slice(0, 4),
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

  constructor() {
    effect(() => {
      for (const board of this.boardsStore.boards()) {
        this.previewsStore.load(board.id);
      }
    });

    this.boardsStore.load();
  }
}