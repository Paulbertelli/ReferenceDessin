import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MinuteurComponent } from './minuteur';

describe('MinuteurComponent', () => {
    let composant: MinuteurComponent;
    let fixture: ComponentFixture<MinuteurComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MinuteurComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(MinuteurComponent);
        composant = fixture.componentInstance;

        fixture.componentRef.setInput('enCours', false);
        fixture.componentRef.setInput('desactive', false);
        fixture.componentRef.setInput('tempsFormate', '02:00');
        fixture.componentRef.setInput('progression', 100);
        fixture.componentRef.setInput('dureeMinutes', 2);

        fixture.detectChanges();
    });

    it('doit afficher le temps fourni', () => {
        fixture.componentRef.setInput(
            'tempsFormate',
            '01:25'
        );

        fixture.detectChanges();

        const affichage = fixture.nativeElement.querySelector(
            '.temps'
        ) as HTMLOutputElement;

        expect(affichage.textContent?.trim()).toBe('01:25');
    });

    it('doit afficher la progression fournie', () => {
        fixture.componentRef.setInput('progression', 50);
        fixture.detectChanges();

        const progression = fixture.nativeElement.querySelector(
            '.progression'
        ) as HTMLElement;

        expect(progression.style.width).toBe('50%');
    });

    it('doit demander le changement lecture-pause', () => {
        let nombreEmissions = 0;

        composant.demandeLecturePause.subscribe(() => {
            nombreEmissions++;
        });

        const bouton = fixture.nativeElement.querySelector(
            '.action-principale'
        ) as HTMLButtonElement;

        bouton.click();

        expect(nombreEmissions).toBe(1);
    });

    it('doit demander la réinitialisation', () => {
        let nombreEmissions = 0;

        composant.demandeReinitialisation.subscribe(() => {
            nombreEmissions++;
        });

        const bouton = fixture.nativeElement.querySelector(
            '.bouton-reinitialisation'
        ) as HTMLButtonElement;

        bouton.click();

        expect(nombreEmissions).toBe(1);
    });

    it('doit transmettre la nouvelle durée', () => {
        let dureeRecue: number | undefined;

        composant.dureeMinutesChange.subscribe(duree => {
            dureeRecue = duree;
        });

        const saisie = fixture.nativeElement.querySelector(
            'input[type="number"]'
        ) as HTMLInputElement;

        saisie.value = '5';
        saisie.dispatchEvent(new Event('input'));

        expect(dureeRecue).toBe(5);
    });

    it('doit désactiver le bouton lorsque demandé', () => {
        fixture.componentRef.setInput('desactive', true);
        fixture.detectChanges();

        const bouton = fixture.nativeElement.querySelector(
            '.action-principale'
        ) as HTMLButtonElement;

        expect(bouton.disabled).toBe(true);
    });

    it('doit afficher l’action pause lorsque le minuteur tourne', () => {
        fixture.componentRef.setInput('enCours', true);
        fixture.detectChanges();

        const bouton = fixture.nativeElement.querySelector(
            '.action-principale'
        ) as HTMLButtonElement;

        expect(bouton.getAttribute('aria-label')).toBe(
            'Mettre le minuteur en pause'
        );
    });
});