import { Component, computed, input } from '@angular/core';
export type OrderStatus = 'DRAFT' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
const labels: Record<OrderStatus,string> = {DRAFT:'Draft',APPROVED:'Approved',PARTIALLY_RECEIVED:'Partially received',RECEIVED:'Received',CANCELLED:'Cancelled'};
@Component({
  selector: 'app-status-badge',
  template: `<span class="status" [attr.data-status]="status()">{{ label() }}</span>`,
  styles: [`.status{display:inline-block;border:1px solid #aaa;border-radius:999px;padding:4px 10px;font-size:.78rem;font-weight:600;background:#f5f5f5;color:#333}.status[data-status=APPROVED]{background:#eaf2ff;color:#17458a;border-color:#a9c4ef}.status[data-status=PARTIALLY_RECEIVED]{background:#fff4db;color:#754900;border-color:#dfc183}.status[data-status=RECEIVED]{background:#e6f5eb;color:#175c32;border-color:#a0cbb0}.status[data-status=CANCELLED]{background:#fceaea;color:#922727;border-color:#e0a5a5}`]
})
export class StatusBadge { readonly status = input.required<OrderStatus>(); readonly label = computed(() => labels[this.status()]); }
