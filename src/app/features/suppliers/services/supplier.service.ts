import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs';
import { Supplier, SupplierPage, SupplierRequest } from '../models/supplier.models';
@Injectable({providedIn:'root'})
export class SupplierService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/suppliers';
  list(page = 0, size = 20, search = '', active?: boolean) {
    const params: Record<string, string | number | boolean> = { page, size, search };
    if (active !== undefined) params['active'] = active;
    return this.http.get<SupplierPage>(this.url, { params });
  }
  get(id:number) { return this.http.get<Supplier>(this.url+'/'+id); }
  create(request:SupplierRequest) { return this.http.get<void>('/api/auth/csrf').pipe(switchMap(()=>this.http.post<Supplier>(this.url,request))); }
  update(id:number,request:SupplierRequest) { return this.http.get<void>('/api/auth/csrf').pipe(switchMap(()=>this.http.put<Supplier>(this.url+'/'+id,request))); }
  changeStatus(id:number,active:boolean) { return this.http.get<void>('/api/auth/csrf').pipe(switchMap(()=>this.http.patch<Supplier>(this.url+'/'+id+'/status',{active}))); }
}
