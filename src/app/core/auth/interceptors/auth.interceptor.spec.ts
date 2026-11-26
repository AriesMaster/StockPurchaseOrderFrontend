import { Router, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from '../services/auth.store';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let store: AuthStore;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()] });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    store = TestBed.inject(AuthStore);
    store.setSession({ accessToken: 'test-token', user: { id: 1, email: 'admin@example.com', role: 'ADMIN' } });
  });
  afterEach(() => controller.verify());
  it('attaches token to relative API requests', () => {
    http.get('/api/products').subscribe();
    const request = controller.expectOne('/api/products');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush([]);
  });
  it.each(['https://example.com/api/products', '//example.com/api/products', '/assets/logo.svg', '/api/auth/login', '/api/auth/refresh', '/api/../assets/logo.svg'])('does not attach token to %s', url => {
    http.get(url).subscribe();
    const request = controller.expectOne(url);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
  it('does not attach token without a session', () => {
    store.clear();
    http.get('/api/products').subscribe();
    const request = controller.expectOne('/api/products');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });
  it('refreshes an expired token and retries once', () => {
    let result: unknown;
    http.get('/api/products').subscribe(value => result = value);
    controller.expectOne('/api/products').flush(null, { status: 401, statusText: 'Unauthorized' });
    controller.expectOne('/api/auth/csrf').flush(null);
    controller.expectOne('/api/auth/refresh').flush({
      accessToken: 'new-token', user: store.user()
    });
    const retry = controller.expectOne('/api/products');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush([]);
    expect(result).toEqual([]);
  });

  it('clears the session and redirects when refresh fails', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    let status: number | undefined;
    http.get('/api/products').subscribe({ error: error => status = error.status });
    controller.expectOne('/api/products').flush(null, { status: 401, statusText: 'Unauthorized' });
    controller.expectOne('/api/auth/csrf').flush(null);
    controller.expectOne('/api/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(store.isAuthenticated()).toBe(false);
    expect(status).toBe(401);
    expect(navigate).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });

  it('does not refresh on forbidden responses', () => {
    let status: number | undefined;
    http.get('/api/products').subscribe({ error: error => status = error.status });
    controller.expectOne('/api/products').flush(null, { status: 403, statusText: 'Forbidden' });
    controller.expectNone('/api/auth/refresh');
    expect(status).toBe(403);
  });

  it('does not retry indefinitely when the renewed token is rejected', () => {
    let status: number | undefined;
    http.get('/api/products').subscribe({ error: error => status = error.status });
    controller.expectOne('/api/products').flush(null, { status: 401, statusText: 'Unauthorized' });
    controller.expectOne('/api/auth/csrf').flush(null);
    controller.expectOne('/api/auth/refresh').flush({
      accessToken: 'new-token', user: store.user()
    });
    controller.expectOne('/api/products').flush(null, { status: 401, statusText: 'Unauthorized' });
    controller.expectNone('/api/auth/refresh');
    expect(status).toBe(401);
  });
});
