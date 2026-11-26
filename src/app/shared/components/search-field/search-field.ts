import { Component, input, output } from '@angular/core';
@Component({
 selector:'app-search-field',
 template:`<label><span>{{ label() }}</span><div class="field"><input type="search" [value]="value()" [placeholder]="placeholder()" (input)="change($event)" /><button type="button" [disabled]="!value()" (click)="valueChange.emit('')">Clear</button></div></label>`,
 styles:[`label{display:block;font-size:.85rem;font-weight:600}.field{display:flex;gap:8px;margin-top:6px}input{min-width:0;flex:1;padding:10px;border:1px solid #888;border-radius:8px;font:inherit}button{font:inherit;padding:8px 12px;border:1px solid #888;border-radius:8px;background:white;cursor:pointer}button:disabled{opacity:.5;cursor:default}input:focus-visible,button:focus-visible{outline:3px solid #555;outline-offset:2px}`]
})
export class SearchField {
 readonly label=input('Search');
 readonly placeholder=input('Search records...');
 readonly value=input('');
 readonly valueChange=output<string>();
 change(event:Event):void { this.valueChange.emit((event.target as HTMLInputElement).value); }
}
