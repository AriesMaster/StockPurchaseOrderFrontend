import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs';
import { CreateEmployeeRequest, Employee, EmployeePage, EmployeeRole } from '../models/employee.models';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/employees';

  list(page = 0, size = 20) {
    return this.http.get<EmployeePage>(this.url, { params: { page, size } });
  }

  get(id: number) {
    return this.http.get<Employee>(this.url + '/' + id);
  }

  create(request: CreateEmployeeRequest) {
    return this.http.get<void>('/api/auth/csrf').pipe(
      switchMap(() => this.http.post<Employee>(this.url, request))
    );
  }

  changeRole(id: number, role: EmployeeRole) {
    return this.http.get<void>('/api/auth/csrf').pipe(
      switchMap(() => this.http.patch<Employee>(this.url + '/' + id + '/role', { role }))
    );
  }

  changeStatus(id: number, enabled: boolean) {
    return this.http.get<void>('/api/auth/csrf').pipe(
      switchMap(() => this.http.patch<Employee>(this.url + '/' + id + '/status', { enabled }))
    );
  }
}
