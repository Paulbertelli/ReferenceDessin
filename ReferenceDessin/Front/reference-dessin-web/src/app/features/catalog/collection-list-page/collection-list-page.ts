import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import {CollectionCard, CollectionDisplayMode,} from '../../../shared/collection-card/collection-card';
import { PageHeader } from '../../../shared/page-header/page-header';
import { SelectionLauncher } from '../../selection/selection-launcher/selection-launcher';
import { PinterestBoardPreviewsStore } from '../pinterest/pinterest-board-previews-store';
import { PinterestBoardsStore } from '../pinterest/pinterest-boards-store';
import { ContentHeader } from '../../../shared/content-header/content-header';
import { PageState } from '../../../shared/page-state/page-state';

@Component({
  selector: 'app-collection-list-page',
  imports: [PageHeader, ContentHeader, PageState, CollectionCard, SelectionLauncher],
  templateUrl: './collection-list-page.html',
  styleUrl: './collection-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionListPage {
  protected readonly boardsStore = inject(PinterestBoardsStore);

  protected readonly previewsStore = inject(PinterestBoardPreviewsStore);

  protected readonly displayMode = signal<CollectionDisplayMode>('detailed');

  constructor() {
    effect(() => {
      const boards = this.boardsStore.boards();

      untracked(() => {
        for (const board of boards) {
          this.previewsStore.load(board.id);
        }
      });
    });

    this.boardsStore.load();
  }

  protected readonly displayedBoards = computed(() =>
    this.boardsStore
      .boards()
      .filter(
        (board) =>
          !this.previewsStore.hasLoaded(board.id) ||
          this.previewsStore.imagesFor(board.id).length > 0 ||
          this.previewsStore.errorFor(board.id).length > 0,
      ),
  );

  protected toggleDisplayMode(): void {
    this.displayMode.update((mode) => (mode === 'compact' ? 'detailed' : 'compact'));
  }

  protected reload(): void {
    this.boardsStore.load(true);
  }

  protected reloadPreview(boardId: string): void {
    this.previewsStore.load(boardId, true);
  }
}