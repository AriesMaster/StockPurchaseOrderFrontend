import { Component, input } from '@angular/core';
@Component({
  selector: 'app-page-header',
  template: `<header><div><h1>{{ title() }}</h1><p>{{ description() }}</p></div><div class="actions"><ng-content /></div></header>`,
  styles: [`header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:24px}h1{font-size:clamp(1.6rem,4vw,2.4rem);margin:0 0 8px}p{margin:0;color:var(--secondary-text)}.actions{display:flex;gap:8px;flex-wrap:wrap}`]
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly description = input('');
}
