import { Component, input } from '@angular/core';
@Component({
  selector: 'app-empty-state',
  template: `<section class="empty"><span class="symbol" aria-hidden="true">—</span><h2>{{ title() }}</h2><p>{{ description() }}</p><ng-content /></section>`,
  styles: [`.empty{text-align:center;padding:32px 16px;border:1px dashed var(--border-color);border-radius:12px;background:white}.symbol{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:50%;background:#eee;color:#333}h2{font-size:1.1rem;margin:12px 0 8px}p{color:var(--secondary-text);max-width:55ch;margin:0 auto 16px}`]
})
export class EmptyState { readonly title = input.required<string>(); readonly description = input.required<string>(); }
