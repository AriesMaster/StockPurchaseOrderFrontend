import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SupplierService } from './supplier.service';
import { Supplier, SupplierRequest } from '../models/supplier.models';

describe('SupplierService', () => {
  let service: SupplierService;
  let http: HttpTestingController;
  const body: SupplierRequest = { name: 'Midrand Hardware', contactName: 'Test Contact', email: 'sales@example.test', phone: '', address: 'Gauteng' };
  const supplier: Supplier = { ...body, id: 1, active: true, createdAt: '2026-11-26T00:00:00Z', updatedAt: '2026-11-26T00:00:00Z' };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SupplierService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function csrf() {
    const req = http.expectOne('/api/auth/csrf');
    expect(req.request.method).toBe('GET');
    http.expectNone(r => ['POST', 'PUT', 'PATCH'].includes(r.method));
    req.flush(null, { status: 204, statusText: 'No Content' });
  }

  it('lists suppliers with search and pagination parameters', () => {
    const page = { content: [supplier], number: 1, size: 10, totalElements: 11, totalPages: 2 };
    service.list(1, 10, 'Midrand').subscribe(result => expect(result).toEqual(page));
    const req = http.expectOne(r => r.url === '/api/suppliers');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('search')).toBe('Midrand');
    req.flush(page);
  });
  it('gets a supplier by ID', () => {
    service.get(1).subscribe(result => expect(result).toEqual(supplier));
    const req = http.expectOne('/api/suppliers/1');
    expect(req.request.method).toBe('GET');
    req.flush(supplier);
  });
  it('obtains CSRF before creating a supplier', () => {
    service.create(body).subscribe(result => expect(result).toEqual(supplier));
    csrf();
    const req = http.expectOne('/api/suppliers');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(supplier, { status: 201, statusText: 'Created' });
  });
  it('obtains CSRF before updating a supplier', () => {
    service.update(1, body).subscribe(result => expect(result).toEqual(supplier));
    csrf();
    const req = http.expectOne('/api/suppliers/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush(supplier);
  });
  for (const active of [false, true]) {
    it('changes supplier status to ' + active, () => {
      service.changeStatus(1, active).subscribe(result => expect(result.active).toBe(active));
      csrf();
      const req = http.expectOne('/api/suppliers/1/status');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ active });
      req.flush({ ...supplier, active });
    });
  }
  it('does not write when CSRF acquisition fails', () => {
    let status = 0;
    service.create(body).subscribe({ error: e => status = e.status });
    http.expectOne('/api/auth/csrf').flush(null, { status: 503, statusText: 'Unavailable' });
    http.expectNone(r => r.method === 'POST');
    expect(status).toBe(503);
  });
  it('propagates server conflicts', () => {
    let status = 0;
    service.update(1, body).subscribe({ error: e => status = e.status });
    csrf();
    http.expectOne('/api/suppliers/1').flush(null, { status: 409, statusText: 'Conflict' });
    expect(status).toBe(409);
  });
});
