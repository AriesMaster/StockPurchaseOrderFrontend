import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi } from 'vitest';
import { InfoTooltip } from './info-tooltip/info-tooltip';
import { SearchField } from './search-field/search-field';
import { StatusBadge } from './status-badge/status-badge';
import { EmptyState } from './empty-state/empty-state';
import { LoadingState } from './loading-state/loading-state';
import { PageHeader } from './page-header/page-header';

describe('Shared workspace components', () => {
  it('opens and closes contextual information', () => {
    const f = TestBed.createComponent(InfoTooltip);
    f.componentRef.setInput('label', 'Inventory');
    f.componentRef.setInput('description', 'Products tracked in stock.');
    f.detectChanges();
    const button: HTMLButtonElement = f.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    button.click(); f.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(f.nativeElement.textContent).toContain('Products tracked in stock.');
    button.click(); f.detectChanges();
    expect(f.nativeElement.textContent).not.toContain('Products tracked in stock.');
  });
  it('emits search text and clears it', () => {
    const f = TestBed.createComponent(SearchField);
    f.componentRef.setInput('value', 'tools');
    const listener = vi.fn();
    f.componentInstance.valueChange.subscribe(listener);
    f.detectChanges();
    const field: HTMLInputElement = f.nativeElement.querySelector('input');
    field.value = 'hardware'; field.dispatchEvent(new Event('input'));
    expect(listener).toHaveBeenCalledWith('hardware');
    f.nativeElement.querySelector('button').click();
    expect(listener).toHaveBeenLastCalledWith('');
  });
  it('renders human-readable order status', () => {
    const f = TestBed.createComponent(StatusBadge);
    f.componentRef.setInput('status', 'PARTIALLY_RECEIVED');
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Partially received');
  });
  it('explains an empty record list', () => {
    const f = TestBed.createComponent(EmptyState);
    f.componentRef.setInput('title', 'No suppliers');
    f.componentRef.setInput('description', 'Add your first supplier.');
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Add your first supplier.');
  });
  it('announces loading state', () => {
    const f = TestBed.createComponent(LoadingState);
    f.componentRef.setInput('message', 'Loading orders');
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role=status]').textContent).toContain('Loading orders');
  });
  it('renders the page heading and description', () => {
    const f = TestBed.createComponent(PageHeader);
    f.componentRef.setInput('title', 'Suppliers');
    f.componentRef.setInput('description', 'Manage supplier records.');
    f.detectChanges();
    expect(f.nativeElement.querySelector('h1').textContent).toBe('Suppliers');
    expect(f.nativeElement.textContent).toContain('Manage supplier records.');
  });
});
