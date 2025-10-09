import { Timestamp } from '@angular/fire/firestore';
import { HARVEST_QUALITY } from './harvest.model';

export enum BATCH_STATUS {
  AVAILABLE = 'available',      // Disponível para venda
  RESERVED = 'reserved',         // Reservado para venda
  SOLD_OUT = 'sold_out',         // Esgotado
  EXPIRED = 'expired',           // Vencido
  DAMAGED = 'damaged'            // Danificado/Perdido
}

/**
 * Representa um lote de estoque vinculado a uma colheita específica
 * Permite rastreabilidade total do produto e gestão precisa de custos
 */
export interface StockBatch {
  id?: string;
  userId: string;

  // Rastreabilidade
  productId: string;
  productName: string;
  productionId: string;         // Vincula ao plantio
  harvestId: string;             // Vincula à colheita específica

  // Identificação do lote
  batchNumber: string;           // Ex: "BATCH-2025-001"
  externalLotCode?: string;      // Código externo (certificação, rastreio)

  // Quantidades
  initialQuantity: number;       // Quantidade inicial do lote
  currentQuantity: number;       // Quantidade atual disponível
  reservedQuantity: number;      // Quantidade reservada (pedidos pendentes)
  soldQuantity: number;          // Quantidade já vendida
  lostQuantity: number;          // Quantidade perdida (vencimento, danos)
  unit: string;

  // Custos (herdados da colheita)
  averageCostPerUnit: number;    // Custo médio por unidade deste lote
  totalCost: number;             // Custo total do lote

  // Breakdown de custos
  productionCost: number;        // Custo de produção
  harvestCost: number;           // Custo de colheita
  processingCost?: number;       // Custo de processamento
  storageCost?: number;          // Custo de armazenamento

  // Qualidade e origem
  quality: HARVEST_QUALITY;      // Qualidade da colheita
  grade?: 'A' | 'B' | 'C';      // Classificação

  // Datas importantes
  harvestDate: Timestamp;        // Data da colheita
  expirationDate?: Timestamp;    // Data de validade
  receivedDate: Timestamp;       // Data que entrou no estoque

  // Status e localização
  status: BATCH_STATUS;
  warehouseLocation?: string;    // Localização no armazém
  shelfPosition?: string;        // Posição na prateleira

  // Rastreabilidade adicional
  certifications?: string[];     // Certificações do lote
  inspectionResults?: {
    date: Timestamp;
    approved: boolean;
    inspector?: string;
    notes?: string;
  };

  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * DTO para criar um novo lote de estoque
 */
export interface CreateStockBatchInput {
  userId: string;
  productId: string;
  productName: string;
  productionId: string;
  harvestId: string;

  quantity: number;
  unit: string;

  productionCost: number;
  harvestCost: number;
  processingCost?: number;

  quality: HARVEST_QUALITY;
  grade?: 'A' | 'B' | 'C';

  harvestDate: Timestamp;
  expirationDate?: Timestamp;
  warehouseLocation?: string;
  certifications?: string[];
  notes?: string;
}

/**
 * DTO para alocar quantidade de um lote para venda
 */
export interface BatchAllocation {
  batchId: string;
  batchNumber: string;
  quantityAllocated: number;
  costPerUnit: number;
  quality: HARVEST_QUALITY;
  grade?: 'A' | 'B' | 'C';
  harvestDate: Timestamp;
  productionId: string;
  harvestId: string;
}

/**
 * Resultado da estratégia de alocação (FIFO, LIFO, etc)
 */
export interface AllocationResult {
  allocations: BatchAllocation[];
  totalQuantityAllocated: number;
  totalCost: number;
  averageCostPerUnit: number;
  hasInsufficientStock: boolean;
  remainingQuantityNeeded: number;
}

/**
 * Calcula o custo total de um lote
 */
export function calculateBatchTotalCost(batch: Partial<StockBatch>): number {
  return (batch.productionCost || 0) +
         (batch.harvestCost || 0) +
         (batch.processingCost || 0) +
         (batch.storageCost || 0);
}

/**
 * Calcula o custo médio por unidade de um lote
 */
export function calculateBatchCostPerUnit(batch: StockBatch): number {
  if (batch.initialQuantity === 0) return 0;
  return batch.totalCost / batch.initialQuantity;
}

/**
 * Verifica se um lote está disponível para alocação
 */
export function isBatchAvailable(batch: StockBatch): boolean {
  return batch.status === BATCH_STATUS.AVAILABLE &&
         batch.currentQuantity > 0;
}

/**
 * Verifica se um lote está próximo do vencimento
 */
export function isBatchNearExpiration(batch: StockBatch, daysThreshold = 7): boolean {
  if (!batch.expirationDate) return false;

  const now = Date.now();
  const expirationTime = batch.expirationDate.toMillis();
  const daysUntilExpiration = (expirationTime - now) / (1000 * 60 * 60 * 24);

  return daysUntilExpiration <= daysThreshold && daysUntilExpiration > 0;
}

/**
 * Verifica se um lote está vencido
 */
export function isBatchExpired(batch: StockBatch): boolean {
  if (!batch.expirationDate) return false;
  return Date.now() > batch.expirationDate.toMillis();
}

/**
 * Calcula o percentual vendido de um lote
 */
export function calculateBatchSoldPercentage(batch: StockBatch): number {
  if (batch.initialQuantity === 0) return 0;
  return (batch.soldQuantity / batch.initialQuantity) * 100;
}

/**
 * Calcula dias em estoque
 */
export function calculateDaysInStock(batch: StockBatch): number {
  const now = Date.now();
  const receivedTime = batch.receivedDate.toMillis();
  return Math.floor((now - receivedTime) / (1000 * 60 * 60 * 24));
}

/**
 * Gera número de lote único
 */
export function generateBatchNumber(productId: string): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return `BATCH-${year}${month}${day}-${productId.substring(0, 4).toUpperCase()}-${random}`;
}
