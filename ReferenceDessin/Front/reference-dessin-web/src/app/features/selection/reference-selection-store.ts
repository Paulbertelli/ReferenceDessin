import { computed, Injectable, signal } from '@angular/core';
import { ReferenceImage } from '../../shared/models/reference-image';

@Injectable({
  providedIn: 'root',
})
export class ReferenceSelectionStore {
  private readonly storageKey = 'reference-dessin.selection';

  private readonly selectedImages = signal<ReferenceImage[]>(this.loadSelection());

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

    this.replaceSelection([...this.selectedImages(), image]);
  }

  addAll(imagesToAdd: readonly ReferenceImage[]): void {
    const currentImages = this.selectedImages();

    const existingKeys = new Set(currentImages.map((image) => this.getImageKey(image)));

    const newImages = imagesToAdd.filter((image) => {
      const key = this.getImageKey(image);

      if (existingKeys.has(key)) {
        return false;
      }

      existingKeys.add(key);
      return true;
    });

    this.replaceSelection([...currentImages, ...newImages]);
  }

  remove(image: ReferenceImage): void {
    const key = this.getImageKey(image);

    this.replaceSelection(
      this.selectedImages().filter((selectedImage) => this.getImageKey(selectedImage) !== key),
    );
  }

  clear(): void {
    this.replaceSelection([]);
  }

  private replaceSelection(images: ReferenceImage[]): void {
    this.selectedImages.set(images);
    this.persistSelection(images);
  }

  private loadSelection(): ReferenceImage[] {
    if (typeof sessionStorage === 'undefined') {
      return [];
    }

    try {
      const storedValue = sessionStorage.getItem(this.storageKey);

      if (storedValue === null) {
        return [];
      }

      const parsedValue: unknown = JSON.parse(storedValue);

      if (
        !Array.isArray(parsedValue) ||
        !parsedValue.every((value) => this.isReferenceImage(value))
      ) {
        sessionStorage.removeItem(this.storageKey);
        return [];
      }

      return parsedValue;
    } catch {
      sessionStorage.removeItem(this.storageKey);
      return [];
    }
  }

  private persistSelection(images: readonly ReferenceImage[]): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    try {
      if (images.length === 0) {
        sessionStorage.removeItem(this.storageKey);
        return;
      }

      sessionStorage.setItem(this.storageKey, JSON.stringify(images));
    } catch {
      // La sélection reste utilisable en mémoire si le
      // stockage du navigateur est indisponible.
    }
  }

  private isReferenceImage(value: unknown): value is ReferenceImage {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const image = value as Record<string, unknown>;

    return (
      typeof image['externalId'] === 'string' &&
      typeof image['imageUrl'] === 'string' &&
      typeof image['sourceName'] === 'string' &&
      typeof image['originalUrl'] === 'string' &&
      this.isNullableString(image['authorName']) &&
      this.isNullableString(image['authorUrl']) &&
      typeof image['description'] === 'string' &&
      this.isNullableString(image['averageColor'])
    );
  }

  private isNullableString(value: unknown): value is string | null {
    return value === null || typeof value === 'string';
  }

  private getImageKey(image: ReferenceImage): string {
    return JSON.stringify([image.sourceName.trim().toLowerCase(), image.externalId.trim()]);
  }
}