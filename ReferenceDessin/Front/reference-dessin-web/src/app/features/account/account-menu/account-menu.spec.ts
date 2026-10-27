import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountDeletionConfirmation } from '../account-deletion-confirmation/account-deletion-confirmation';
import { AuthenticationStore } from '../authentication-store';
import { AccountMenu } from './account-menu';

describe('AccountMenu', () => {
  let fixture: ComponentFixture<AccountMenu>;

  const authenticationStore = {
    signOut: vi.fn(),
    deleteAccount: vi.fn(),
  };

  beforeEach(async () => {
    authenticationStore.signOut.mockClear();
    authenticationStore.deleteAccount.mockClear();

    await TestBed.configureTestingModule({
      imports: [AccountMenu],
      providers: [
        {
          provide: AuthenticationStore,
          useValue: authenticationStore,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountMenu);

    fixture.componentRef.setInput('account', {
      displayName: 'Paul',
      email: 'paul@example.com',
      createdAtUtc: '2026-10-27T12:00:00Z',
    });

    fixture.detectChanges();
  });

  it('ouvre et ferme le menu du compte', () => {
    const trigger = fixture.nativeElement.querySelector('.account-trigger') as HTMLButtonElement;

    trigger.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.account-popover')).not.toBeNull();

    trigger.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.account-popover')).toBeNull();
  });

  it('demande la déconnexion', () => {
    openMenu();

    const signOutButton = findButton('Se déconnecter');

    signOutButton.click();
    fixture.detectChanges();

    expect(authenticationStore.signOut).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('.account-popover')).toBeNull();
  });

  it('confirme la suppression du compte', () => {
    openMenu();

    const deletionButton = findButton('Supprimer mon compte');

    deletionButton.click();
    fixture.detectChanges();

    const confirmationDebugElement = fixture.debugElement.query(
      By.directive(AccountDeletionConfirmation),
    );

    expect(confirmationDebugElement).not.toBeNull();

    const confirmation = confirmationDebugElement.componentInstance as AccountDeletionConfirmation;

    confirmation.confirmationRequested.emit();
    fixture.detectChanges();

    expect(authenticationStore.deleteAccount).toHaveBeenCalledOnce();

    expect(fixture.nativeElement.querySelector('app-account-deletion-confirmation')).toBeNull();
  });

  function openMenu(): void {
    const trigger = fixture.nativeElement.querySelector('.account-trigger') as HTMLButtonElement;

    trigger.click();
    fixture.detectChanges();
  }

  function findButton(label: string): HTMLButtonElement {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    const button = buttons.find((candidate) => candidate.textContent?.trim() === label);

    if (!button) {
      throw new Error(`Bouton introuvable : ${label}`);
    }

    return button;
  }
});