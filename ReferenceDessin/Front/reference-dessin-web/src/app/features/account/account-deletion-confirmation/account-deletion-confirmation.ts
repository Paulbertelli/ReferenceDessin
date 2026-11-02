import { ChangeDetectionStrategy, Component, HostListener, output } from '@angular/core';

@Component({
  selector: 'app-account-deletion-confirmation',
  templateUrl: './account-deletion-confirmation.html',
  styleUrl: './account-deletion-confirmation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDeletionConfirmation {
  readonly confirmationRequested = output<void>();
  readonly cancellationRequested = output<void>();

  protected confirmDeletion(): void {
    this.confirmationRequested.emit();
  }

  protected cancelDeletion(): void {
    this.cancellationRequested.emit();
  }

  @HostListener('document:keydown.escape')
  protected closeOnEscape(): void {
    this.cancelDeletion();
  }
}
