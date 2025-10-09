import { Timestamp } from '@angular/fire/firestore';
import { HARVEST_QUALITY } from './harvest.model';

/**
 * Analytics detalhado por lote de estoque
 * Permite análise de lucratividade, performance e ROI por colheita específica
 */
export interface BatchAnalytics {
  id?: string;
  userId: string;

  // Identificação
  batchId: string;
  batchNumber: string;
  productId: string;
  productName: string;
  productionId: string;
  harvestId: string;

  // Quantidades
  initialQuantity: number;
  quantitySold: number;
  quantityRemaining: number;
  quantityLost: number;         // Perdas/vencimentos
  quantityReserved: number;     // Reservado mas não vendido

  // Percentuais
  soldPercentage: number;       // % vendido
  lossPercentage: number;       // % de perda

  // Custos
  totalCost: number;
  costPerUnit: number;

  // Breakdown de custos
  productionCost: number;
  harvestCost: number;
  processingCost: number;
  storageCost: number;

  // Receitas e lucro
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;         // % margem de lucro

  // Performance
  averageSalePrice: number;
  numberOfSales: number;
  daysInStock: number;          // Dias desde entrada até última venda/vencimento
  turnoverRate: number;         // Taxa de giro (vendas / dias)

  // ROI
  roi: number;                  // Retorno sobre investimento (%)
  paybackPeriod?: number;       // Tempo para recuperar investimento (dias)
  profitPerDay?: number;        // Lucro por dia

  // Qualidade
  quality: HARVEST_QUALITY;
  grade?: 'A' | 'B' | 'C';

  // Comparação
  comparisonVsAverage?: {
    profitMarginDiff: number;   // Diferença vs média do produto
    revenueDiff: number;
    turnoverDiff: number;
  };

  // Datas
  harvestDate: Timestamp;
  firstSaleDate?: Timestamp;
  lastSaleDate?: Timestamp;
  expirationDate?: Timestamp;

  // Status
  isActive: boolean;            // Ainda tem estoque disponível
  isSoldOut: boolean;
  isExpired: boolean;

  // Período de análise
  period: {
    startDate: Timestamp;       // Data de entrada no estoque
    endDate: Timestamp;         // Data de saída/vencimento ou agora
  };

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Resumo de analytics de múltiplos lotes
 */
export interface BatchAnalyticsSummary {
  userId: string;
  productId?: string;           // Opcional: analytics por produto específico

  // Totais
  totalBatches: number;
  activeBatches: number;
  soldOutBatches: number;
  expiredBatches: number;

  // Quantidades
  totalInitialQuantity: number;
  totalQuantitySold: number;
  totalQuantityRemaining: number;
  totalQuantityLost: number;

  // Financeiro
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  averageProfitMargin: number;
  averageROI: number;

  // Performance
  averageDaysInStock: number;
  averageTurnoverRate: number;
  totalNumberOfSales: number;

  // Melhor e pior
  bestPerformingBatch?: {
    batchId: string;
    batchNumber: string;
    profitMargin: number;
    revenue: number;
    roi: number;
  };

  worstPerformingBatch?: {
    batchId: string;
    batchNumber: string;
    profitMargin: number;
    revenue: number;
    roi: number;
  };

  // Distribuição por qualidade
  qualityDistribution: {
    excellent: {
      count: number;
      avgProfitMargin: number;
      totalRevenue: number;
    };
    good: {
      count: number;
      avgProfitMargin: number;
      totalRevenue: number;
    };
    average: {
      count: number;
      avgProfitMargin: number;
      totalRevenue: number;
    };
    poor: {
      count: number;
      avgProfitMargin: number;
      totalRevenue: number;
    };
  };

  period: {
    startDate: Timestamp;
    endDate: Timestamp;
  };

  generatedAt: Timestamp;
}

/**
 * Comparação entre dois lotes
 */
export interface BatchComparison {
  batch1: {
    id: string;
    batchNumber: string;
    profitMargin: number;
    roi: number;
    turnoverRate: number;
    daysInStock: number;
  };

  batch2: {
    id: string;
    batchNumber: string;
    profitMargin: number;
    roi: number;
    turnoverRate: number;
    daysInStock: number;
  };

  differences: {
    profitMarginDiff: number;   // Diferença absoluta
    profitMarginDiffPercent: number; // Diferença percentual
    roiDiff: number;
    roiDiffPercent: number;
    turnoverDiff: number;
    daysInStockDiff: number;
  };

