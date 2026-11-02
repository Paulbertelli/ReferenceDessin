import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthenticationStore } from '../../account/authentication-store';
import { HomeCollections } from '../home-collections/home-collections';
import { HomeSession } from '../home-session/home-session';

@Component({
  selector: 'app-home-page',
  imports: [HomeSession, HomeCollections],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly authenticationStore = inject(AuthenticationStore);

  protected readonly isSignedIn = computed(
    () => this.authenticationStore.state()?.status === 'signedIn',
  );
}
