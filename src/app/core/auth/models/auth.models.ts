export type Role = 'ADMIN' | 'PURCHASING_OFFICER' | 'APPROVER' | 'WAREHOUSE_OFFICER';

export interface LoginRequest {
  email: string;
  password: string;
}

// Proposed API contract; synchronize with backend controllers before integration.
export interface AuthUser {
  id: number;
  email: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
