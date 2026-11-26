import { Role } from '../../../core/auth/models/auth.models';

export type EmployeeRole = Exclude<Role, 'ADMIN'>;

export interface Employee {
  id: number;
  email: string;
  role: Role;
  enabled: boolean;
  createdAt: string;
}

export interface EmployeePage {
  content: Employee[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CreateEmployeeRequest {
  email: string;
  password: string;
  role: EmployeeRole;
}
