import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import { AuthenticationStore } from '../authentication-store';
import { UserAccount } from '../user-account';
import { AccountDeletionConfirmation } from '../account-deletion-confirmation/account-deletion-confirmation';

@Component({
  selector: 'app-account-menu',
  imports: [AccountDeletionConfirmation],
  templateUrl: './account-menu.html',
  styleUrl: './account-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMenu {
  readonly account = input.required<UserAccount>();

  private readonly authenticationStore = inject(AuthenticationStore);

  protected readonly menuOpen = signal(false);
  protected readonly deletionConfirmationOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected signOut(): void {
    this.closeMenu();
    this.authenticationStore.signOut();
  }

  protected requestAccountDeletion(): void {
    this.closeMenu();
    this.deletionConfirmationOpen.set(true);
  }

  protected cancelAccountDeletion(): void {
    this.deletionConfirmationOpen.set(false);
  }

  protected confirmAccountDeletion(): void {
    this.deletionConfirmationOpen.set(false);
    this.authenticationStore.deleteAccount();
  }

  @HostListener('document:keydown.escape')
  protected closeWithEscape(): void {
    if (this.deletionConfirmationOpen()) {
      return;
    }

    this.closeMenu();
  }
}