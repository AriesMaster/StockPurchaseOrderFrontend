import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStore } from '../../core/auth/services/auth.store';
import { ProductDirectory } from './product-directory';
import { ProductService } from './services/product.service';
import { Product, ProductPage } from './models/product.models';

describe('ProductDirectory', () => {
  const product: Product = { sku: 'PAINT-20L', name: 'White paint', unitPrice: 125.50, active: true };
  const page: ProductPage = { content: [product], number: 0, size: 10, totalElements: 21, totalPages: 3 };
  const role = signal('ADMIN');
  const api = { list: vi.fn(), create: vi.fn(), update: vi.fn(), changeStatus: vi.fn() };
  const dialog = { open: vi.fn() };
  let decision: Subject<boolean | undefined>;
  let fixture: ComponentFixture<ProductDirectory>;
  let component: ProductDirectory;

  beforeEach(async () => {
    vi.resetAllMocks();
    role.set('ADMIN');
    decision = new Subject<boolean | undefined>();
    dialog.open.mockReturnValue({ afterClosed: () => decision.asObservable() });
    api.list.mockReturnValue(of(page));
    api.create.mockReturnValue(of(product));
    api.update.mockReturnValue(of(product));
    api.changeStatus.mockReturnValue(of(product));
    await TestBed.configureTestingModule({
      imports: [ProductDirectory],
      providers: [{ provide: ProductService, useValue: api }, { provide: AuthStore, useValue: { role } }]
    }).overrideComponent(ProductDirectory, { add: { providers: [{ provide: MatDialog, useValue: dialog }] } }).compileComponents();
    fixture = TestBed.createComponent(ProductDirectory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function validForm() {
    component.openForm(null);
    component.form.setValue({ sku: 'PAINT-20L', name: ' White paint ', unitPrice: '125.50' });
  }

  it('loads ten rows and displays rand pricing', () => {
    expect(api.list).toHaveBeenCalledWith(0, 10, '');
    expect(fixture.nativeElement.textContent).toContain('R125.50');
  });
  it('searches without native navigation', () => {
    component.query.setValue(' PAINT ');
    const event = new Event('submit', { bubbles: true, cancelable: true });
    (fixture.nativeElement.querySelector('form.search') as HTMLFormElement).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(api.list).toHaveBeenLastCalledWith(0, 10, 'PAINT');
  });
  it('preserves search and status when changing pages', () => {
    component.query.setValue('paint');
    component.search();
    component.changeStatusFilter('inactive');
    component.load(1);
    expect(api.list).toHaveBeenLastCalledWith(1, 10, 'paint', false);
  });
  it('changes page size and clears filters', () => {
    component.query.setValue('paint');
    component.search();
    component.changeStatusFilter('active');
    component.changePageSize('50');
    expect(api.list).toHaveBeenLastCalledWith(0, 50, 'paint', true);
    component.clearFilters();
    expect(api.list).toHaveBeenLastCalledWith(0, 50, '');
  });
  it('displays an empty directory', () => {
    api.list.mockReturnValue(of({ ...page, content: [], totalElements: 0, totalPages: 0 }));
    component.search();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No products found');
  });
  it('places the editor outside the directory', () => {
    component.openForm(null);
    fixture.detectChanges();
    const editor = fixture.nativeElement.querySelector('.editor-card');
    expect(editor).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.directory').contains(editor)).toBe(false);
  });
  it('rejects an empty form', () => {
    component.openForm(null);
    component.save();
    expect(api.create).not.toHaveBeenCalled();
  });
  it('rejects invalid SKU and blank name', () => {
    validForm();
    component.form.controls.sku.setValue('bad/sku');
    component.save();
    component.form.controls.sku.setValue('VALID');
    component.form.controls.name.setValue('   ');
    component.save();
    expect(api.create).not.toHaveBeenCalled();
  });
  it.each(['-1', '1.001', '10000000000'])('rejects invalid price %s', price => {
    validForm();
    component.form.controls.unitPrice.setValue(price);
    component.save();
    expect(api.create).not.toHaveBeenCalled();
  });
  it('creates and refreshes the catalogue', () => {
    validForm();
    component.save();
    expect(api.create).toHaveBeenCalledWith({ sku: 'PAINT-20L', name: 'White paint', unitPrice: 125.5 });
    expect(component.formOpen()).toBe(false);
    expect(component.notice()).toBe('Product created.');
    expect(api.list).toHaveBeenCalledTimes(2);
  });
  it('keeps the SKU immutable on edit', () => {
    component.openForm(product);
    expect(component.form.controls.sku.disabled).toBe(true);
    component.form.patchValue({ name: 'Premium paint', unitPrice: '150.00' });
    component.save();
    expect(api.update).toHaveBeenCalledWith('PAINT-20L', { name: 'Premium paint', unitPrice: 150 });
    expect(component.notice()).toBe('Product updated.');
    component.openForm(null);
    expect(component.form.controls.sku.enabled).toBe(true);
  });
  it('displays duplicate SKU feedback and retains the form', () => {
    api.create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    validForm();
    component.save();
    expect(component.error()).toContain('SKU already exists');
    expect(component.formOpen()).toBe(true);
    expect(component.saving()).toBe(false);
  });
  it('reports an update conflict', () => {
    api.update.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    component.openForm(product);
    component.save();
    expect(component.error()).toContain('concurrently');
    expect(component.formOpen()).toBe(true);
  });
  it('does not change status when confirmation is cancelled', () => {
    component.requestStatus(product);
    decision.next(false);
    decision.complete();
    expect(api.changeStatus).not.toHaveBeenCalled();
  });
  it.each([true, false])('changes status after confirmation from %s', active => {
    component.requestStatus({ ...product, active });
    expect(api.changeStatus).not.toHaveBeenCalled();
    decision.next(true);
    decision.complete();
    expect(api.changeStatus).toHaveBeenCalledWith(product.sku, !active);
  });
  it.each(['PURCHASING_OFFICER', 'APPROVER', 'WAREHOUSE_OFFICER'])('restricts writes for %s', value => {
    role.set(value);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(product.name);
    expect(fixture.nativeElement.textContent).not.toContain('Add product');
    expect(fixture.nativeElement.textContent).not.toContain('Deactivate');
    component.openForm(null);
    component.save();
    component.requestStatus(product);
    expect(component.formOpen()).toBe(false);
    expect(api.create).not.toHaveBeenCalled();
    expect(dialog.open).not.toHaveBeenCalled();
  });
  it('reports a directory request failure', () => {
    api.list.mockReturnValue(throwError(() => new Error('Offline')));
    component.load(0);
    expect(component.page()).toBeNull();
    expect(component.error()).toContain('Unable to load products');
    expect(component.loading()).toBe(false);
  });
});
