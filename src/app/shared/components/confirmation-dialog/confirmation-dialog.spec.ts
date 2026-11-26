import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { ConfirmationDialog } from './confirmation-dialog';

describe('ConfirmationDialog', () => {
  const data = { title: 'Deactivate employee?', description: 'Existing sessions will be revoked.', confirmLabel: 'Deactivate' };
  const ref = { close: vi.fn() };
  let element: HTMLElement;
  beforeEach(async () => {
    ref.close.mockReset();
    await TestBed.configureTestingModule({
      imports: [ConfirmationDialog],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: data }, { provide: MatDialogRef, useValue: ref }]
    }).compileComponents();
    const fixture = TestBed.createComponent(ConfirmationDialog);
    fixture.detectChanges();
    element = fixture.nativeElement;
  });
  function button(label: string): HTMLButtonElement {
    return Array.from(element.querySelectorAll('button')).find(b => b.textContent?.trim() === label)!;
  }
  it('renders the supplied title, description and action', () => {
    expect(element.textContent).toContain(data.title);
    expect(element.textContent).toContain(data.description);
    expect(button(data.confirmLabel)).toBeTruthy();
    expect(button('Cancel')).toBeTruthy();
  });
  it('returns false when cancelled', () => {
    button('Cancel').click();
    expect(ref.close).toHaveBeenCalledWith(false);
  });
  it('returns true when confirmed', () => {
    button(data.confirmLabel).click();
    expect(ref.close).toHaveBeenCalledWith(true);
  });
});
