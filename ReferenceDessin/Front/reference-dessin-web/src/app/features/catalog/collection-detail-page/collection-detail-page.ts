import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { ReferenceCard } from '../../../shared/reference-card/reference-card';
import { ReferenceSelectionStore } from '../../selection/reference-selection-store';
import { SelectionLauncher } from '../../selection/selection-launcher/selection-launcher';
import { PinterestBoardDetailStore } from '../pinterest/pinterest-board-detail-store';
import { PinterestBoardsStore } from '../pinterest/pinterest-boards-store';

@Component({
  selector: 'app-collection-detail-page',
  imports: [RouterLink, ReferenceCard, SelectionLauncher],
  providers: [PinterestBoardDetailStore],
  templateUrl: './collection-detail-page.html',
  styleUrl: './collection-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionDetailPage {
  private readonly route = inject(ActivatedRoute);

  protected readonly detailStore = inject(PinterestBoardDetailStore);

  protected readonly boardsStore = inject(PinterestBoardsStore);

  protected readonly selectionStore = inject(ReferenceSelectionStore);

  protected readonly boardId = this.route.snapshot.paramMap.get('boardId') ?? '';

  protected readonly boardName = computed(
    () =>
      this.boardsStore.boards().find((board) => board.id === this.boardId)?.name ??
      'Collection Pinterest',
  );

  constructor() {
    this.boardsStore.load();
    this.detailStore.load(this.boardId);
  }

  protected selectSection(sectionId: string | null): void {
    this.detailStore.selectSection(sectionId);
  }

  protected toggleSelection(image: ReferenceImage): void {
    this.selectionStore.toggle(image);
  }

  protected selectAllDisplayed(): void {
    this.selectionStore.addAll(this.detailStore.images());
  }

  protected reload(): void {
    this.detailStore.load(this.boardId);
  }
}