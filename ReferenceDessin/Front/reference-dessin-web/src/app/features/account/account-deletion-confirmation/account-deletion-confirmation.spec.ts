import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AccountDeletionConfirmation } from './account-deletion-confirmation';

describe('AccountDeletionConfirmation', () => {
  let component: AccountDeletionConfirmation;
  let fixture: ComponentFixture<AccountDeletionConfirmation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountDeletionConfirmation],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountDeletionConfirmation);

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('requests confirmation from the deletion button', () => {
    let confirmationReceived = false;

    component.confirmationRequested.subscribe(() => {
      confirmationReceived = true;
    });

    const button = fixture.nativeElement.querySelector('.danger-button') as HTMLButtonElement;

    button.click();

    expect(confirmationReceived).toBe(true);
  });

  it('requests cancellation from the cancel button', () => {
    let cancellationReceived = false;

    component.cancellationRequested.subscribe(() => {
      cancellationReceived = true;
    });

    const button = fixture.nativeElement.querySelector('.secondary-button') as HTMLButtonElement;

    button.click();

    expect(cancellationReceived).toBe(true);
  });

  it('requests cancellation when clicking the backdrop', () => {
    let cancellationReceived = false;

    component.cancellationRequested.subscribe(() => {
      cancellationReceived = true;
    });

    const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop') as HTMLElement;

    backdrop.click();

    expect(cancellationReceived).toBe(true);
  });

  it('requests cancellation when pressing Escape', () => {
    let cancellationReceived = false;

    component.cancellationRequested.subscribe(() => {
      cancellationReceived = true;
    });

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
      }),
    );

    expect(cancellationReceived).toBe(true);
  });
});