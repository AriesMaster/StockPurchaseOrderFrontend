import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../services/auth.store';
import { Role } from '../models/auth.models';

export function roleGuard(...allowed: Role[]): CanActivateFn {
  return () => {
    const store = inject(AuthStore);
    const router = inject(Router);
    if (!store.isAuthenticated()) return router.createUrlTree(['/login']);
    const role = store.role();
    return (role !== null && allowed.includes(role)) || router.createUrlTree(['/']);
  };
}
