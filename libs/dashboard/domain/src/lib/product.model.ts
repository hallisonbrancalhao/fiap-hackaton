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
  userId: string;
  name: string;
  category: PRODUCT_CATEGORY;
  unit: PRODUCT_UNIT;
  pricePerUnit: number;
  description?: string;
  imageUrl?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
