import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
export interface Breadcrumb { label: string; url?: string; }
@Component({
  selector: 'app-breadcrumbs',
  imports: [RouterLink],
  template: `<nav aria-label="Breadcrumb"><ol>@for (item of items(); track $index; let last = $last) {<li>@if (last) {<span aria-current="page">{{ item.label }}</span>} @else if (item.url) {<a [routerLink]="item.url">{{ item.label }}</a>} @else {<span>{{ item.label }}</span>}</li>}</ol></nav>`,
  styles: [`ol{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0;margin:0 0 16px;font-size:.8rem;color:var(--secondary-text)}li+li::before{content:'/';margin-right:8px}a{text-decoration:underline;text-underline-offset:3px}a:focus-visible{outline:2px solid currentColor}`]
})
export class Breadcrumbs { readonly items = input.required<readonly Breadcrumb[]>(); }
