import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { PageState } from './page-state';

describe('PageState', () => {
  let fixture: ComponentFixture<PageState>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageState],
    }).compileComponents();

    fixture = TestBed.createComponent(PageState);

    fixture.componentRef.setInput('type', 'loading');

    fixture.componentRef.setInput('message', 'Chargement…');
  });

  it('affiche un état de chargement accessible', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    const state = element.querySelector('.page-state');

    expect(state?.getAttribute('role')).toBe('status');

    expect(element.querySelector('.page-state__spinner')).not.toBeNull();

    expect(state?.textContent?.trim()).toContain('Chargement…');
  });

  it('émet l’action demandée', () => {
    let actionRequested = false;

    fixture.componentRef.setInput('type', 'error');

    fixture.componentRef.setInput('message', 'Une erreur est survenue.');

    fixture.componentRef.setInput('actionLabel', 'Réessayer');

    fixture.componentInstance.actionRequested.subscribe(() => {
      actionRequested = true;
    });

    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();

    expect(actionRequested).toBe(true);
  });
});