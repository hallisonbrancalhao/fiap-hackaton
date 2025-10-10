import { Timestamp } from '@angular/fire/firestore';
import { BatchAllocation } from './stock-batch.model';

export enum SALE_STATUS {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum PAYMENT_METHOD {
  CASH = 'cash',
  DEBIT_CARD = 'debit_card',
  CREDIT_CARD = 'credit_card',
  PIX = 'pix',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  OTHER = 'other'
}

export interface SaleItem {
  productId: string;
  productName: string;
  productionId?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  costPerUnit: number;
  totalPrice: number;
  totalCost: number;
  profit: number;
  batchAllocations?: BatchAllocation[];
}

export interface Sale {
  id?: string;
  userId?: string;
  items: SaleItem[];
  totalAmount: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;

  customerName?: string;
  customerContact?: string;
  customerEmail?: string;
  customerDocument?: string;

  paymentMethod?: PAYMENT_METHOD;
  isPaid: boolean;
  paymentDate?: Timestamp;
  deliveryAddress?: string;
  deliveryDate?: Timestamp;
  deliveryFee?: number;

  status: SALE_STATUS;
  saleDate: Timestamp | Date;
  notes?: string;
  invoiceNumber?: string;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
