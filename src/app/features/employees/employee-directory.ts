import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, timeout } from 'rxjs';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { Breadcrumbs } from '../../shared/components/breadcrumbs/breadcrumbs';
import { EmployeeService } from './services/employee.service';
import { EmployeePage } from './models/employee.models';

@Component({
  selector: 'app-employee-directory',
  imports: [DatePipe, PageHeader, Breadcrumbs],
  template: `
    <app-breadcrumbs [items]="[{label: 'Workspace'}, {label: 'Employees'}]" />
    <app-page-header title="Employees" description="View employee accounts and their access to StockFlow." />
    <section class="surface-card directory" aria-label="Employee directory" [attr.aria-busy]="loading()">
      <div class="toolbar"><h2>Employee directory</h2><button type="button" [disabled]="loading()" (click)="load(page()?.number ?? 0)">Refresh</button></div>
      @if (loading()) { <p role="status">Loading employees…</p> }
      @if (error()) { <p role="alert">{{ error() }}</p> }
      @if (page(); as data) {
        @if (data.content.length) {
          <div class="table-scroll" tabindex="0" aria-label="Employee records">
            <table><thead><tr><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Created</th></tr></thead>
              <tbody>@for (employee of data.content; track employee.id) {
                <tr><td>{{ employee.email }}</td><td>{{ roleLabels[employee.role] }}</td><td><span class="status" [class.inactive]="!employee.enabled">{{ employee.enabled ? 'Active' : 'Inactive' }}</span></td><td>{{ employee.createdAt | date:'mediumDate' }}</td></tr>
              }</tbody>
            </table>
          </div>
        } @else { <p>No employees found.</p> }
        <div class="toolbar pagination">
          <span>{{ data.totalElements }} employees · Page {{ data.totalPages ? data.number + 1 : 0 }} of {{ data.totalPages }}</span>
          <div class="controls"><button type="button" [disabled]="loading() || data.number === 0" (click)="load(data.number - 1)">Previous</button><button type="button" [disabled]="loading() || data.number + 1 >= data.totalPages" (click)="load(data.number + 1)">Next</button></div>
        </div>
      }
    </section>
  `,
  styles: [`
    .directory { margin-top:24px; padding:clamp(16px,3vw,32px); }
    .toolbar,.controls { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
    .toolbar { justify-content:space-between; margin-bottom:16px; }
    h2 { font-size:1.1rem; }
    .table-scroll { overflow-x:auto; }
    table { width:100%; border-collapse:collapse; text-align:left; font-size:.875rem; }
    th,td { padding:14px 12px; border-bottom:1px solid var(--border-color); white-space:nowrap; }
    th { color:var(--secondary-text); background:var(--surface-color); }
    .status { background:#e9f4eb; color:#235b32; padding:4px 10px; border-radius:20px; }
    .status.inactive { background:#eee; color:#555; }
    .pagination { margin:20px 0 0; font-size:.85rem; }
    button { background:white; border:1px solid #aaa; border-radius:8px; padding:8px 12px; cursor:pointer; }
    button:disabled { opacity:.5; cursor:default; }
    [role=alert] { color:#9b2222; margin-bottom:12px; }
  `]
})
export class EmployeeDirectory {
  private readonly employees = inject(EmployeeService);
  private readonly destroyRef = inject(DestroyRef);
  readonly page = signal<EmployeePage | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly roleLabels = { ADMIN: 'Administrator', PURCHASING_OFFICER: 'Purchasing Officer', APPROVER: 'Approver', WAREHOUSE_OFFICER: 'Warehouse Officer' };
  constructor() { this.load(0); }
  load(number: number): void {
    if (this.loading() || number < 0) return;
    this.loading.set(true);
    this.error.set('');
    this.employees.list(number).pipe(timeout(30000), takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))).subscribe({
      next: page => this.page.set(page),
      error: () => this.error.set('Unable to load employees. Please try again.')
    });
  }
}
