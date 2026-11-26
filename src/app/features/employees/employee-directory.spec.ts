import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmployeeDirectory } from './employee-directory';
import { EmployeeService } from './services/employee.service';
import { Employee } from './models/employee.models';

describe('EmployeeDirectory', () => {
  const employee: Employee = { id: 2, email: 'buyer@example.test', role: 'PURCHASING_OFFICER', enabled: true, createdAt: '2026-11-26T00:00:00Z' };
  const admin: Employee = { ...employee, id: 1, email: 'admin@example.test', role: 'ADMIN' };
  let component: EmployeeDirectory;
  let decision: Subject<boolean | undefined>;
  const service = { list: vi.fn(), create: vi.fn(), changeRole: vi.fn(), changeStatus: vi.fn() };
  const dialog = { open: vi.fn() };
  beforeEach(async () => {
    vi.resetAllMocks();
    decision = new Subject<boolean | undefined>();
    dialog.open.mockReturnValue({ afterClosed: () => decision.asObservable() });
    service.list.mockReturnValue(of({ content: [admin, employee], number: 0, size: 20, totalElements: 2, totalPages: 1 }));
    service.create.mockReturnValue(of(employee));
    service.changeRole.mockReturnValue(of(employee));
    service.changeStatus.mockReturnValue(of(employee));
    await TestBed.configureTestingModule({
      imports: [EmployeeDirectory],
      providers: [{ provide: EmployeeService, useValue: service }]
    }).overrideComponent(EmployeeDirectory, { add: { providers: [{ provide: MatDialog, useValue: dialog }] } }).compileComponents();
    component = TestBed.createComponent(EmployeeDirectory).componentInstance;
  });
  it('loads the first page on initialization', () => {
    expect(service.list).toHaveBeenCalledWith(0);
    expect(component.page()?.content).toEqual([admin, employee]);
  });
  it('rejects invalid creation details', () => {
    component.toggleCreate();
    component.create();
    expect(service.create).not.toHaveBeenCalled();
    expect(component.form.controls.email.touched).toBe(true);
  });
  it('creates a valid account and clears the password', () => {
    component.toggleCreate();
    component.form.setValue({ email: employee.email, role: 'PURCHASING_OFFICER', password: 'Test-only-password-123!' });
    component.create();
    expect(service.create).toHaveBeenCalledWith({ email: employee.email, role: 'PURCHASING_OFFICER', password: 'Test-only-password-123!' });
    expect(component.form.controls.password.value).toBe('');
    expect(component.creating()).toBe(false);
    expect(service.list).toHaveBeenCalledTimes(2);
  });
  it('reports duplicate email without retaining the password', () => {
    service.create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    component.toggleCreate();
    component.form.setValue({ email: employee.email, role: 'APPROVER', password: 'Test-only-password-123!' });
    component.create();
    expect(component.createError()).toContain('already exists');
    expect(component.form.controls.password.value).toBe('');
  });
  it('does not deactivate before confirmation or after cancellation', () => {
    component.requestStatus(employee);
    expect(dialog.open).toHaveBeenCalledOnce();
    expect(service.changeStatus).not.toHaveBeenCalled();
    decision.next(false);
    decision.complete();
    expect(service.changeStatus).not.toHaveBeenCalled();
  });
  it('deactivates after explicit confirmation', () => {
    component.requestStatus(employee);
    decision.next(true);
    decision.complete();
    expect(service.changeStatus).toHaveBeenCalledWith(2, false);
    expect(component.notice()).toContain('deactivated');
  });
  it('reactivates after explicit confirmation', () => {
    component.requestStatus({ ...employee, enabled: false });
    decision.next(true);
    decision.complete();
    expect(service.changeStatus).toHaveBeenCalledWith(2, true);
    expect(component.notice()).toContain('reactivated');
  });
  it('does not change role when the dialog is dismissed', () => {
    component.editRole(employee);
    component.roleControl.setValue('APPROVER');
    component.requestRoleChange(employee);
    decision.next(undefined);
    decision.complete();
    expect(service.changeRole).not.toHaveBeenCalled();
  });
  it('changes role only after confirmation', () => {
    component.editRole(employee);
    component.roleControl.setValue('APPROVER');
    component.requestRoleChange(employee);
    expect(service.changeRole).not.toHaveBeenCalled();
    decision.next(true);
    decision.complete();
    expect(service.changeRole).toHaveBeenCalledWith(2, 'APPROVER');
  });
  it('protects the administrator from role and status actions', () => {
    component.editRole(admin);
    component.requestRoleChange(admin);
    component.requestStatus(admin);
    expect(component.editing()).toBeNull();
    expect(dialog.open).not.toHaveBeenCalled();
    expect(service.changeRole).not.toHaveBeenCalled();
    expect(service.changeStatus).not.toHaveBeenCalled();
  });
});
