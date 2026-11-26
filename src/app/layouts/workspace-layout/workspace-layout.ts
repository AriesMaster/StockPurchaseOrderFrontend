import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap, finalize, timeout } from 'rxjs';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthStore } from '../../core/auth/services/auth.store';

@Component({
  selector: 'app-workspace-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatTooltipModule],
  templateUrl: './workspace-layout.html',
  styleUrl: './workspace-layout.scss',
})
export class WorkspaceLayout {
  readonly auth = inject(AuthStore);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  readonly signingOut = signal(false);
  readonly logoutError = signal('');

  logout(): void {
    if (this.signingOut()) return;
    this.signingOut.set(true);
    this.logoutError.set('');
    this.http.get<void>('/api/auth/csrf').pipe(
      switchMap(() => this.http.post<void>('/api/auth/logout', {})),
      timeout(30000),
      finalize(() => this.signingOut.set(false))
    ).subscribe({
      next: () => {
        this.auth.clear();
        void this.router.navigateByUrl('/login', { replaceUrl: true });
      },
      error: () => this.logoutError.set('Sign out failed. Please try again.')
    });
  }
  readonly open = signal(false);
  readonly helpOpen = signal(false);
  readonly roleLabel = computed(() => ({
    ADMIN: 'Administrator', PURCHASING_OFFICER: 'Purchasing Officer',
    APPROVER: 'Approver', WAREHOUSE_OFFICER: 'Warehouse Officer'
  }[this.auth.role() ?? 'ADMIN']));
  readonly modules = computed(() => {
    const role = this.auth.role();
    return [
      ...(role === 'ADMIN' ? ['Employees'] : []),
      'Purchase orders',
      ...(role === 'ADMIN' || role === 'PURCHASING_OFFICER' ? ['Suppliers', 'Products'] : []),
      ...(role === 'ADMIN' || role === 'APPROVER' ? ['Approvals'] : []),
      ...(role === 'ADMIN' || role === 'WAREHOUSE_OFFICER' ? ['Deliveries'] : []),
      'Inventory'
    ];
  });
  toggleMenu(): void { this.open.update(value => !value); }
  toggleHelp(): void { this.helpOpen.update(value => !value); }
}
