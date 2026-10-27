import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthenticationStore } from '../../features/account/authentication-store';

@Component({
  selector: 'app-main-navigation',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './main-navigation.html',
  styleUrl: './main-navigation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainNavigation {
  protected readonly authenticationStore = inject(AuthenticationStore);
}
