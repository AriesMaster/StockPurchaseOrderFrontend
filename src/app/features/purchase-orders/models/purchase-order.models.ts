export type PurchaseOrderStatus = 'DRAFT' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
export interface CreatePurchaseOrderRequest { supplierId: number; lines: { sku: string; orderedQuantity: number }[]; }
export interface PurchaseOrderLine { sku: string; productName: string; orderedQuantity: number; receivedQuantity: number; outstandingQuantity: number; unitPrice: number; lineTotal: number; }
export interface PurchaseOrder { id: number; supplierId: number; supplierName: string; status: PurchaseOrderStatus; createdAt: string; lines: PurchaseOrderLine[]; total: number; }
export interface PurchaseOrderPage { content: PurchaseOrder[]; number: number; size: number; totalElements: number; totalPages: number; }
