import { Timestamp } from '@angular/fire/firestore';

export enum HARVEST_QUALITY {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  AVERAGE = 'average',
  POOR = 'poor'
}

export interface Harvest {
  id?: string;
  userId: string;
  productionId: string; // Vincula ao plantio
  productId: string;
  productName: string;
  
  // Quantidades
  quantityHarvested: number;
  unit: string;
  quantityLost?: number; // Quantidade perdida (pragas, doenças, etc)
  lossPercentage?: number; // % de perda
  
  // Qualidade
  quality: HARVEST_QUALITY;
  gradeA?: number; // Quantidade de qualidade A
  gradeB?: number; // Quantidade de qualidade B
  gradeC?: number; // Quantidade de qualidade C
  
  // Datas
  harvestDate: Timestamp;
  harvestStartTime?: string; // Hora de início da colheita
  harvestEndTime?: string; // Hora de término da colheita
  
  // Custos da colheita
  harvestCost?: number; // Custo total da colheita
  laborCost?: number; // Custo de mão de obra
  equipmentCost?: number; // Custo de equipamentos
  transportCost?: number; // Custo de transporte
  
  // Condições
  weatherConditions?: string; // Condições climáticas durante a colheita
  temperature?: number; // Temperatura durante a colheita
  humidity?: number; // Umidade durante a colheita
  
  // Equipe
  workersCount?: number; // Número de trabalhadores
  hoursWorked?: number; // Horas trabalhadas
  
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
