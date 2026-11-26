import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, map, catchError, finalize, shareReplay, tap, timeout } from 'rxjs';
import { AuthStore } from './auth.store';
import { AuthResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthStore);
  private pending?: Observable<boolean>;

  refresh(): Observable<boolean> {
    if (this.pending) return this.pending;
    this.pending = this.http.get<void>('/api/auth/csrf').pipe(
      switchMap(() => this.http.post<AuthResponse>('/api/auth/refresh', {})),
      timeout(30000),
      tap(response => this.auth.setSession(response)),
      map(() => true),
      catchError(() => {
        this.auth.clear();
        return of(false);
      }),
      finalize(() => { this.pending = undefined; }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.pending;
  }
}
