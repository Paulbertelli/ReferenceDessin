import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthenticationStore } from './authentication-store';

export const authenticationGuard: CanActivateFn = () => {
  const authenticationStore = inject(AuthenticationStore);

  const router = inject(Router);

  return toObservable(authenticationStore.state).pipe(
    filter((state) => state.status !== 'loading'),
    take(1),
    map((state) => (state.status === 'signedIn' ? true : router.createUrlTree(['/login']))),
  );
};