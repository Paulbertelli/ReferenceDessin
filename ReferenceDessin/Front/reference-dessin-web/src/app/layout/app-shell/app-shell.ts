import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainNavigation } from '../main-navigation/main-navigation';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, MainNavigation],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {}