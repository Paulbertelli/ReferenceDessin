import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthenticationStore } from '../authentication-store';
import { LucideMoveRight } from '@lucide/angular';

@Component({
  selector: 'app-login-page',
  imports: [RouterLink, LucideMoveRight],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  protected readonly authenticationStore = inject(AuthenticationStore);
}
