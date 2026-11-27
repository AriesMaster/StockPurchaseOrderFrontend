import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, timeout, Observable } from 'rxjs';
import { AuthStore } from '../../core/auth/services/auth.store';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { Breadcrumbs } from '../../shared/components/breadcrumbs/breadcrumbs';
import { ConfirmationDialog, ConfirmationData } from '../../shared/components/confirmation-dialog/confirmation-dialog';
import { ProductService } from './services/product.service';
import { Product, ProductPage } from './models/product.models';

@Component({
 selector: 'app-product-directory',
 imports: [ReactiveFormsModule, MatDialogModule, CurrencyPipe, PageHeader, Breadcrumbs],
 template: `
 <app-breadcrumbs [items]="[{label:'Workspace'},{label:'Products'}]" />
 <app-page-header title="Products" description="Manage the product catalogue and unit prices." />
 @if(formOpen() && auth.role()==='ADMIN'){
 <section class="surface-card editor-card" aria-labelledby="product-editor-title">
 <form class="editor" [formGroup]="form" (ngSubmit)="save()" novalidate>
 <h2 id="product-editor-title">{{editing() ? 'Edit product' : 'Add product'}}</h2>
 <p class="muted">Enter the product details. The SKU cannot be changed after creation.</p>
 @if(error()){<p class="feedback failure editor-feedback" role="alert">{{error()}}</p>}
 <div class="fields">
 <label>SKU (required)<input formControlName="sku" maxlength="80" placeholder="PAINT-20L" />
 @if(form.controls.sku.touched && form.controls.sku.invalid){<span class="field-error">Use letters, numbers, dots, underscores or hyphens, starting with a letter or number.</span>}</label>
 <label>Product name (required)<input formControlName="name" maxlength="150" />
 @if(form.controls.name.touched && form.controls.name.invalid){<span class="field-error">Enter a product name.</span>}</label>
 <label>Unit price (ZAR, required)<input formControlName="unitPrice" inputmode="decimal" maxlength="13" placeholder="0.00" />
 @if(form.controls.unitPrice.touched && form.controls.unitPrice.invalid){<span class="field-error">Enter a non-negative price with up to two decimal places.</span>}</label>
 </div>
 <div class="controls"><button class="primary" type="submit" [disabled]="busy()">{{saving() ? 'Saving…' : 'Save product'}}</button><button type="button" [disabled]="busy()" (click)="formOpen.set(false)">Cancel</button></div>
 </form>
 </section>}
 <section class="surface-card directory">
 <div class="toolbar"><div><h2>Product directory</h2><p class="muted">Manage stock-keeping identifiers, names and prices.</p></div>
 @if(auth.role()==='ADMIN'){<button type="button" class="primary" [disabled]="busy() || formOpen()" (click)="openForm(null)">Add product</button>}</div>
 @if(notice()){<p class="feedback success" role="status">{{notice()}}</p>}
 @if(error() && !formOpen()){<p class="feedback failure" role="alert">{{error()}}</p>}
 <form class="toolbar search" (submit)="$event.preventDefault(); search()"><label>Search by name or SKU<input [formControl]="query" maxlength="150" placeholder="Search products…" /></label>
 <div class="controls"><button type="submit" [disabled]="busy()">Search</button><button type="button" [disabled]="busy()" (click)="query.reset(); search()">Clear</button><button type="button" [disabled]="busy()" (click)="load(page()?.number ?? 0)">Refresh</button></div></form>
 @if(loading()){<p role="status">Loading products…</p>}
 @if(page(); as data){
 @if(data.content.length){<div class="table-scroll" tabindex="0"><table><thead><tr><th>SKU</th><th>Product name</th><th>Unit price</th><th>Status</th>@if(auth.role()==='ADMIN'){<th>Actions</th>}</tr></thead><tbody>
 @for(product of data.content; track product.sku){<tr><td>{{product.sku}}</td><td class="product-name">{{product.name}}</td><td class="price">{{product.unitPrice | currency:'ZAR':'symbol':'1.2-2'}}</td><td><span class="status" [class.inactive]="!product.active">{{product.active?'Active':'Inactive'}}</span></td>
 @if(auth.role()==='ADMIN'){<td><div class="row-actions"><button type="button" [disabled]="busy() || formOpen()" (click)="openForm(product)">Edit</button><button type="button" [disabled]="busy() || formOpen()" (click)="requestStatus(product)">{{product.active?'Deactivate':'Reactivate'}}</button></div></td>}</tr>}
 </tbody></table></div>}@else{<div class="empty"><strong>No products found</strong><p>Try another search or ask an administrator to add a product.</p></div>}
 <div class="toolbar pagination"><span>{{data.totalElements}} {{data.totalElements === 1 ? 'product' : 'products'}} · Page {{data.totalPages ? data.number+1 : 0}} of {{data.totalPages}}</span><div class="controls"><button type="button" [disabled]="busy() || data.number===0" (click)="load(data.number-1)">Previous</button><button type="button" [disabled]="busy() || data.number+1>=data.totalPages" (click)="load(data.number+1)">Next</button></div></div>}
 </section>`,
 styles:[`
 :host{display:block;min-width:0}
 .directory,.editor-card{margin-top:24px;padding:clamp(16px,2.2vw,28px);min-width:0}
 .toolbar,.controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
 .toolbar{justify-content:space-between;margin-bottom:20px}
 h2{font-size:1.1rem;margin:0}
 .muted{font-size:.85rem;color:#666;margin:5px 0 0}
 .editor{margin:0}.editor-feedback{margin-top:16px}.editor .controls{justify-content:flex-end}
 .fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:16px 0}
 .price{font-variant-numeric:tabular-nums;white-space:nowrap}input:disabled{background:#eee;color:#555} .field-error{font-weight:400;font-size:.78rem;color:#9b2222}
 label{display:flex;flex-direction:column;gap:6px;font-size:.85rem;font-weight:600;min-width:0}
 input,textarea{box-sizing:border-box;width:100%;padding:10px 12px;border:1px solid #bbb;border-radius:8px;background:white;color:#111;font:inherit;font-weight:400}
 input:focus,textarea:focus{outline:2px solid #333;outline-offset:2px}
 button{background:white;color:#111;border:1px solid #bbb;border-radius:8px;padding:8px 12px;cursor:pointer;font:inherit;font-size:.85rem;white-space:nowrap}
 button:hover:not(:disabled){background:#eee}button.primary{background:#111;color:white;border-color:#111}button.primary:hover:not(:disabled){background:#333}button:disabled{opacity:.45;cursor:default}
 .search{justify-content:flex-start;align-items:end;margin:0 0 20px}.search label{flex:1 1 220px;max-width:340px}
 .table-scroll{overflow-x:auto;max-width:100%;border:1px solid #e2e2e2;border-radius:10px}
 table{width:100%;border-collapse:collapse;text-align:left;font-size:.82rem;table-layout:auto}
 th,td{height:auto;padding:12px 10px;border-bottom:1px solid #e5e5e5;vertical-align:middle;white-space:normal;overflow-wrap:anywhere}
 th{background:#f6f6f6;font-weight:600}tbody tr:last-child td{border-bottom:0}tbody tr:hover{background:#fafafa}
 .product-name{font-weight:600;min-width:110px}
 .row-actions{display:flex;flex-direction:column;align-items:stretch;gap:5px}.row-actions button{padding:5px 9px;font-size:.78rem}
 .status{display:inline-block;background:#e9f4eb;color:#235b32;padding:4px 9px;border-radius:20px;white-space:nowrap;font-size:.78rem}.status.inactive{background:#eee;color:#555}
 .pagination{margin:16px 0 0;font-size:.85rem;color:#555}
 .feedback{padding:12px 14px;border-radius:8px;margin:0 0 16px;font-size:.9rem}.success{background:#edf6ef;color:#235b32;border:1px solid #c6e0cc}.failure{background:#fff1f1;border:1px solid #e9c4c4}[role=alert]{color:#9b2222}
 .empty{text-align:center;padding:32px 12px;color:#555}.empty p{margin:6px 0 0;font-size:.85rem}
 @media(max-width:600px){.fields{grid-template-columns:1fr}.editor .controls{justify-content:flex-start}.search label{max-width:none}.table-scroll table{min-width:560px}}
 `]
})
export class ProductDirectory {
 readonly auth=inject(AuthStore);
 private readonly api=inject(ProductService);
 private readonly fb=inject(FormBuilder);
 private readonly destroy=inject(DestroyRef);
 private readonly dialog=inject(MatDialog);
 readonly page=signal<ProductPage|null>(null);
 readonly loading=signal(false);
 readonly saving=signal(false);
 readonly error=signal('');
 readonly notice=signal('');
 readonly formOpen=signal(false);
 readonly editing=signal<Product|null>(null);
 readonly query=this.fb.nonNullable.control('',Validators.maxLength(150));
 private appliedSearch='';
 readonly form=this.fb.nonNullable.group({
  sku:['',[Validators.required,Validators.maxLength(80),Validators.pattern(/^[A-Za-z0-9][A-Za-z0-9._-]*$/)]],
  name:['',[Validators.required,Validators.maxLength(150),Validators.pattern(/.*\S.*/s)]],
  unitPrice:['',[Validators.required,Validators.pattern(/^\d{1,10}(\.\d{1,2})?$/)]]
 });
 constructor(){this.load(0);}
 busy(){return this.loading() || this.saving();}
 search(){if(this.busy() || this.query.invalid)return;this.appliedSearch=this.query.value.trim();this.load(0);}
 load(number:number){
  if(this.loading() || number<0)return;
  this.loading.set(true);this.error.set('');
  this.api.list(number,20,this.appliedSearch).pipe(timeout(30000),takeUntilDestroyed(this.destroy),finalize(()=>this.loading.set(false))).subscribe({
   next:data=>this.page.set(data),error:()=>{this.page.set(null);this.error.set('Unable to load products. Please retry.');}
  });
 }
 openForm(product:Product|null){
  if(this.auth.role()!=='ADMIN'||this.busy()||this.formOpen())return;
  this.editing.set(product);this.error.set('');this.notice.set('');
  this.form.reset({sku:product?.sku??'',name:product?.name??'',unitPrice:product?product.unitPrice.toFixed(2):''});
  if(product)this.form.controls.sku.disable();else this.form.controls.sku.enable();
  this.formOpen.set(true);
 }
 save(){
  if(this.auth.role()!=='ADMIN'||this.busy()||!this.formOpen())return;
  this.form.markAllAsTouched();if(this.form.invalid)return;
  const raw=this.form.getRawValue();
  const request={name:raw.name.trim(),unitPrice:Number(raw.unitPrice)};
  const product=this.editing();
  this.mutate(product?this.api.update(product.sku,request):this.api.create({...request,sku:raw.sku}),product?'Product updated.':'Product created.',true,!product);
 }
 requestStatus(product:Product){
  if(this.auth.role()!=='ADMIN'||this.busy()||this.formOpen())return;
  const action=product.active?'Deactivate':'Reactivate';
  this.dialog.open<ConfirmationDialog,ConfirmationData,boolean>(ConfirmationDialog,{data:{title:action+' product?',description:action+' '+product.name+'? The product record will be retained.',confirmLabel:action},width:'440px',maxWidth:'92vw',autoFocus:'first-tabbable',restoreFocus:true}).afterClosed().pipe(takeUntilDestroyed(this.destroy)).subscribe(ok=>{
   if(ok===true && this.auth.role()==='ADMIN'&&!this.busy()&&!this.formOpen())this.mutate(this.api.changeStatus(product.sku,!product.active),product.active?'Product deactivated.':'Product reactivated.',false);
  });
 }
 private mutate(request:Observable<Product>,message:string,close:boolean,creating=false){
  this.saving.set(true);this.error.set('');this.notice.set('');
  request.pipe(timeout(30000),takeUntilDestroyed(this.destroy),finalize(()=>this.saving.set(false))).subscribe({
   next:()=>{if(close){this.formOpen.set(false);this.form.reset();}this.notice.set(message);this.load(close?0:this.page()?.number??0);},
   error:(err:unknown)=>this.error.set(err instanceof HttpErrorResponse && err.status===409
    ? (creating?'A product with this SKU already exists.':'Product changed concurrently. Close the editor and refresh before retrying.')
    : 'Unable to confirm product change. Refresh before retrying.')
  });
 }
}
