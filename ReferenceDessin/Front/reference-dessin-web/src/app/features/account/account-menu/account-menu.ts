import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import { LucideChevronDown, LucideLogOut, LucideTrash2 } from '@lucide/angular';
import { AccountDeletionConfirmation } from '../account-deletion-confirmation/account-deletion-confirmation';
import { AuthenticationStore } from '../authentication-store';
import { UserAccount } from '../user-account';

@Component({
  selector: 'app-account-menu',
  imports: [AccountDeletionConfirmation, LucideChevronDown, LucideLogOut, LucideTrash2],
  templateUrl: './account-menu.html',
  styleUrl: './account-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMenu {
  readonly account = input.required<UserAccount>();

  private readonly authenticationStore = inject(AuthenticationStore);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly menuOpen = signal(false);
  protected readonly deletionConfirmationOpen = signal(false);
  protected readonly profileImageFailed = signal(false);

  protected readonly initials = computed(() => {
    const parts = this.account().displayName.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
      return '?';
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts.at(-1)?.[0] ?? ''}`.toUpperCase();
  });

  protected readonly showProfileImage = computed(
    () => Boolean(this.account().profileImageUrl) && !this.profileImageFailed(),
  );

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected handleProfileImageError(): void {
    this.profileImageFailed.set(true);
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

  @HostListener('document:click', ['$event'])
  protected closeWhenClickingOutside(event: MouseEvent): void {
    const target = event.target;

    if (target instanceof Node && !this.elementRef.nativeElement.contains(target)) {
      this.closeMenu();
    }
  }
}