import { Timestamp } from '@angular/fire/firestore';

export enum GOAL_TYPE {
  SALES = 'sales',
  PRODUCTION = 'production'
}

export enum GOAL_PERIOD {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export interface Goal {
  id?: string;
  userId: string;
  type: GOAL_TYPE;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  period: GOAL_PERIOD;
  startDate: Timestamp;
  endDate: Timestamp;
  isCompleted: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
