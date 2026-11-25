import { Injectable, computed, signal } from '@angular/core';
import { AuthResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly session = signal<AuthResponse | null>(null);
  readonly user = computed(() => this.session()?.user ?? null);
  readonly accessToken = computed(() => this.session()?.accessToken ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly role = computed(() => this.user()?.role ?? null);

  setSession(response: AuthResponse): void {
    this.session.set(response);
  }

  clear(): void {
    this.session.set(null);
  }
}
