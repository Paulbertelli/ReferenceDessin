import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { HomeSession } from './home-session';

describe('HomeSession', () => {
  let fixture: ComponentFixture<HomeSession>;

  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [HomeSession],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeSession);

    fixture.detectChanges();
  });

  it('crée le préparateur de séance', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});