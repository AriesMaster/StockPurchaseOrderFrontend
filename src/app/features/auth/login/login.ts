import { Component, signal, inject, DestroyRef } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { switchMap, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthStore } from '../../../core/auth/services/auth.store';
import { AuthResponse } from '../../../core/auth/models/auth.models';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly pending = signal(false);
  readonly showPassword = signal(false);
  readonly message = signal('');
  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.pending()) return;
    this.pending.set(true);
    this.message.set('');
    const credentials = this.form.getRawValue();
    this.http.get<void>('/api/auth/csrf').pipe(
      switchMap(() => this.http.post<AuthResponse>('/api/auth/login', credentials)),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.pending.set(false); this.form.controls.password.reset(); }),
    ).subscribe({
      next: response => {
        this.auth.setSession(response);
        void this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.message.set(error.status === 401 ? 'Invalid email or password.' :
          error.status === 403 ? 'Security verification failed. Please try again.' :
          'Unable to sign in right now. Please try again.');
      },
    });
  }
}
