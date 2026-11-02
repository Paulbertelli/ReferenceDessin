import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-page-back-button',
  templateUrl: './page-back-button.html',
  styleUrl: './page-back-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageBackButton {
  readonly fallbackUrl = input.required<string>();

  private readonly location = inject(Location);

  private readonly router = inject(Router);

  protected goBack(): void {
    const navigationId: unknown = window.history.state?.navigationId;

    if (typeof navigationId === 'number' && navigationId > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl(this.fallbackUrl());
  }
}