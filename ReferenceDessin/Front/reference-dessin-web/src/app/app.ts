import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationBanner } from './shared/notification/notification-banner';

@Component({
  imports: [RouterOutlet, NotificationBanner],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}