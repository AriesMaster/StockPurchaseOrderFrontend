import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthStore } from '../services/auth.store';
import { SessionService } from '../services/session.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const authorize = () => auth.role() === 'ADMIN' ? true : router.createUrlTree(['/dashboard']);
  if (auth.isAuthenticated()) return authorize();
  return inject(SessionService).refresh().pipe(
    map(restored => restored ? authorize() : router.createUrlTree(['/login']))
  );
};
