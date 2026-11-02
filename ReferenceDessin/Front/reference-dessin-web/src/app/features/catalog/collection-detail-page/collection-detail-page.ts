import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LucidePlus, LucideX } from '@lucide/angular';
import { ContentHeader } from '../../../shared/content-header/content-header';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { PageHeader } from '../../../shared/page-header/page-header';
import { PageState } from '../../../shared/page-state/page-state';
import { ReferenceCard } from '../../../shared/reference-card/reference-card';
import { ReferenceSelectionStore } from '../../selection/reference-selection-store';
import { SelectionLauncher } from '../../selection/selection-launcher/selection-launcher';
import { PinterestBoardDetailStore } from '../pinterest/pinterest-board-detail-store';
import { PinterestBoardsStore } from '../pinterest/pinterest-boards-store';

@Component({
  selector: 'app-collection-detail-page',
  imports: [
    PageHeader,
    ContentHeader,
    PageState,
    ReferenceCard,
    SelectionLauncher,
    LucidePlus,
    LucideX,
  ],
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

  protected readonly loadingPlaceholders = Array.from({ length: 12 });

  private readonly displayedImages = computed(() => this.detailStore.images());

  protected readonly boardName = computed(
    () =>
      this.boardsStore.boards().find((board) => board.id === this.boardId)?.name ??
      'Collection Pinterest',
  );

  protected readonly allDisplayedSelected = computed(() => {
    const images = this.displayedImages();

    return images.length > 0 && images.every((image) => this.selectionStore.isSelected(image));
  });

  protected readonly hasDisplayedSelection = computed(() =>
    this.displayedImages().some((image) => this.selectionStore.isSelected(image)),
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
    this.selectionStore.addAll(this.displayedImages());
  }

  protected deselectAllDisplayed(): void {
    this.selectionStore.removeAll(this.displayedImages());
  }

  protected reload(): void {
    this.detailStore.load(this.boardId);
  }

  protected retry(): void {
    if (this.detailStore.selectedSectionId() === null) {
      this.reload();
      return;
    }

    this.detailStore.retrySelectedSection();
  }
}