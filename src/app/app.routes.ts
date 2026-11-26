import { adminGuard } from './core/auth/guards/admin.guard';
import { Routes } from '@angular/router';
import { PublicLayout } from './layouts/public-layout/public-layout';
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map } from 'rxjs';
import { AuthStore } from './core/auth/services/auth.store';
import { SessionService } from './core/auth/services/session.service';

const restoreSessionGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return inject(SessionService).refresh().pipe(
    map(restored => restored || router.createUrlTree(['/login']))
  );
};

export const routes: Routes = [
  { path: 'dashboard', canActivate: [restoreSessionGuard], loadComponent: () => import('./layouts/workspace-layout/workspace-layout').then(m => m.WorkspaceLayout),
    children: [{ path: '', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard) }, { path: 'employees', canActivate: [adminGuard], loadComponent: () => import('./features/employees/employee-directory').then(m => m.EmployeeDirectory) }, { path: 'suppliers', loadComponent: () => import('./features/suppliers/supplier-directory').then(m => m.SupplierDirectory) }] },
  { path: '', component: PublicLayout, children: [
    { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },
    { path: '', loadComponent: () => import('./features/home/home').then(m => m.Home) }
  ] },
  { path: '**', redirectTo: '' }
];
