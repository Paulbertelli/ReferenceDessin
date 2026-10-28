import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HomeCollections } from '../home-collections/home-collections';
import { HomeSession } from '../home-session/home-session';

@Component({
  selector: 'app-home-page',
  imports: [HomeSession, HomeCollections],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}