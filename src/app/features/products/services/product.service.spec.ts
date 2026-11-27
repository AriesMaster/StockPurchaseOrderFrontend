import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ProductService } from './product.service';
import { Product } from '../models/product.models';

describe('ProductService', () => {
  let service: ProductService;
  let http: HttpTestingController;
  const product: Product = { sku: 'PAINT-20L', name: 'White paint', unitPrice: 125.5, active: true };
  const body = { sku: product.sku, name: product.name, unitPrice: product.unitPrice };
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function csrf() {
    const req = http.expectOne('/api/auth/csrf');
    expect(req.request.method).toBe('GET');
    http.expectNone(r => ['POST', 'PUT', 'PATCH'].includes(r.method));
    req.flush(null, { status: 204, statusText: 'No Content' });
  }
  it('omits active parameter when unfiltered', () => {
    service.list().subscribe();
    const req = http.expectOne(r => r.url === '/api/products');
    expect(req.request.params.has('active')).toBe(false);
    req.flush({});
  });
  it('sends pagination, search and inactive status', () => {
    service.list(1, 10, 'paint', false).subscribe();
    const req = http.expectOne(r => r.url === '/api/products');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('search')).toBe('paint');
    expect(req.request.params.get('active')).toBe('false');
    req.flush({});
  });
  it('gets a product by SKU', () => {
    service.get(product.sku).subscribe(value => expect(value).toEqual(product));
    const req = http.expectOne('/api/products/PAINT-20L');
    expect(req.request.method).toBe('GET');
    req.flush(product);
  });
  it('gets CSRF before product creation', () => {
    service.create(body).subscribe();
    csrf();
    const req = http.expectOne('/api/products');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(product);
  });
  it('gets CSRF before product update', () => {
    const update = { name: 'Premium paint', unitPrice: 150 };
    service.update(product.sku, update).subscribe();
    csrf();
    const req = http.expectOne('/api/products/PAINT-20L');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(update);
    req.flush({ ...product, ...update });
  });
  it.each([true, false])('gets CSRF before status change to %s', active => {
    service.changeStatus(product.sku, active).subscribe();
    csrf();
    const req = http.expectOne('/api/products/PAINT-20L/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ active });
    req.flush({ ...product, active });
  });
  it('does not write when CSRF acquisition fails', () => {
    let status = 0;
    service.create(body).subscribe({ error: error => status = error.status });
    http.expectOne('/api/auth/csrf').flush(null, { status: 503, statusText: 'Unavailable' });
    http.expectNone(r => r.method === 'POST');
    expect(status).toBe(503);
  });
});
