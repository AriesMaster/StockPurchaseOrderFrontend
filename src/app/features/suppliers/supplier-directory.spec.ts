import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStore } from '../../core/auth/services/auth.store';
import { SupplierDirectory } from './supplier-directory';
import { SupplierService } from './services/supplier.service';
import { Supplier, SupplierPage } from './models/supplier.models';

describe('SupplierDirectory', () => {
  const supplier: Supplier = { id: 1, name: 'Midrand Hardware', contactName: 'Test Contact', email: 'sales@example.test', phone: '0115550101', address: 'Gauteng', active: true, createdAt: '2026-11-26T00:00:00Z', updatedAt: '2026-11-26T00:00:00Z' };
  const page: SupplierPage = { content: [supplier], number: 0, size: 20, totalElements: 21, totalPages: 2 };
  const role = signal('ADMIN');
  const api = { list: vi.fn(), create: vi.fn(), update: vi.fn(), changeStatus: vi.fn() };
  const dialog = { open: vi.fn() };
  let decision: Subject<boolean | undefined>;
  let fixture: ComponentFixture<SupplierDirectory>;
  let component: SupplierDirectory;

  beforeEach(async () => {
    vi.resetAllMocks();
    role.set('ADMIN');
    decision = new Subject<boolean | undefined>();
    dialog.open.mockReturnValue({ afterClosed: () => decision.asObservable() });
    api.list.mockReturnValue(of(page));
    api.create.mockReturnValue(of(supplier));
    api.update.mockReturnValue(of(supplier));
    api.changeStatus.mockReturnValue(of(supplier));
    await TestBed.configureTestingModule({
      imports: [SupplierDirectory],
      providers: [{ provide: SupplierService, useValue: api }, { provide: AuthStore, useValue: { role } }]
    }).overrideComponent(SupplierDirectory, { add: { providers: [{ provide: MatDialog, useValue: dialog }] } }).compileComponents();
    fixture = TestBed.createComponent(SupplierDirectory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the first page on initialization', () => {
    expect(api.list).toHaveBeenCalledWith(0, 20, '');
    expect(component.page()).toEqual(page);
  });
  it('submits search without native browser navigation', () => {
    component.query.setValue(' Midrand ');
    const form = fixture.nativeElement.querySelector('form.search') as HTMLFormElement;
    const event = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(api.list).toHaveBeenLastCalledWith(0, 20, 'Midrand');
  });
  it('preserves the applied search when changing page', () => {
    component.query.setValue('Midrand');
    component.search();
    component.load(1);
    expect(api.list).toHaveBeenLastCalledWith(1, 20, 'Midrand');
  });
  it('clears search and returns to page zero', () => {
    component.query.setValue('Midrand');
    component.search();
    component.query.reset();
    component.search();
    expect(api.list).toHaveBeenLastCalledWith(0, 20, '');
  });
  it('renders the empty result message', () => {
    api.list.mockReturnValue(of({ ...page, content: [], totalElements: 0, totalPages: 0 }));
    component.search();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No suppliers found');
  });
  it('renders the editor outside the directory card', () => {
    component.openForm(null);
    fixture.detectChanges();
    const editor = fixture.nativeElement.querySelector('.editor-card');
    expect(editor).not.toBeNull();
    expect(editor.querySelector('form.editor')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.directory').contains(editor)).toBe(false);
  });
  it('rejects missing or whitespace-only supplier names', () => {
    component.openForm(null);
    component.save();
    component.form.controls.name.setValue('   ');
    component.save();
    expect(api.create).not.toHaveBeenCalled();
    expect(component.form.controls.name.touched).toBe(true);
  });
  it('rejects malformed email addresses', () => {
    component.openForm(null);
    component.form.patchValue({ name: 'New Supplier', email: 'invalid-email' });
    component.save();
    expect(api.create).not.toHaveBeenCalled();
  });
  it('creates a supplier and closes the editor', () => {
    component.openForm(null);
    component.form.patchValue({ name: ' New Supplier ' });
    component.save();
    expect(api.create).toHaveBeenCalledWith({ name: 'New Supplier', contactName: '', email: '', phone: '', address: '' });
    expect(component.formOpen()).toBe(false);
    expect(component.notice()).toBe('Supplier created.');
    expect(api.list).toHaveBeenCalledTimes(2);
  });
  it('edits a supplier and reloads results', () => {
    component.openForm(supplier);
    expect(component.form.controls.name.value).toBe(supplier.name);
    component.form.patchValue({ address: 'Centurion, Gauteng' });
    component.save();
    expect(api.update).toHaveBeenCalledWith(1, { name: supplier.name, contactName: supplier.contactName, email: supplier.email, phone: supplier.phone, address: 'Centurion, Gauteng' });
    expect(component.notice()).toBe('Supplier updated.');
    expect(component.formOpen()).toBe(false);
  });
  it('does not deactivate when confirmation is cancelled', () => {
    component.requestStatus(supplier);
    expect(api.changeStatus).not.toHaveBeenCalled();
    decision.next(false);
    decision.complete();
    expect(api.changeStatus).not.toHaveBeenCalled();
  });
  for (const active of [true, false]) {
    it('changes supplier status only after confirmation from ' + active, () => {
      component.requestStatus({ ...supplier, active });
      expect(api.changeStatus).not.toHaveBeenCalled();
      decision.next(true);
      decision.complete();
      expect(api.changeStatus).toHaveBeenCalledWith(1, !active);
      expect(component.notice()).toBe(active ? 'Supplier deactivated.' : 'Supplier reactivated.');
    });
  }
  for (const nonAdmin of ['PURCHASING_OFFICER', 'APPROVER', 'WAREHOUSE_OFFICER']) {
    it('permits reads but blocks write actions for ' + nonAdmin, () => {
      role.set(nonAdmin);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain(supplier.name);
      expect(fixture.nativeElement.textContent).not.toContain('Add supplier');
      expect(fixture.nativeElement.textContent).not.toContain('Deactivate');
      component.openForm(null);
      component.save();
      component.requestStatus(supplier);
      expect(component.formOpen()).toBe(false);
      expect(api.create).not.toHaveBeenCalled();
      expect(dialog.open).not.toHaveBeenCalled();
    });
  }
  it('reports a failed save without closing the editor', () => {
    api.create.mockReturnValue(throwError(() => new Error('Unavailable')));
    component.openForm(null);
    component.form.patchValue({ name: 'New Supplier' });
    component.save();
    expect(component.error()).toContain('Unable to confirm');
    expect(component.formOpen()).toBe(true);
    expect(component.saving()).toBe(false);
  });
  it('reports a failed directory load', () => {
    api.list.mockReturnValue(throwError(() => new Error('Unavailable')));
    component.load(0);
    expect(component.page()).toBeNull();
    expect(component.error()).toContain('Unable to load suppliers');
    expect(component.loading()).toBe(false);
  });
});
