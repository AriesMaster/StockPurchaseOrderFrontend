import { Component, inject } from '@angular/core';
import { AuthStore } from '../../core/auth/services/auth.store';

@Component({
  selector: 'app-dashboard',
  template: `
    <p class="eyebrow">STOCKFLOW / OVERVIEW</p>
    <h1>Workspace overview</h1>
    <p>Signed in as {{ auth.user()?.email }}</p>
    <div class="metrics">
      @for (label of metrics; track label) {
        <article class="surface-card"><h2>{{ label }}</h2><strong>—</strong><p>Data integration pending</p></article>
      }
    </div>
    <section class="surface-card"><h2>Activity</h2><p>Purchase order and inventory activity will appear here once the business APIs are connected.</p></section>
  `,
  styles: [`
    .eyebrow { font-size:.75rem; letter-spacing:.1em; }
    h1 { font-size:clamp(1.6rem,4vw,2.4rem); }
    .metrics { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr)); gap:16px; margin-block:24px; }
    h2 { font-size:1rem; } strong { font-size:2rem; } article p { font-size:.8rem; color:var(--secondary-text); }
  `],
})
export class Dashboard {
  readonly auth = inject(AuthStore);
  readonly metrics = ['Purchase orders', 'Pending approvals', 'Outstanding deliveries', 'Inventory items'];
}
