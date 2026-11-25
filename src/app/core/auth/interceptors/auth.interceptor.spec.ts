import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from '../services/auth.store';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let store: AuthStore;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()] });
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
});
