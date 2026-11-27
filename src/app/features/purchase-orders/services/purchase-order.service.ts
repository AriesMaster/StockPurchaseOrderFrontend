import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs';
import { CreatePurchaseOrderRequest, PurchaseOrder, PurchaseOrderPage, PurchaseOrderStatus } from '../models/purchase-order.models';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/purchase-orders';
  list(page = 0, size = 10, status?: PurchaseOrderStatus) {
    const params: Record<string, string | number> = { page, size };
    if (status) params['status'] = status;
    return this.http.get<PurchaseOrderPage>(this.url, { params });
  }
  get(id: number) { return this.http.get<PurchaseOrder>(this.url + '/' + id); }
  create(request: CreatePurchaseOrderRequest) {
    return this.http.get<void>('/api/auth/csrf').pipe(switchMap(() => this.http.post<PurchaseOrder>(this.url, request)));
  }
}
