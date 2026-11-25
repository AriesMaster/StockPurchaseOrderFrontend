import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router, provideRouter } from '@angular/router';
import { beforeEach, describe, it, expect } from 'vitest';
import { AuthStore } from '../services/auth.store';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';

describe('authentication and role guards', () => {
  let store: AuthStore;
  let router: Router;
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    store = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
  });
  function signIn() {
    store.setSession({ accessToken: 'test-token', user: { id: 1, email: 'admin@example.com', role: 'ADMIN' } });
  }
  it('redirects anonymous users to login', () => {
    expect(TestBed.runInInjectionContext(() => authGuard(route, state))).toEqual(router.createUrlTree(['/login']));
  });
  it('allows authenticated users', () => {
    signIn();
    expect(TestBed.runInInjectionContext(() => authGuard(route, state))).toBe(true);
  });
  it('allows matching roles', () => {
    signIn();
    expect(TestBed.runInInjectionContext(() => roleGuard('ADMIN')(route, state))).toBe(true);
  });
  it('rejects mismatched roles', () => {
    signIn();
    expect(TestBed.runInInjectionContext(() => roleGuard('APPROVER')(route, state))).toEqual(router.createUrlTree(['/']));
  });
  it('redirects anonymous users even on role-protected routes', () => {
    expect(TestBed.runInInjectionContext(() => roleGuard('ADMIN')(route, state))).toEqual(router.createUrlTree(['/login']));
  });
});
