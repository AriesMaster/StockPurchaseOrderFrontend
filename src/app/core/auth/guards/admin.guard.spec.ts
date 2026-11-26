import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router, provideRouter } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { AuthStore } from '../services/auth.store';
import { SessionService } from '../services/session.service';
import { Role } from '../models/auth.models';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  let store: AuthStore;
  let router: Router;
  const session = { refresh: vi.fn() };
  const run = () => TestBed.runInInjectionContext(() => adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
  beforeEach(() => {
    session.refresh.mockReset();
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: SessionService, useValue: session }] });
    store = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
  });
  function signIn(role: Role) {
    store.setSession({ accessToken: 'test-token', user: { id: 1, email: 'employee@example.test', role } });
  }
  it('allows administrators without refreshing', () => {
    signIn('ADMIN');
    expect(run()).toBe(true);
    expect(session.refresh).not.toHaveBeenCalled();
  });
  for (const role of ['PURCHASING_OFFICER', 'APPROVER', 'WAREHOUSE_OFFICER'] as const) {
    it('redirects ' + role + ' to the dashboard', () => {
      signIn(role);
      expect(run()).toEqual(router.createUrlTree(['/dashboard']));
      expect(session.refresh).not.toHaveBeenCalled();
    });
  }
  it('redirects to login when restoration fails', async () => {
    session.refresh.mockReturnValue(of(false));
    expect(await firstValueFrom(run() as Observable<unknown>)).toEqual(router.createUrlTree(['/login']));
  });
  it('allows a restored administrator session', async () => {
    session.refresh.mockImplementation(() => { signIn('ADMIN'); return of(true); });
    expect(await firstValueFrom(run() as Observable<unknown>)).toBe(true);
  });
  it('rejects a restored operational session', async () => {
    session.refresh.mockImplementation(() => { signIn('APPROVER'); return of(true); });
    expect(await firstValueFrom(run() as Observable<unknown>)).toEqual(router.createUrlTree(['/dashboard']));
  });
});
