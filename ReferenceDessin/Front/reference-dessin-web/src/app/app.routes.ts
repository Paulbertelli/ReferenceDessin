import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home-page/home-page').then((module) => module.HomePage),
    title: 'Accueil — Référence Dessin',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/account/login-page/login-page').then((module) => module.LoginPage),
    title: 'Connexion — Référence Dessin',
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./features/catalog/search-page/search-page').then((module) => module.SearchPage),
    title: 'Recherche — Référence Dessin',
  },
  {
    path: 'collections',
    loadComponent: () =>
      import('./features/catalog/collection-list-page/collection-list-page').then(
        (module) => module.CollectionListPage,
      ),
    title: 'Collections — Référence Dessin',
  },
  {
    path: 'collections/:boardId',
    loadComponent: () =>
      import('./features/catalog/collection-detail-page/collection-detail-page').then(
        (module) => module.CollectionDetailPage,
      ),
    title: 'Collection — Référence Dessin',
  },
  {
    path: 'selection',
    loadComponent: () =>
      import('./features/selection/selection-page/selection-page').then(
        (module) => module.SelectionPage,
      ),
    title: 'Votre sélection — Référence Dessin',
  },
  {
    path: 'session',
    loadComponent: () =>
      import('./features/drawing-session/drawing-session-page/drawing-session-page').then(
        (module) => module.DrawingSessionPage,
      ),
    title: 'Séance — Référence Dessin',
  },
  {
    path: '**',
    redirectTo: '',
  },
];