import { Component, computed, inject } from '@angular/core';
import { AuthStore } from '../../core/auth/services/auth.store';
import { InfoTooltip } from '../../shared/components/info-tooltip/info-tooltip';

import { PageHeader } from '../../shared/components/page-header/page-header';
import { Breadcrumbs } from '../../shared/components/breadcrumbs/breadcrumbs';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

const metrics = {
  orders: { label: 'Purchase orders', description: 'Orders placed with suppliers to purchase products.' },
  approvals: { label: 'Pending approvals', description: 'Orders that need review before goods can be received.' },
  deliveries: { label: 'Outstanding deliveries', description: 'Approved orders with goods still due from suppliers.' },
  inventory: { label: 'Inventory items', description: 'Products tracked in your stock records.' },
  employees: { label: 'Employees', description: 'Employee accounts with access to StockFlow.' },
  drafts: { label: 'Draft orders', description: 'Orders prepared but not yet approved.' }
};

@Component({
  selector: 'app-dashboard',
  imports: [InfoTooltip, PageHeader, Breadcrumbs, EmptyState],
  template: `
    <app-breadcrumbs [items]="[{label: 'Workspace'}, {label: 'Overview'}]" />
    <app-page-header [title]="heading()" [description]="introduction()" />
    <div class="metrics">
      @for (metric of visibleMetrics(); track metric.label) {
        <article class="surface-card">
          <div class="metric-heading"><h2>{{ metric.label }}</h2><app-info-tooltip [label]="metric.label" [description]="metric.description" /></div>
          <strong aria-label="Data unavailable">—</strong><p>Data not available yet</p>
        </article>
      }
    </div>
    <app-empty-state title="Live activity is not available yet" description="Business modules are currently being developed. Live records will appear when the APIs are connected." />
  `,
  styles: [`
    .eyebrow { font-size:.75rem; letter-spacing:.1em; }
    h1 { font-size:clamp(1.6rem,4vw,2.4rem); }
    .metrics { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr)); gap:16px; margin-block:24px; }
    .metric-heading { display:flex; align-items:flex-start; gap:8px; flex-wrap:wrap; }
    h2 { font-size:1rem; } strong { font-size:2rem; } article p { font-size:.8rem; color:var(--secondary-text); }
  `],
})
export class Dashboard {
  readonly auth = inject(AuthStore);
  readonly heading = computed(() => {
    switch (this.auth.role()) {
      case 'ADMIN': return 'Administration overview';
      case 'PURCHASING_OFFICER': return 'Purchasing overview';
      case 'APPROVER': return 'Approvals overview';
      case 'WAREHOUSE_OFFICER': return 'Warehouse overview';
      default: return 'Workspace overview';
    }
  });
  readonly introduction = computed(() => 'Welcome back. ' + this.guidance());
  readonly guidance = computed(() => {
    switch (this.auth.role()) {
      case 'ADMIN': return 'Manage employee access and oversee procurement.';
      case 'PURCHASING_OFFICER': return 'Prepare purchase orders and track supplier deliveries.';
      case 'APPROVER': return 'Review purchase orders before goods are received.';
      case 'WAREHOUSE_OFFICER': return 'Track incoming deliveries and stock levels.';
      default: return 'Explore your workspace.';
    }
  });
  readonly visibleMetrics = computed(() => {
    switch (this.auth.role()) {
      case 'ADMIN': return [metrics.employees, metrics.orders, metrics.approvals, metrics.inventory];
      case 'PURCHASING_OFFICER': return [metrics.drafts, metrics.orders, metrics.deliveries];
      case 'APPROVER': return [metrics.approvals, metrics.orders];
      case 'WAREHOUSE_OFFICER': return [metrics.deliveries, metrics.inventory];
      default: return [];
    }
  });
}
