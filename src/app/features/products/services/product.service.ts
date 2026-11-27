import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs';
import { Product, ProductPage, ProductCreateRequest, ProductUpdateRequest } from '../models/product.models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/products';
  list(page = 0, size = 20, search = '', active?: boolean) {
    const params: Record<string, string | number | boolean> = { page, size, search };
    if (active !== undefined) params['active'] = active;
    return this.http.get<ProductPage>(this.url, { params });
  }
  get(sku: string) { return this.http.get<Product>(this.url + '/' + encodeURIComponent(sku)); }
  create(request: ProductCreateRequest) {
    return this.http.get<void>('/api/auth/csrf').pipe(switchMap(() => this.http.post<Product>(this.url, request)));
  }
  update(sku: string, request: ProductUpdateRequest) {
    return this.http.get<void>('/api/auth/csrf').pipe(switchMap(() => this.http.put<Product>(this.url + '/' + encodeURIComponent(sku), request)));
  }
  changeStatus(sku: string, active: boolean) {
    return this.http.get<void>('/api/auth/csrf').pipe(switchMap(() => this.http.patch<Product>(this.url + '/' + encodeURIComponent(sku) + '/status', { active })));
  }
}
