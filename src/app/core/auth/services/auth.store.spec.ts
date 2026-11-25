import { describe, it, expect } from 'vitest';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  it('starts unauthenticated', () => {
    const store = new AuthStore();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.accessToken()).toBeNull();
  });

  it('exposes the current user and role', () => {
    const store = new AuthStore();
    store.setSession({ accessToken: 'test-token', user: { id: 1, email: 'admin@example.com', role: 'ADMIN' } });
    expect(store.isAuthenticated()).toBe(true);
    expect(store.role()).toBe('ADMIN');
    expect(store.accessToken()).toBe('test-token');
  });

  it('clears all session state', () => {
    const store = new AuthStore();
    store.setSession({ accessToken: 'test-token', user: { id: 1, email: 'admin@example.com', role: 'ADMIN' } });
    store.clear();
    expect(store.user()).toBeNull();
    expect(store.role()).toBeNull();
    expect(store.accessToken()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
  });
});
