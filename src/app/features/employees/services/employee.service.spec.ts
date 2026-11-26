import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EmployeeService } from './employee.service';
import { Employee, CreateEmployeeRequest } from '../models/employee.models';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let http: HttpTestingController;
  const employee: Employee = { id: 2, email: 'buyer@example.test', role: 'PURCHASING_OFFICER', enabled: true, createdAt: '2026-11-26T00:00:00Z' };
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(EmployeeService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function csrf() {
    const req = http.expectOne('/api/auth/csrf');
    expect(req.request.method).toBe('GET');
    http.expectNone(r => r.method === 'POST' || r.method === 'PATCH');
    req.flush(null, { status: 204, statusText: 'No Content' });
  }
  it('lists employees with pagination parameters', () => {
    const page = { content: [employee], number: 1, size: 10, totalElements: 11, totalPages: 2 };
    let result;
    service.list(1, 10).subscribe(value => result = value);
    const req = http.expectOne(r => r.url === '/api/employees');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('10');
    req.flush(page);
    expect(result).toEqual(page);
  });
  it('retrieves an employee by ID', () => {
    let result;
    service.get(2).subscribe(value => result = value);
    const req = http.expectOne('/api/employees/2');
    expect(req.request.method).toBe('GET');
    req.flush(employee);
    expect(result).toEqual(employee);
  });
  it('obtains CSRF before creating an employee', () => {
    const body: CreateEmployeeRequest = { email: employee.email, role: 'PURCHASING_OFFICER', password: 'Test-only-password-123!' };
    service.create(body).subscribe(value => expect(value).toEqual(employee));
    csrf();
    const req = http.expectOne('/api/employees');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(employee, { status: 201, statusText: 'Created' });
  });
  it('obtains CSRF before changing role', () => {
    service.changeRole(2, 'APPROVER').subscribe(value => expect(value.role).toBe('APPROVER'));
    csrf();
    const req = http.expectOne('/api/employees/2/role');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ role: 'APPROVER' });
    req.flush({ ...employee, role: 'APPROVER' });
  });
  for (const enabled of [false, true]) {
    it('changes account status to ' + enabled, () => {
      service.changeStatus(2, enabled).subscribe(value => expect(value.enabled).toBe(enabled));
      csrf();
      const req = http.expectOne('/api/employees/2/status');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ enabled });
      req.flush({ ...employee, enabled });
    });
  }
  it('does not mutate an account when CSRF acquisition fails', () => {
    let status = 0;
    service.changeStatus(2, false).subscribe({ error: error => status = error.status });
    http.expectOne('/api/auth/csrf').flush(null, { status: 503, statusText: 'Unavailable' });
    http.expectNone('/api/employees/2/status');
    expect(status).toBe(503);
  });
  it('propagates duplicate email conflicts', () => {
    let status = 0;
    service.create({ email: employee.email, role: 'APPROVER', password: 'Test-only-password-123!' }).subscribe({ error: error => status = error.status });
    csrf();
    http.expectOne('/api/employees').flush(null, { status: 409, statusText: 'Conflict' });
    expect(status).toBe(409);
  });
});
