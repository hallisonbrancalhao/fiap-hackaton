import { Timestamp } from '@angular/fire/firestore';

export enum SALE_STATUS {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

export interface Sale {
  id?: string;
  userId?: string;
  farmId?: string;
  items: SaleItem[];
  totalAmount: number;
  customerName?: string;
  customerContact?: string;
  status: SALE_STATUS;
  saleDate: Timestamp | Date;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
