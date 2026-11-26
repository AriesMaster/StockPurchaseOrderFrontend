import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, timeout } from 'rxjs';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { Breadcrumbs } from '../../shared/components/breadcrumbs/breadcrumbs';
import { EmployeeService } from './services/employee.service';
import { Employee, EmployeePage, EmployeeRole } from './models/employee.models';

@Component({
  selector: 'app-employee-directory',
  imports: [ReactiveFormsModule, DatePipe, PageHeader, Breadcrumbs],
  template: `
    <app-breadcrumbs [items]="[{label: 'Workspace'}, {label: 'Employees'}]" />
    <app-page-header title="Employees" description="View employee accounts and their access to StockFlow." />
    <section class="surface-card directory" aria-label="Create employee">
      <div class="toolbar"><h2>Employee accounts</h2><button class="primary" type="button" [disabled]="saving()" [attr.aria-expanded]="creating()" (click)="toggleCreate()">{{ creating() ? 'Cancel' : 'Add employee' }}</button></div>
      @if (notice()) { <p role="status">{{ notice() }}</p> }
      @if (creating()) {
        <form [formGroup]="form" (ngSubmit)="create()" novalidate>
          <div class="fields">
            <label>Email address<input type="email" formControlName="email" autocomplete="off" maxlength="254" /></label>
            <label>Role<select formControlName="role"><option value="PURCHASING_OFFICER">Purchasing Officer</option><option value="APPROVER">Approver</option><option value="WAREHOUSE_OFFICER">Warehouse Officer</option></select></label>
            <label>Initial password<input type="password" formControlName="password" autocomplete="new-password" maxlength="128" /><small>15–128 characters. Share securely with the employee.</small></label>
          </div>
          @if (form.controls.email.touched && form.controls.email.invalid) { <p role="alert">Enter a valid email address.</p> }
          @if (form.controls.password.touched && form.controls.password.invalid) { <p role="alert">Enter a password of 15–128 characters.</p> }
          @if (createError()) { <p role="alert">{{ createError() }}</p> }
          <button class="primary" type="submit" [disabled]="saving() || loading()">{{ saving() ? 'Creating…' : 'Create employee' }}</button>
        </form>
      }
    </section>
    <section class="surface-card directory" aria-label="Employee directory" [attr.aria-busy]="loading()">
      <div class="toolbar"><h2>Employee directory</h2><button type="button" [disabled]="loading() || saving()" (click)="load(page()?.number ?? 0)">Refresh</button></div>
      @if (editError()) { <p role="alert">{{ editError() }}</p> }
      @if (statusTarget(); as employee) {
        <div class="edit-panel" role="group" aria-label="Confirm account status change">
          <h2>{{ employee.enabled ? 'Deactivate' : 'Reactivate' }} {{ employee.email }}?</h2>
          <p>{{ employee.enabled ? 'This will revoke existing sessions and prevent sign-in.' : 'This will restore sign-in access with the existing password.' }}</p>
          <div class="controls">
            <button class="primary" type="button" [disabled]="saving() || loading()" (click)="confirmStatus()">{{ saving() ? 'Saving…' : employee.enabled ? 'Confirm deactivation' : 'Confirm reactivation' }}</button>
            <button type="button" [disabled]="saving()" (click)="statusTarget.set(null)">Cancel</button>
          </div>
        </div>
      }
      @if (editing(); as employee) {
        <div class="edit-panel">
          <h2>Change role for {{ employee.email }}</h2>
          <label>New role<select [formControl]="roleControl">
            <option value="PURCHASING_OFFICER">Purchasing Officer</option>
            <option value="APPROVER">Approver</option>
            <option value="WAREHOUSE_OFFICER">Warehouse Officer</option>
          </select></label>
          <p>Changing permissions signs the employee out of existing sessions.</p>
          <div class="controls"><button class="primary" type="button" [disabled]="saving() || loading() || roleControl.value === employee.role" (click)="saveRole(employee)">Save role</button><button type="button" [disabled]="saving()" (click)="editing.set(null)">Cancel</button></div>
        </div>
      }
      @if (loading()) { <p role="status">Loading employees…</p> }
      @if (error()) { <p role="alert">{{ error() }}</p> }
      @if (page(); as data) {
        @if (data.content.length) {
          <div class="table-scroll" tabindex="0" aria-label="Employee records">
            <table><thead><tr><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Created</th><th scope="col">Actions</th></tr></thead>
              <tbody>@for (employee of data.content; track employee.id) {
                <tr><td>{{ employee.email }}</td><td>{{ roleLabels[employee.role] }}</td><td><span class="status" [class.inactive]="!employee.enabled">{{ employee.enabled ? 'Active' : 'Inactive' }}</span></td><td>{{ employee.createdAt | date:'mediumDate' }}</td><td>@if (employee.role !== 'ADMIN') { <button type="button" [disabled]="saving() || loading() || creating()" (click)="editRole(employee)">Edit role</button> <button type="button" [disabled]="saving() || loading() || creating()" (click)="requestStatus(employee)">{{ employee.enabled ? 'Deactivate' : 'Reactivate' }}</button> } @else { <small>Protected</small> }</td></tr>
              }</tbody>
            </table>
          </div>
        } @else { <p>No employees found.</p> }
        <div class="toolbar pagination">
          <span>{{ data.totalElements }} {{ data.totalElements === 1 ? 'employee' : 'employees' }} · Page {{ data.totalPages ? data.number + 1 : 0 }} of {{ data.totalPages }}</span>
          <div class="controls"><button type="button" [disabled]="loading() || saving() || data.number === 0" (click)="load(data.number - 1)">Previous</button><button type="button" [disabled]="loading() || saving() || data.number + 1 >= data.totalPages" (click)="load(data.number + 1)">Next</button></div>
        </div>
      }
    </section>
  `,
  styles: [`
    .edit-panel { display:grid; gap:12px; padding:16px; margin-bottom:16px; border:1px solid var(--border-color); border-radius:8px; }
    .fields { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr)); gap:16px; margin-bottom:16px; }
    label { display:flex; flex-direction:column; gap:6px; font-size:.9rem; font-weight:600; }
    input,select { width:100%; padding:10px; border:1px solid #aaa; border-radius:8px; background:white; color:#111; }
    small { font-weight:400; color:var(--secondary-text); }
    button.primary { background:#111; color:white; }
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
  private readonly fb = inject(FormBuilder);
  readonly statusTarget = signal<Employee | null>(null);
  requestStatus(employee: Employee): void {
    if (employee.role === 'ADMIN' || this.saving() || this.loading() || this.creating()) return;
    this.editing.set(null);
    this.editError.set('');
    this.notice.set('');
    this.statusTarget.set(employee);
  }
  confirmStatus(): void {
    const employee = this.statusTarget();
    if (!employee || employee.role === 'ADMIN' || this.saving() || this.loading()) return;
    const enabled = !employee.enabled;
    this.saving.set(true);
    this.editError.set('');
    this.employees.changeStatus(employee.id, enabled).pipe(
      timeout(30000), takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        this.statusTarget.set(null);
        this.notice.set(enabled ? 'Employee account reactivated.' : 'Employee account deactivated.');
        this.load(this.page()?.number ?? 0);
      },
      error: () => {
        this.statusTarget.set(null);
        this.editError.set('Unable to confirm status change. Refresh the directory before retrying.');
      }
    });
  }
  readonly editing = signal<Employee | null>(null);
  readonly editError = signal('');
  readonly roleControl = this.fb.nonNullable.control<EmployeeRole>('PURCHASING_OFFICER');
  editRole(employee: Employee): void {
    if (employee.role === 'ADMIN' || this.saving() || this.loading() || this.creating()) return;
    this.editError.set('');
    this.notice.set('');
    this.statusTarget.set(null);
    this.roleControl.setValue(employee.role);
    this.editing.set(employee);
  }
  saveRole(employee: Employee): void {
    if (employee.role === 'ADMIN' || this.saving() || this.loading() || this.roleControl.value === employee.role) return;
    this.saving.set(true);
    this.editError.set('');
    this.employees.changeRole(employee.id, this.roleControl.value).pipe(
      timeout(30000), takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        this.editing.set(null);
        this.notice.set('Employee role updated successfully.');
        this.load(this.page()?.number ?? 0);
      },
      error: () => this.editError.set('Unable to confirm role change. Refresh the directory before retrying.')
    });
  }
  readonly creating = signal(false);
  readonly saving = signal(false);
  readonly createError = signal('');
  readonly notice = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    role: this.fb.nonNullable.control<EmployeeRole>('PURCHASING_OFFICER', Validators.required),
    password: ['', [Validators.required, Validators.minLength(15), Validators.maxLength(128), Validators.pattern(/.*\S.*/s)]]
  });
  toggleCreate(): void {
    if (this.saving()) return;
    this.editing.set(null);
    this.editError.set('');
    this.statusTarget.set(null);
    this.creating.update(value => !value);
    this.form.reset();
    this.createError.set('');
    this.notice.set('');
  }
  create(): void {
    if (this.saving() || this.loading()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    this.createError.set('');
    this.notice.set('');
    const request = this.form.getRawValue();
    this.employees.create({...request, email: request.email.trim()}).pipe(
      timeout(30000), takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.saving.set(false); this.form.controls.password.reset(); })
    ).subscribe({
      next: () => {
        this.form.reset();
        this.creating.set(false);
        this.notice.set('Employee account created successfully.');
        this.load(0);
      },
      error: (error: unknown) => this.createError.set(error instanceof HttpErrorResponse && error.status === 409
        ? 'An account with this email already exists.'
        : error instanceof HttpErrorResponse && error.status === 400
          ? 'Check the employee details and try again.'
          : 'Unable to confirm account creation. Refresh the directory before retrying.')
    });
  }
  readonly page = signal<EmployeePage | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly roleLabels = { ADMIN: 'Administrator', PURCHASING_OFFICER: 'Purchasing Officer', APPROVER: 'Approver', WAREHOUSE_OFFICER: 'Warehouse Officer' };
  constructor() { this.load(0); }
  load(number: number): void {
    if (this.loading() || number < 0) return;
    this.editing.set(null);
    this.statusTarget.set(null);
    this.editError.set('');
    this.loading.set(true);
    this.error.set('');
    this.employees.list(number).pipe(timeout(30000), takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))).subscribe({
      next: page => this.page.set(page),
      error: () => this.error.set('Unable to load employees. Please try again.')
    });
  }
}
