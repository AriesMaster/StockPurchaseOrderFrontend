import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
