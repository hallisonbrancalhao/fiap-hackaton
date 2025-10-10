import { Timestamp } from '@angular/fire/firestore';

export interface ProductAnalytics {
  id?: string;
  userId: string;
  productId: string;
  productName: string;
  totalRevenue: number;
  totalQuantitySold: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  averagePrice: number;
  period: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
  lastUpdated?: Timestamp;
}
