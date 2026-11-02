import { Route } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';
import { authenticationGuard } from './features/account/authentication.guard';
import { NotFoundPage } from './features/not-found-page/not-found-page';

describe('App routes', () => {
  function getApplicationChildren(): Route[] {
    const applicationRoute = routes.find(
      (route) => route.path === '' && route.children !== undefined,
    );

    expect(applicationRoute).toBeDefined();

    return applicationRoute?.children ?? [];
  }

  it('protège uniquement les routes Pinterest', () => {
    const guardedPaths = getApplicationChildren()
      .filter((route) => route.canActivate?.includes(authenticationGuard))
      .map((route) => route.path);

    expect(guardedPaths).toEqual(['collections', 'collections/:boardId']);
  });

  it.each(['', 'search', 'selection', 'session'])(
    'laisse la route "%s" accessible sans connexion',
    (path) => {
      const route = getApplicationChildren().find((candidate) => candidate.path === path);

      expect(route).toBeDefined();
      expect(route?.canActivate).toBeUndefined();
    },
  );

  it('laisse la page de connexion accessible sans guard', () => {
    const loginRoute = routes.find((route) => route.path === 'login');

    expect(loginRoute).toBeDefined();
    expect(loginRoute?.canActivate).toBeUndefined();
  });

  it('utilise la page 404 pour les adresses inconnues', async () => {
    const applicationChildren = getApplicationChildren();

    const notFoundRoute = applicationChildren.find((route) => route.path === '**');

    expect(notFoundRoute).toBeDefined();
    expect(notFoundRoute?.redirectTo).toBeUndefined();
    expect(notFoundRoute?.title).toBe('Page introuvable — Référence Dessin');

    const loadedComponent = await notFoundRoute?.loadComponent?.();

    expect(loadedComponent).toBe(NotFoundPage);
  });

  it('place la route 404 après toutes les autres routes', () => {
    const applicationChildren = getApplicationChildren();

    expect(applicationChildren.at(-1)?.path).toBe('**');
  });
});