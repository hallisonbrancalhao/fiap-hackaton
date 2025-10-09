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
  name: string;
  category: PRODUCT_CATEGORY | string;
  unit: PRODUCT_UNIT | string;
  pricePerUnit: number;
  description?: string;
  imageUrl?: string;
  
  // Estoque
  currentStock: number; // Quantidade atual em estoque
  minStockLevel?: number; // Nível mínimo de estoque (alerta)
  maxStockLevel?: number; // Nível máximo de estoque
  
  // Custos e precificação
  averageCost?: number; // Custo médio de produção por unidade
  suggestedPrice?: number; // Preço sugerido baseado em custos + margem
  
  // Informações do produto
  variety?: string; // Variedade/cultivar
  origin?: string; // Origem do produto
  shelfLife?: number; // Vida útil em dias
  storageConditions?: string; // Condições de armazenamento
  
  // Certificações e classificação
  isOrganic?: boolean;
  certifications?: string[]; // Certificações (orgânico, fair trade, etc)
  gradeQuality?: 'A' | 'B' | 'C'; // Classificação de qualidade
  
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
