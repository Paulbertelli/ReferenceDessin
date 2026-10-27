import { computed, Injectable, signal } from '@angular/core';
import { ReferenceImage } from '../../shared/models/reference-image';

@Injectable({
  providedIn: 'root',
})
export class ReferenceSelectionStore {
  private readonly selectedImages = signal<ReferenceImage[]>([]);

  readonly images = this.selectedImages.asReadonly();

  readonly count = computed(() => this.selectedImages().length);

  readonly isEmpty = computed(() => this.selectedImages().length === 0);

  isSelected(image: ReferenceImage): boolean {
    const key = this.getImageKey(image);

    return this.selectedImages().some((selectedImage) => this.getImageKey(selectedImage) === key);
  }

  toggle(image: ReferenceImage): void {
    if (this.isSelected(image)) {
      this.remove(image);
      return;
    }

    this.selectedImages.update((images) => [...images, image]);
  }

  addAll(imagesToAdd: readonly ReferenceImage[]): void {
    this.selectedImages.update((currentImages) => {
      const existingKeys = new Set(currentImages.map((image) => this.getImageKey(image)));

      const newImages = imagesToAdd.filter((image) => {
        const key = this.getImageKey(image);

        if (existingKeys.has(key)) {
          return false;
        }

        existingKeys.add(key);
        return true;
      });

      return [...currentImages, ...newImages];
    });
  }

  remove(image: ReferenceImage): void {
    const key = this.getImageKey(image);

    this.selectedImages.update((images) =>
      images.filter((selectedImage) => this.getImageKey(selectedImage) !== key),
    );
  }

  clear(): void {
    this.selectedImages.set([]);
  }

  private getImageKey(image: ReferenceImage): string {
    return JSON.stringify([image.sourceName.trim().toLowerCase(), image.externalId.trim()]);
  }
}