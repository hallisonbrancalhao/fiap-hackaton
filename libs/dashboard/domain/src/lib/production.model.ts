import { Timestamp } from '@angular/fire/firestore';

export enum PRODUCTION_STATUS {
  WAITING = 'waiting',
  IN_PRODUCTION = 'in_production',
  HARVESTED = 'harvested',
  CANCELLED = 'cancelled'
}

export interface Production {
  id?: string;
  userId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  status: PRODUCTION_STATUS;
  plantingDate?: Timestamp;
  expectedHarvestDate?: Timestamp;
  actualHarvestDate?: Timestamp;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
