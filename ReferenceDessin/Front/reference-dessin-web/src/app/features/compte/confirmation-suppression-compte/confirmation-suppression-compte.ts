import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  output
} from '@angular/core';

@Component({
  selector: 'app-confirmation-suppression-compte',
  imports: [],
  templateUrl: './confirmation-suppression-compte.html',
  styleUrl: './confirmation-suppression-compte.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ConfirmationSuppressionCompte {
  readonly confirmer = output<void>();
  readonly annuler = output<void>();

  protected confirmerSuppression(): void {
    this.confirmer.emit();
  }

  protected annulerSuppression(): void {
    this.annuler.emit();
  }

  @HostListener('document:keydown.escape')
  protected fermerAvecEchap(): void {
    this.annulerSuppression();
  }
}