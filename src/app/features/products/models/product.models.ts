export interface ProductUpdateRequest { name: string; unitPrice: number; }
export interface ProductCreateRequest extends ProductUpdateRequest { sku: string; }
export interface Product extends ProductCreateRequest { active: boolean; }
export interface ProductPage { content: Product[]; number: number; size: number; totalElements: number; totalPages: number; }
