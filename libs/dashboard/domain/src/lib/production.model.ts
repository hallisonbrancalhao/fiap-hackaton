import { Timestamp } from '@angular/fire/firestore';

export enum PRODUCTION_STATUS {
  WAITING = 'waiting',
  IN_PRODUCTION = 'in_production',
  HARVESTED = 'harvested',
  CANCELLED = 'cancelled'
}

export interface Production {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  quantityPlanted: number;
  plantingUnit?: string;
  quantityHarvested?: number;
  unit: string;
  status: PRODUCTION_STATUS;
  plantingDate: Timestamp;
  expectedHarvestDate: Timestamp;
  actualHarvestDate?: Timestamp;

  // Custos de produção
  costPerUnit: number; // Custo médio por unidade plantada
  totalCost: number; // Custo total do plantio
  seedCost?: number; // Custo de sementes
  laborCost?: number; // Custo de mão de obra
  fertilizerCost?: number; // Custo de fertilizantes
  irrigationCost?: number; // Custo de irrigação
  otherCosts?: number; // Outros custos

  // Área e localização
  areaPlanted?: number; // Área plantada em hectares ou m²
  areaUnit?: 'hectare' | 'm2';
  plotLocation?: string; // Localização do lote/talhão

  // Informações agronômicas
  varietyName?: string; // Variedade/cultivar plantada
  sowingMethod?: 'direct' | 'transplant' | 'seed'; // Método de plantio
  expectedYieldPerArea?: number; // Produtividade esperada

  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Calcula o progresso de um plantio em relação à data de colheita esperada
 * @param production - Objeto de produção
 * @returns Percentual de progresso (0-100)
 */
export function calculatePlantingProgress(production: Production): number {
  if (production.status !== PRODUCTION_STATUS.IN_PRODUCTION && production.status !== PRODUCTION_STATUS.WAITING) {
    return production.status === PRODUCTION_STATUS.HARVESTED ? 100 : 0;
  }

  const plantingTime = production.plantingDate.toMillis();
  const expectedHarvestTime = production.expectedHarvestDate.toMillis();
  const now = Date.now();

  const totalDuration = expectedHarvestTime - plantingTime;
  const elapsed = now - plantingTime;

  const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  return Math.round(progress);
}

/**
 * Retorna os dias restantes para a colheita
 */
export function getDaysUntilHarvest(production: Production): number {
  const now = Date.now();
  const harvestTime = production.expectedHarvestDate.toMillis();
  const diff = harvestTime - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
