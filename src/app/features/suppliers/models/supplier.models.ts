export interface SupplierRequest { name: string; contactName: string; email: string; phone: string; address: string; }
export interface Supplier { id: number; name: string; contactName: string | null; email: string | null; phone: string | null; address: string | null; active: boolean; createdAt: string; updatedAt: string; }
export interface SupplierPage { content: Supplier[]; number: number; size: number; totalElements: number; totalPages: number; }
