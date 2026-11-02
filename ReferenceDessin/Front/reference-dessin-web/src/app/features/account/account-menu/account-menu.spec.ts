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

    setAccount('https://images.example/paul.jpg');

    fixture.detectChanges();
  });

  it('affiche la photo de profil', () => {
    const image = fixture.nativeElement.querySelector('.account-trigger img') as HTMLImageElement;

    expect(image).not.toBeNull();
    expect(image.src).toContain('https://images.example/paul.jpg');
  });

  it('affiche les initiales lorsque la photo est absente', () => {
    setAccount(null);
    fixture.detectChanges();

    const avatar = fixture.nativeElement.querySelector(
      '.account-trigger .account-avatar',
    ) as HTMLElement;

    expect(avatar.textContent?.trim()).toBe('PA');
    expect(avatar.querySelector('img')).toBeNull();
  });

  it('remplace une photo invalide par les initiales', () => {
    const image = fixture.nativeElement.querySelector('.account-trigger img') as HTMLImageElement;

    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const avatar = fixture.nativeElement.querySelector(
      '.account-trigger .account-avatar',
    ) as HTMLElement;

    expect(avatar.textContent?.trim()).toBe('PA');
    expect(avatar.querySelector('img')).toBeNull();
  });

  it('ouvre et ferme le menu du compte', () => {
    const trigger = getTrigger();

    trigger.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.account-popover')).not.toBeNull();

    trigger.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.account-popover')).toBeNull();
  });

  it('demande la déconnexion', () => {
    openMenu();

    findButton('Se déconnecter').click();
    fixture.detectChanges();

    expect(authenticationStore.signOut).toHaveBeenCalledOnce();

    expect(fixture.nativeElement.querySelector('.account-popover')).toBeNull();
  });

  it('confirme la suppression du compte', () => {
    openMenu();

    findButton('Supprimer mon compte').click();
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

  it('ferme le menu lors d’un clic en dehors du composant', () => {
    openMenu();

    document.body.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
      }),
    );

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.account-popover')).toBeNull();
  });

  function setAccount(profileImageUrl: string | null): void {
    fixture.componentRef.setInput('account', {
      displayName: 'Paul',
      email: 'paul@example.com',
      profileImageUrl,
      createdAtUtc: '2026-10-27T12:00:00Z',
    });
  }

  function openMenu(): void {
    getTrigger().click();
    fixture.detectChanges();
  }

  function getTrigger(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.account-trigger') as HTMLButtonElement;
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