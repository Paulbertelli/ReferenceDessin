import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideHome, LucideSearch } from '@lucide/angular';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, LucideHome, LucideSearch],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}