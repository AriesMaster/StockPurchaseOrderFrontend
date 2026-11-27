import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeout } from 'rxjs';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { Breadcrumbs } from '../../shared/components/breadcrumbs/breadcrumbs';
import { SupplierService } from './services/supplier.service';
import { SupplierPage } from './models/supplier.models';
import { ProductService } from '../products/services/product.service';
import { ProductPage } from '../products/models/product.models';
import { SupplierCatalogueService, OfferPage, SupplierOffer } from './services/supplier-catalogue.service';
import { toApiProblem } from '../../core/api-problem';

@Component({
 selector:'app-supplier-catalogue',
 imports:[CurrencyPipe,PageHeader,Breadcrumbs],
 template: `
 <app-breadcrumbs [items]="[{label:'Workspace'},{label:'Supplier catalogues'}]" />
 <app-page-header title="Supplier catalogues" description="Assign products and purchasing prices to each supplier." />
 <section class="surface-card editor-card">
 <h2>Select supplier</h2>
 <form class="toolbar" (submit)="$event.preventDefault();supplierSearch=q.value;loadSuppliers(0)">
 <input #q placeholder="Search active suppliers" aria-label="Search suppliers" maxlength="150"><button type="submit" [disabled]="busy()">Search</button>
 </form>
 @if(suppliers();as data){
 <div class="toolbar"><select #supplier aria-label="Supplier" [value]="supplierId()??''" [disabled]="busy()" (change)="choose(supplier.value)"><option value="">Choose supplier</option>@for(s of data.content;track s.id){<option [value]="s.id">{{s.name}}</option>}</select>
 <button type="button" [disabled]="busy()||data.number===0" (click)="loadSuppliers(data.number-1)">Previous</button><button type="button" [disabled]="busy()||data.number+1>=data.totalPages" (click)="loadSuppliers(data.number+1)">Next</button></div>}
 @if(supplierName()){<p>Selected: <strong>{{supplierName()}}</strong></p>}
 @if(error()){<p role="alert" class="feedback error">{{error()}}</p>}
 @if(notice()){<p role="status" class="feedback success">{{notice()}}</p>}
 </section>
 @if(supplierId()){
 <section class="surface-card editor-card">
 <h2>Assign or update a product</h2>
 <p class="muted">Choose a product and enter the supplier's agreed unit price. Updating an existing assignment replaces its price.</p>
 <form class="toolbar" (submit)="$event.preventDefault();productSearch=pq.value;loadProducts(0)"><input #pq placeholder="Find product by name or SKU" aria-label="Search products" maxlength="150"><button type="submit" [disabled]="busy()">Search</button></form>
 @if(products();as data){
 <div class="toolbar"><select #product aria-label="Product" [disabled]="busy()" [value]="sku()" (change)="selectProduct(product.value)"><option value="">Choose product</option>@for(p of data.content;track p.sku){<option [value]="p.sku">{{p.name}} ({{p.sku}})</option>}</select><button type="button" [disabled]="busy()||data.number===0" (click)="loadProducts(data.number-1)">Previous</button><button type="button" [disabled]="busy()||data.number+1>=data.totalPages" (click)="loadProducts(data.number+1)">Next</button></div>}
 @if(sku()){<div class="toolbar"><strong>{{sku()}}</strong><label>Unit price (ZAR) <input #amount inputmode="decimal" [value]="price()" (input)="price.set(amount.value)" [disabled]="busy()"></label><button class="primary" type="button" [disabled]="busy()||!validPrice()" (click)="save(sku(),NumberValue(),true)">Save active assignment</button></div>}
 </section>
 <section class="surface-card directory">
 <h2>Assigned products</h2><p class="muted">Existing supplier-specific prices and availability.</p>
 @if(offers();as data){
 <div class="table-scroll"><table><thead><tr><th>SKU</th><th>Product</th><th>Price</th><th>Availability</th><th>Actions</th></tr></thead><tbody>
 @for(offer of data.content;track offer.sku){<tr><td>{{offer.sku}}</td><td>{{offer.name}}</td><td>{{offer.unitPrice|currency:'ZAR':'R':'1.2-2'}}</td><td>{{offer.active&&offer.productActive?'Active':'Inactive'}}</td><td><button type="button" [disabled]="busy()" (click)="edit(offer)">Edit price</button> <button type="button" [disabled]="busy()||(!offer.active&&!offer.productActive)" (click)="save(offer.sku,offer.unitPrice,!offer.active)">{{offer.active?'Deactivate':'Reactivate'}}</button></td></tr>}@empty{<tr><td colspan="5">No assignments yet.</td></tr>}
 </tbody></table></div><div class="pager"><span>{{data.totalElements}} assignments</span><button type="button" [disabled]="busy()||data.number===0" (click)="loadOffers(data.number-1)">Previous</button><button type="button" [disabled]="busy()||data.number+1>=data.totalPages" (click)="loadOffers(data.number+1)">Next</button></div>}
 </section>}
 `,
 styleUrl:'../purchase-orders/purchase-order-directory.scss'
})
export class SupplierCatalogue {
 private readonly supplierApi=inject(SupplierService);private readonly productApi=inject(ProductService);private readonly api=inject(SupplierCatalogueService);private readonly destroy=inject(DestroyRef);
 readonly suppliers=signal<SupplierPage|null>(null);readonly products=signal<ProductPage|null>(null);readonly offers=signal<OfferPage|null>(null);
 readonly supplierId=signal<number|null>(null);readonly supplierName=signal('');readonly sku=signal('');readonly price=signal('');
 readonly busy=signal(false);readonly error=signal('');readonly notice=signal('');
 supplierSearch='';productSearch='';
 constructor(){this.loadSuppliers(0);}
 private run<T>(request:import('rxjs').Observable<T>,next:(value:T)=>void){
  this.busy.set(true);this.error.set('');
  request.pipe(timeout(30000),takeUntilDestroyed(this.destroy)).subscribe({next:value=>{this.busy.set(false);next(value);},error:err=>{this.busy.set(false);this.error.set(toApiProblem(err).detail);}});
 }
 loadSuppliers(page:number){if(!this.busy())this.run(this.supplierApi.list(page,20,this.supplierSearch,true),value=>this.suppliers.set(value));}
 choose(value:string){
  const s=this.suppliers()?.content.find(s=>s.id===Number(value));if(!s||this.busy())return;
  this.supplierId.set(s.id);this.supplierName.set(s.name);this.sku.set('');this.price.set('');this.offers.set(null);this.products.set(null);this.notice.set('');this.productSearch='';
  this.run(this.productApi.list(0,20,'',true),value=>{this.products.set(value);this.loadOffers(0);});
 }
 loadProducts(page:number){if(!this.busy())this.run(this.productApi.list(page,20,this.productSearch,true),value=>this.products.set(value));}
 loadOffers(page:number){const id=this.supplierId();if(id&&!this.busy())this.run(this.api.list(id,page,20,'',false),value=>this.offers.set(value));}
 selectProduct(value:string){const p=this.products()?.content.find(p=>p.sku===value);this.sku.set(p?.sku??'');this.price.set(p?String(p.unitPrice):'');}
 edit(offer:SupplierOffer){this.sku.set(offer.sku);this.price.set(offer.unitPrice.toFixed(2));}
 validPrice(){return /^\d{1,10}(\.\d{1,2})?$/.test(this.price());}
 NumberValue(){return Number(this.price());}
 save(sku:string,price:number,active:boolean){const id=this.supplierId();if(!id||!sku||this.busy())return;this.run(this.api.put(id,sku,price,active),()=>{this.notice.set('Supplier catalogue updated.');this.sku.set('');this.price.set('');this.loadOffers(0);});}
}
