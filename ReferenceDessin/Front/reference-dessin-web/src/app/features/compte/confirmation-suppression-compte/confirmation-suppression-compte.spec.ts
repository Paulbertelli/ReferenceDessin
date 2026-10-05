import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import {
  ConfirmationSuppressionCompte
} from './confirmation-suppression-compte';

describe('ConfirmationSuppressionCompte', () => {
  let composant: ConfirmationSuppressionCompte;
  let fixture:
    ComponentFixture<ConfirmationSuppressionCompte>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationSuppressionCompte]
    }).compileComponents();

    fixture = TestBed.createComponent(
      ConfirmationSuppressionCompte
    );

    composant = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit être créé', () => {
    expect(composant).toBeTruthy();
  });

  it(
    'doit confirmer quand le bouton de suppression est utilisé',
    () => {
      let confirmationRecue = false;

      composant.confirmer.subscribe(() => {
        confirmationRecue = true;
      });

      const bouton =
        fixture.nativeElement.querySelector(
          '.bouton-danger'
        ) as HTMLButtonElement;

      bouton.click();

      expect(confirmationRecue).toBe(true);
    }
  );

  it(
    'doit annuler quand le bouton Annuler est utilisé',
    () => {
      let annulationRecue = false;

      composant.annuler.subscribe(() => {
        annulationRecue = true;
      });

      const bouton =
        fixture.nativeElement.querySelector(
          '.bouton-secondaire'
        ) as HTMLButtonElement;

      bouton.click();

      expect(annulationRecue).toBe(true);
    }
  );

  it(
    'doit annuler quand le fond est utilisé',
    () => {
      let annulationRecue = false;

      composant.annuler.subscribe(() => {
        annulationRecue = true;
      });

      const fond =
        fixture.nativeElement.querySelector(
          '.fond-dialogue'
        ) as HTMLElement;

      fond.click();

      expect(annulationRecue).toBe(true);
    }
  );

  it('doit annuler avec la touche Échap', () => {
    let annulationRecue = false;

    composant.annuler.subscribe(() => {
      annulationRecue = true;
    });

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape'
      })
    );

    expect(annulationRecue).toBe(true);
  });
});