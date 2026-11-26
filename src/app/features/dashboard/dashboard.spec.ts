import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect } from 'vitest';
import { Dashboard } from './dashboard';
import { AuthStore } from '../../core/auth/services/auth.store';
import { Role } from '../../core/auth/models/auth.models';

describe('Role-specific dashboard', () => {
  const cases: {role: Role; heading: string; metrics: string[]}[] = [
    {role:'ADMIN', heading:'Administration overview', metrics:['Employees','Purchase orders','Pending approvals','Inventory items']},
    {role:'PURCHASING_OFFICER', heading:'Purchasing overview', metrics:['Draft orders','Purchase orders','Outstanding deliveries']},
    {role:'APPROVER', heading:'Approvals overview', metrics:['Pending approvals','Purchase orders']},
    {role:'WAREHOUSE_OFFICER', heading:'Warehouse overview', metrics:['Outstanding deliveries','Inventory items']}
  ];
  for (const entry of cases) {
    it('shows relevant metrics for ' + entry.role, () => {
      TestBed.configureTestingModule({providers:[provideRouter([])]});
      TestBed.inject(AuthStore).setSession({accessToken:'test-only',user:{id:1,email:'employee@example.test',role:entry.role}});
      const fixture = TestBed.createComponent(Dashboard);
      fixture.detectChanges();
      const root: HTMLElement = fixture.nativeElement;
      expect(root.querySelector('h1')?.textContent).toBe(entry.heading);
      expect(Array.from(root.querySelectorAll('article h2')).map(h => h.textContent?.trim())).toEqual(entry.metrics);
      expect(root.querySelectorAll('app-info-tooltip').length).toBe(entry.metrics.length);
      expect(root.querySelector('[aria-current=page]')?.textContent).toBe('Overview');
      expect(root.textContent).toContain('Data not available yet');
    });
  }
});
