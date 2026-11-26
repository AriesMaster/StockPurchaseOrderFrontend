import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-info-tooltip',
  template: `
    <span class="help">
      <button type="button" [attr.aria-label]="'About ' + label()"
        [attr.aria-expanded]="expanded()" (click)="expanded.update(value => !value)"
        (keydown.escape)="expanded.set(false)">i</button>
      @if (expanded()) { <span class="explanation" role="status">{{ description() }}</span> }
    </span>
  `,
  styles: [`
    :host { display:inline-block; max-width:100%; }
    .help { display:inline-flex; align-items:center; flex-wrap:wrap; gap:8px; }
    button { width:28px; height:28px; border:1px solid #777; border-radius:50%; background:white; color:#333; font:600 14px inherit; cursor:pointer; }
    button:focus-visible { outline:3px solid #555; outline-offset:3px; }
    .explanation { display:block; max-width:280px; padding:10px; background:#f5f5f5; border:1px solid #ccc; border-radius:8px; color:#333; font-size:.85rem; font-weight:400; }
  `]
})
export class InfoTooltip {
  readonly label = input.required<string>();
  readonly description = input.required<string>();
  readonly expanded = signal(false);
}
