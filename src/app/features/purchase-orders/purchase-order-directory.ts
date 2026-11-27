import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, timeout } from 'rxjs';
import { AuthStore } from '../../core/auth/services/auth.store';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { Breadcrumbs } from '../../shared/components/breadcrumbs/breadcrumbs';
import { toApiProblem } from '../../core/api-problem';
import { SupplierService } from '../suppliers/services/supplier.service';
import { Supplier, SupplierPage } from '../suppliers/models/supplier.models';
import { SupplierCatalogueService, SupplierOffer, OfferPage } from '../suppliers/services/supplier-catalogue.service';
import { PurchaseOrderService } from './services/purchase-order.service';
import { PurchaseOrder, PurchaseOrderPage, PurchaseOrderStatus } from './models/purchase-order.models';

interface DraftLine { product: SupplierOffer; quantity: number; }

@Component({
 selector: 'app-purchase-order-directory',
 imports: [CurrencyPipe, DatePipe, PageHeader, Breadcrumbs],
 templateUrl: './purchase-order-directory.html',
 styleUrl: './purchase-order-directory.scss'
})
export class PurchaseOrderDirectory {
 private readonly auth=inject(AuthStore);
 private readonly api=inject(PurchaseOrderService);
 private readonly suppliers=inject(SupplierService);
 private readonly products=inject(SupplierCatalogueService);
 private readonly destroy=inject(DestroyRef);
 readonly canCreate=computed(()=>['ADMIN','PURCHASING_OFFICER'].some(role=>role===this.auth.role()));
 readonly page=signal<PurchaseOrderPage|null>(null);
 readonly status=signal<PurchaseOrderStatus|undefined>(undefined);
 readonly statuses: PurchaseOrderStatus[]=['DRAFT','APPROVED','PARTIALLY_RECEIVED','RECEIVED','CANCELLED'];
 readonly pageSize=signal(10);
 readonly loading=signal(false);
 readonly saving=signal(false);
 readonly formOpen=signal(false);
 readonly notice=signal('');
 readonly error=signal('');
 readonly formError=signal('');
 readonly detail=signal<PurchaseOrder|null>(null);
 readonly detailLoading=signal(false);
 readonly supplierPage=signal<SupplierPage|null>(null);
 readonly productPage=signal<OfferPage|null>(null);
 readonly supplierLoading=signal(false);
 readonly productLoading=signal(false);
 readonly supplierError=signal('');
 readonly productError=signal('');
 readonly selectedSupplier=signal<Supplier|null>(null);
 readonly lines=signal<DraftLine[]>([]);
 readonly estimatedTotal=computed(()=>this.lines().reduce((sum,line)=>sum+line.product.unitPrice*(this.validQuantity(line.quantity)?line.quantity:0),0));
 readonly valid=computed(()=>!!this.selectedSupplier() && this.lines().length>0 && this.lines().length<=100 && this.lines().every(line=>this.validQuantity(line.quantity)));
 private supplierSearch='';
 private productSearch='';
 constructor(){this.load(0);}
 statusLabel(status:PurchaseOrderStatus){return status.toLowerCase().replaceAll('_',' ');}
 validQuantity(value:number){return Number.isInteger(value)&&value>0&&value<=2147483647;}
 load(number:number){
  if(this.loading()||number<0)return;
  this.loading.set(true);this.error.set('');
  this.api.list(number,this.pageSize(),this.status()).pipe(timeout(30000),takeUntilDestroyed(this.destroy),finalize(()=>this.loading.set(false))).subscribe({
   next:value=>this.page.set(value),error:()=>{this.page.set(null);this.error.set('Unable to load purchase orders. Please retry.');}
  });
 }
 changeStatus(value:string){
  if(this.loading())return;
  this.status.set(this.statuses.find(status=>status===value));this.load(0);
 }
 changeSize(value:string){
  if(this.loading()||![10,20,50].includes(Number(value)))return;
  this.pageSize.set(Number(value));this.load(0);
 }
 openForm(){
  if(!this.canCreate()||this.saving()||this.formOpen())return;
  this.detail.set(null);this.notice.set('');this.formError.set('');
  this.lines.set([]);this.selectedSupplier.set(null);
  this.supplierPage.set(null);this.productPage.set(null);
  this.supplierSearch='';this.productSearch='';
  this.formOpen.set(true);this.loadSuppliers(0);
 }
 cancel(){
  if(this.saving()||this.supplierLoading()||this.productLoading())return;
  this.formOpen.set(false);
 }
 searchSuppliers(value:string){if(!this.supplierLoading()){this.supplierSearch=value.trim();this.loadSuppliers(0);}}
 searchProducts(value:string){if(!this.productLoading()){this.productSearch=value.trim();this.loadProducts(0);}}
 loadSuppliers(number:number){
  if(this.supplierLoading()||number<0)return;
  this.supplierLoading.set(true);this.supplierError.set('');
  this.suppliers.list(number,10,this.supplierSearch,true).pipe(timeout(30000),takeUntilDestroyed(this.destroy),finalize(()=>this.supplierLoading.set(false))).subscribe({
   next:value=>this.supplierPage.set(value),error:()=>{this.supplierPage.set(null);this.supplierError.set('Unable to load suppliers. Search again to retry.');}
  });
 }
 loadProducts(number:number){
  const supplier=this.selectedSupplier();
  if(!supplier||this.productLoading()||number<0)return;
  this.productLoading.set(true);this.productError.set('');
  this.products.list(supplier.id,number,10,this.productSearch,true).pipe(timeout(30000),takeUntilDestroyed(this.destroy),finalize(()=>this.productLoading.set(false))).subscribe({
   next:value=>this.productPage.set(value),error:()=>{this.productPage.set(null);this.productError.set('Unable to load products. Search again to retry.');}
  });
 }
 chooseSupplier(supplier:Supplier){
  if(!this.canCreate()||this.saving()||this.productLoading()||!supplier.active||this.selectedSupplier()?.id===supplier.id)return;
  this.selectedSupplier.set(supplier);this.lines.set([]);this.productPage.set(null);this.productSearch='';this.loadProducts(0);
 }
 chooseSupplierId(value:string){const supplier=this.supplierPage()?.content.find(s=>s.id===Number(value));if(supplier)this.chooseSupplier(supplier);}
 addSelectedProduct(value:string){const product=this.productPage()?.content.find(p=>p.sku===value);if(product)this.addProduct(product);}
 hasProduct(sku:string){return this.lines().some(line=>line.product.sku===sku);}
 addProduct(product:SupplierOffer){
  if(!this.canCreate()||this.saving()||!this.selectedSupplier()||!product.active||!product.productActive||this.hasProduct(product.sku)||this.lines().length>=100)return;
  this.lines.update(lines=>[...lines,{product,quantity:1}]);
 }
 changeQuantity(sku:string,value:number){if(!this.saving())this.lines.update(lines=>lines.map(line=>line.product.sku===sku?{...line,quantity:value}:line));}
 removeProduct(sku:string){if(!this.saving())this.lines.update(lines=>lines.filter(line=>line.product.sku!==sku));}
 save(){
  const supplier=this.selectedSupplier();
  if(!this.canCreate()||!this.formOpen()||!this.valid()||!supplier||this.saving()||this.loading())return;
  this.saving.set(true);this.formError.set('');
  const request={supplierId:supplier.id,lines:this.lines().map(line=>({sku:line.product.sku,orderedQuantity:line.quantity}))};
  this.api.create(request).pipe(timeout(30000),takeUntilDestroyed(this.destroy),finalize(()=>this.saving.set(false))).subscribe({
   next:order=>{this.formOpen.set(false);this.notice.set('Purchase order #'+order.id+' created.');this.detail.set(order);this.status.set(undefined);this.load(0);},
   error:err=>{const problem=toApiProblem(err);this.formError.set(problem.status===400||problem.status===409||problem.status===422?problem.detail:'Unable to confirm order creation. Check the order directory before retrying to avoid a duplicate.');}
  });
 }
 view(id:number){
  if(this.detailLoading()||this.formOpen())return;
  this.detailLoading.set(true);this.error.set('');
  this.api.get(id).pipe(timeout(30000),takeUntilDestroyed(this.destroy),finalize(()=>this.detailLoading.set(false))).subscribe({
   next:order=>this.detail.set(order),error:()=>this.error.set('Unable to load order details. Please retry.')
  });
 }
}
