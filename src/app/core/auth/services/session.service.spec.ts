import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { SessionService } from './session.service';
import { AuthStore } from './auth.store';
import { AuthResponse } from '../models/auth.models';

describe('SessionService', () => {
  let service: SessionService;
  let store: AuthStore;
  let http: HttpTestingController;
  const session: AuthResponse = {
    accessToken: 'renewed-token',
    user: { id: 1, email: 'admin@example.com', role: 'ADMIN' }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(SessionService);
    store = TestBed.inject(AuthStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('restores authentication after successful refresh', () => {
    let result: boolean | undefined;
    service.refresh().subscribe(value => result = value);
    http.expectOne('/api/auth/csrf').flush(null);
    const request = http.expectOne('/api/auth/refresh');
    expect(request.request.method).toBe('POST');
    request.flush(session);
    expect(result).toBe(true);
    expect(store.accessToken()).toBe('renewed-token');
    expect(store.role()).toBe('ADMIN');
  });

  it('clears authentication when refresh is rejected', () => {
    store.setSession(session);
    let result: boolean | undefined;
    service.refresh().subscribe(value => result = value);
    http.expectOne('/api/auth/csrf').flush(null);
    http.expectOne('/api/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(result).toBe(false);
    expect(store.isAuthenticated()).toBe(false);
  });

  it('shares one refresh request between concurrent subscribers', () => {
    const results: boolean[] = [];
    service.refresh().subscribe(value => results.push(value));
    service.refresh().subscribe(value => results.push(value));
    http.expectOne('/api/auth/csrf').flush(null);
    http.expectOne('/api/auth/refresh').flush(session);
    expect(results).toEqual([true, true]);
  });

  it('does not refresh when CSRF initialization fails', () => {
    let result: boolean | undefined;
    service.refresh().subscribe(value => result = value);
    http.expectOne('/api/auth/csrf').flush(null, { status: 503, statusText: 'Unavailable' });
    http.expectNone('/api/auth/refresh');
    expect(result).toBe(false);
  });
});
