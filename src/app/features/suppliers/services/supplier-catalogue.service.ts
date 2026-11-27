import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs';
export interface SupplierOffer { sku:string; name:string; unitPrice:number; active:boolean; productActive:boolean; }
export interface OfferPage { content:SupplierOffer[]; number:number; size:number; totalElements:number; totalPages:number; }
@Injectable({providedIn:'root'})
export class SupplierCatalogueService {
 private readonly http=inject(HttpClient);
 list(id:number,page=0,size=10,search='',available=true){
  return this.http.get<OfferPage>('/api/suppliers/'+id+'/products',{params:{page,size,search,available}});
 }
 put(id:number,sku:string,unitPrice:number,active:boolean){
  return this.http.get<void>('/api/auth/csrf').pipe(switchMap(()=>this.http.put<SupplierOffer>('/api/suppliers/'+id+'/products/'+encodeURIComponent(sku),{unitPrice,active})));
 }
}
