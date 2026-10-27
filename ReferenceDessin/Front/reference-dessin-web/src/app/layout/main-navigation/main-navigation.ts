import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-main-navigation',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './main-navigation.html',
  styleUrl: './main-navigation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainNavigation {}
