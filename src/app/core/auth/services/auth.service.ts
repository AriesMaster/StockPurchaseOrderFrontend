import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthResponse, LoginRequest } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/auth';

  // Transport only: state transitions and refresh coordination will be added
  // once the backend response and CSRF contracts are verified.
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.base + '/login', request, { withCredentials: true });
  }

  refresh(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.base + '/refresh', {}, { withCredentials: true });
  }

  logout(): Observable<void> {
    return this.http.post<void>(this.base + '/logout', {}, { withCredentials: true });
  }
}
