import { Timestamp } from '@angular/fire/firestore';

export enum PRODUCT_CATEGORY {
  VEGETABLES = 'vegetables',
  FRUITS = 'fruits',
  GRAINS = 'grains',
  DAIRY = 'dairy',
  MEAT = 'meat',
  OTHER = 'other'
}

export enum PRODUCT_UNIT {
  KG = 'kg',
  UNIT = 'unit',
  LITER = 'liter',
  BUNCH = 'bunch'
}

export interface Product {
  id?: string;
  userId?: string;
  farmId?: string;
  name: string;
  category: PRODUCT_CATEGORY | string;
  unit: PRODUCT_UNIT | string;
  pricePerUnit: number;
  description?: string;
  imageUrl?: string;
  quantity?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