  winner: 'batch1' | 'batch2' | 'tie';
  winnerReason: string;
}

/**
 * Calcula ROI de um lote
 */
export function calculateBatchROI(totalRevenue: number, totalCost: number): number {
  if (totalCost === 0) return 0;
  return ((totalRevenue - totalCost) / totalCost) * 100;
}

/**
 * Calcula período de payback (em dias)
 */
export function calculatePaybackPeriod(
  totalCost: number,
  totalRevenue: number,
  daysInStock: number
): number {
  if (totalRevenue === 0 || totalRevenue < totalCost) return 0;

  const dailyRevenue = totalRevenue / daysInStock;
  if (dailyRevenue === 0) return 0;

  return totalCost / dailyRevenue;
}

/**
 * Calcula taxa de giro (turnover)
 */
export function calculateTurnoverRate(
  quantitySold: number,
  initialQuantity: number,
  daysInStock: number
): number {
  if (daysInStock === 0 || initialQuantity === 0) return 0;

  const soldPercentage = (quantitySold / initialQuantity) * 100;
  return soldPercentage / daysInStock;
}

/**
 * Determina o status de performance de um lote
 */
export function getBatchPerformanceStatus(analytics: BatchAnalytics): 'excellent' | 'good' | 'average' | 'poor' {
  if (analytics.profitMargin >= 50 && analytics.roi >= 100) return 'excellent';
  if (analytics.profitMargin >= 30 && analytics.roi >= 50) return 'good';
  if (analytics.profitMargin >= 10 && analytics.roi >= 20) return 'average';
  return 'poor';
}

/**
 * Compara dois lotes e determina qual teve melhor performance
 */
export function compareBatches(
  analytics1: BatchAnalytics,
  analytics2: BatchAnalytics
): BatchComparison {
  const profitMarginDiff = analytics1.profitMargin - analytics2.profitMargin;
  const roiDiff = analytics1.roi - analytics2.roi;
  const turnoverDiff = analytics1.turnoverRate - analytics2.turnoverRate;
  const daysInStockDiff = analytics1.daysInStock - analytics2.daysInStock;

  const profitMarginDiffPercent = analytics2.profitMargin !== 0
    ? (profitMarginDiff / analytics2.profitMargin) * 100
    : 0;

  const roiDiffPercent = analytics2.roi !== 0
    ? (roiDiff / analytics2.roi) * 100
    : 0;

  // Pontuação ponderada
  const score1 = (analytics1.profitMargin * 0.4) + (analytics1.roi * 0.3) + (analytics1.turnoverRate * 0.3);
  const score2 = (analytics2.profitMargin * 0.4) + (analytics2.roi * 0.3) + (analytics2.turnoverRate * 0.3);

  let winner: 'batch1' | 'batch2' | 'tie' = 'tie';
  let winnerReason = 'Ambos os lotes tiveram performance similar';

  if (score1 > score2) {
    winner = 'batch1';
    winnerReason = `Lote ${analytics1.batchNumber} teve melhor performance geral`;
  } else if (score2 > score1) {
    winner = 'batch2';
    winnerReason = `Lote ${analytics2.batchNumber} teve melhor performance geral`;
  }

  return {
    batch1: {
      id: analytics1.batchId,
      batchNumber: analytics1.batchNumber,
      profitMargin: analytics1.profitMargin,
      roi: analytics1.roi,
      turnoverRate: analytics1.turnoverRate,
      daysInStock: analytics1.daysInStock
    },
    batch2: {
      id: analytics2.batchId,
      batchNumber: analytics2.batchNumber,
      profitMargin: analytics2.profitMargin,
      roi: analytics2.roi,
      turnoverRate: analytics2.turnoverRate,
      daysInStock: analytics2.daysInStock
    },
    differences: {
      profitMarginDiff,
      profitMarginDiffPercent,
      roiDiff,
      roiDiffPercent,
      turnoverDiff,
      daysInStockDiff
    },
    winner,
    winnerReason
  };
}

/**
 * Calcula lucro por dia
 */
export function calculateProfitPerDay(totalProfit: number, daysInStock: number): number {
  if (daysInStock === 0) return 0;
  return totalProfit / daysInStock;
}

/**
 * Verifica se um lote é lucrativo
 */
export function isBatchProfitable(analytics: BatchAnalytics): boolean {
  return analytics.totalProfit > 0 && analytics.profitMargin > 0;
}

/**
 * Calcula eficiência de venda (quanto foi vendido vs quanto poderia ser vendido)
 */
export function calculateSalesEfficiency(analytics: BatchAnalytics): number {
  const potentialRevenue = analytics.initialQuantity * analytics.averageSalePrice;
  if (potentialRevenue === 0) return 0;

  return (analytics.totalRevenue / potentialRevenue) * 100;
}
