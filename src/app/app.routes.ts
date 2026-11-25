import { Routes } from '@angular/router';
import { PublicLayout } from './layouts/public-layout/public-layout';
import { authGuard } from './core/auth/guards/auth.guard';

export const routes: Routes = [
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./layouts/workspace-layout/workspace-layout').then(m => m.WorkspaceLayout),
    children: [{ path: '', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard) }] },
  { path: '', component: PublicLayout, children: [
    { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },
    { path: '', loadComponent: () => import('./features/home/home').then(m => m.Home) }
  ] },
  { path: '**', redirectTo: '' }
];
