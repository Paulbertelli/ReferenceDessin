import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Timer } from './timer';

describe('Timer', () => {
  let component: Timer;
  let fixture: ComponentFixture<Timer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Timer],
    }).compileComponents();

    fixture = TestBed.createComponent(Timer);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('running', false);
    fixture.componentRef.setInput('disabled', false);
    fixture.componentRef.setInput('formattedTime', '02:00');
    fixture.componentRef.setInput('progress', 100);
    fixture.componentRef.setInput('durationMinutes', 2);

    fixture.detectChanges();
  });

  it('displays the provided time', () => {
    fixture.componentRef.setInput('formattedTime', '01:25');
    fixture.detectChanges();

    const display = fixture.nativeElement.querySelector('.time') as HTMLOutputElement;

    expect(display.textContent?.trim()).toBe('01:25');
  });

  it('displays the provided progress', () => {
    fixture.componentRef.setInput('progress', 50);
    fixture.detectChanges();

    const progress = fixture.nativeElement.querySelector('.progress') as HTMLElement;

    expect(progress.style.width).toBe('50%');
  });

  it('emits a toggle request', () => {
    let emissionCount = 0;

    component.toggleRequested.subscribe(() => {
      emissionCount++;
    });

    const button = fixture.nativeElement.querySelector('.primary-action') as HTMLButtonElement;

    button.click();

    expect(emissionCount).toBe(1);
  });

  it('emits a reset request', () => {
    let emissionCount = 0;

    component.resetRequested.subscribe(() => {
      emissionCount++;
    });

    const button = fixture.nativeElement.querySelector('.reset-button') as HTMLButtonElement;

    button.click();

    expect(emissionCount).toBe(1);
  });

  it('updates the duration', () => {
    const inputElement = fixture.nativeElement.querySelector(
      'input[type="number"]',
    ) as HTMLInputElement;

    inputElement.value = '5';
    inputElement.dispatchEvent(new Event('input'));

    expect(component.durationMinutes()).toBe(5);
  });

  it('disables the primary action when requested', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.primary-action') as HTMLButtonElement;

    expect(button.disabled).toBe(true);
  });

  it('displays the pause action while the timer is running', () => {
    fixture.componentRef.setInput('running', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.primary-action') as HTMLButtonElement;

    expect(button.getAttribute('aria-label')).toBe('Mettre le minuteur en pause');
  });
});
