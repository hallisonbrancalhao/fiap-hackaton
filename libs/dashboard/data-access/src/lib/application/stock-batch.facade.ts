import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, forkJoin, of, throwError } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { StockBatchRepository } from '../infrastructure/stock-batch.repository';
import {
  StockBatch,
  CreateStockBatchInput,
  BatchAllocation,
  AllocationResult,
  BATCH_STATUS,
  HARVEST_QUALITY,
  generateBatchNumber,
  calculateBatchTotalCost,
  isBatchAvailable
} from '@fiap-hackaton/dashboard-domain';

export type AllocationStrategy = 'FIFO' | 'LIFO' | 'FEFO' | 'HIGHEST_QUALITY' | 'LOWEST_COST';

@Injectable({
  providedIn: 'root'
})
export class StockBatchFacade {
  private repository = inject(StockBatchRepository);

  /**
   * Cria um novo lote de estoque a partir de uma colheita
   */
  createBatch(input: CreateStockBatchInput): Observable<string> {
    const totalCost = calculateBatchTotalCost({
      productionCost: input.productionCost,
      harvestCost: input.harvestCost,
      processingCost: input.processingCost || 0,
      storageCost: 0
    });

    const averageCostPerUnit = input.quantity > 0 ? totalCost / input.quantity : 0;

    const batchNumber = generateBatchNumber(input.productId);

    const batch: Omit<StockBatch, 'id'> = {
      userId: input.userId,
      productId: input.productId,
      productName: input.productName,
      productionId: input.productionId,
      harvestId: input.harvestId,
      batchNumber,
      initialQuantity: input.quantity,
      currentQuantity: input.quantity,
      reservedQuantity: 0,
      soldQuantity: 0,
      lostQuantity: 0,
      unit: input.unit,
      averageCostPerUnit,
      totalCost,
      productionCost: input.productionCost,
      harvestCost: input.harvestCost,
      processingCost: input.processingCost || 0,
      storageCost: 0,
      quality: input.quality,
      harvestDate: input.harvestDate,
      receivedDate: Timestamp.now(),
      status: BATCH_STATUS.AVAILABLE,
      certifications: input.certifications || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      ...(input.grade && { grade: input.grade }),
      ...(input.expirationDate && { expirationDate: input.expirationDate }),
      ...(input.warehouseLocation && { warehouseLocation: input.warehouseLocation }),
      ...(input.notes && { notes: input.notes })
    };

    return this.repository.create(batch);
  }

  /**
   * Aloca quantidade de lotes para uma venda usando estratégia especificada
   */
  allocateBatches(
    userId: string,
    productId: string,
    quantityNeeded: number,
    strategy: AllocationStrategy = 'FIFO'
  ): Observable<AllocationResult> {
    return this.getBatchesByStrategy(userId, productId, strategy).pipe(
      map(batches => this.calculateAllocation(batches, quantityNeeded))
    );
  }

  /**
   * Confirma alocação e atualiza quantidades dos lotes
   */
  confirmAllocation(allocations: BatchAllocation[]): Observable<void> {
    const updates = allocations.map(allocation => {
      return this.repository.getById(allocation.batchId).pipe(
        switchMap(batch => {
          if (!batch) {
            return throwError(() => new Error(`Batch ${allocation.batchId} not found`));
          }

          const newCurrentQuantity = batch.currentQuantity - allocation.quantityAllocated;
          const newSoldQuantity = batch.soldQuantity + allocation.quantityAllocated;
          const newStatus = newCurrentQuantity <= 0 ? BATCH_STATUS.SOLD_OUT : batch.status;

          return this.repository.update(batch.id!, {
            currentQuantity: newCurrentQuantity,
            soldQuantity: newSoldQuantity,
            status: newStatus,
            updatedAt: Timestamp.now()
          });
        })
      );
    });

    return forkJoin(updates).pipe(map(() => void 0));
  }

  /**
   * Reserva quantidade em lotes (não confirma venda)
   */
  reserveBatches(allocations: BatchAllocation[]): Observable<void> {
    const updates = allocations.map(allocation => {
      return this.repository.getById(allocation.batchId).pipe(
        switchMap(batch => {
          if (!batch) {
            return throwError(() => new Error(`Batch ${allocation.batchId} not found`));
          }

          const newReservedQuantity = batch.reservedQuantity + allocation.quantityAllocated;
          const newStatus = batch.currentQuantity - newReservedQuantity <= 0
            ? BATCH_STATUS.RESERVED
            : batch.status;

          return this.repository.update(batch.id!, {
            reservedQuantity: newReservedQuantity,
            status: newStatus,
            updatedAt: Timestamp.now()
          });
        })
      );
    });

    return forkJoin(updates).pipe(map(() => void 0));
  }

  /**
   * Cancela reserva de lotes
   */
  cancelReservation(allocations: BatchAllocation[]): Observable<void> {
    const updates = allocations.map(allocation => {
      return this.repository.getById(allocation.batchId).pipe(
        switchMap(batch => {
          if (!batch) {
            return throwError(() => new Error(`Batch ${allocation.batchId} not found`));
          }

          const newReservedQuantity = Math.max(0, batch.reservedQuantity - allocation.quantityAllocated);
          const newStatus = batch.currentQuantity > 0
            ? BATCH_STATUS.AVAILABLE
            : batch.status;

          return this.repository.update(batch.id!, {
            reservedQuantity: newReservedQuantity,
            status: newStatus,
            updatedAt: Timestamp.now()
          });
        })
      );
    });

    return forkJoin(updates).pipe(map(() => void 0));
  }

  /**
   * Registra perda em um lote
   */
  registerLoss(batchId: string, lostQuantity: number, reason: string): Observable<void> {
    return this.repository.getById(batchId).pipe(
      switchMap(batch => {
        if (!batch) {
          return throwError(() => new Error(`Batch ${batchId} not found`));
        }

        const newCurrentQuantity = Math.max(0, batch.currentQuantity - lostQuantity);
        const newLostQuantity = batch.lostQuantity + lostQuantity;
        const newStatus = newCurrentQuantity <= 0
          ? BATCH_STATUS.DAMAGED
          : batch.status;

        const notes = batch.notes
          ? `${batch.notes}\n[${new Date().toISOString()}] Loss: ${lostQuantity} - ${reason}`
          : `[${new Date().toISOString()}] Loss: ${lostQuantity} - ${reason}`;

        return this.repository.update(batch.id!, {
          currentQuantity: newCurrentQuantity,
          lostQuantity: newLostQuantity,
          status: newStatus,
          notes,
          updatedAt: Timestamp.now()
        }).pipe(map(() => void 0));
      })
    );
  }

  /**
   * Marca lotes vencidos
   */
  markExpiredBatches(userId: string): Observable<void> {
    return this.repository.getExpired(userId).pipe(
      switchMap(batches => {
        if (batches.length === 0) {
          return of(void 0);
        }

        const updates = batches.map(batch => {
          return this.repository.update(batch.id!, {
            status: BATCH_STATUS.EXPIRED,
            updatedAt: Timestamp.now()
          });
        });

        return forkJoin(updates).pipe(map(() => void 0));
      })
    );
  }

  /**
   * Busca lotes disponíveis por produto
   */
  getAvailableBatches(userId: string, productId: string): Observable<StockBatch[]> {
    return this.repository.getAvailableByProduct(userId, productId);
  }

  /**
   * Busca lotes por colheita
   */
  getBatchesByHarvest(userId: string, harvestId: string): Observable<StockBatch[]> {
    return this.repository.getByHarvest(userId, harvestId);
  }

  /**
   * Busca lotes por produção
   */
  getBatchesByProduction(userId: string, productionId: string): Observable<StockBatch[]> {
    return this.repository.getByProduction(userId, productionId);
  }

  /**
   * Busca lotes próximos do vencimento
   */
  getNearExpirationBatches(userId: string, daysThreshold = 7): Observable<StockBatch[]> {
    return this.repository.getNearExpiration(userId, daysThreshold);
  }

  /**
   * Busca lotes vencidos
   */
  getExpiredBatches(userId: string): Observable<StockBatch[]> {
    return this.repository.getExpired(userId);
  }

  /**
   * Busca todos os lotes do usuário
   */
  getAllBatches(userId: string): Observable<StockBatch[]> {
    return this.repository.getAllByUser(userId);
  }

  /**
   * Calcula quantidade total disponível de um produto
   */
  getTotalAvailableQuantity(userId: string, productId: string): Observable<number> {
    return this.repository.getTotalAvailableQuantity(userId, productId);
  }

  /**
   * Busca um lote por ID
   */
  getBatchById(batchId: string): Observable<StockBatch | null> {
    return this.repository.getById(batchId);
  }

  /**
   * Busca um lote por número
   */
  getBatchByNumber(userId: string, batchNumber: string): Observable<StockBatch | null> {
    return this.repository.getByBatchNumber(userId, batchNumber).pipe(
      map(batches => batches.length > 0 ? batches[0] : null)
    );
  }

  /**
   * Atualiza um lote
   */
  updateBatch(batchId: string, updates: Partial<StockBatch>): Observable<void> {
    return this.repository.update(batchId, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  /**
   * Remove um lote (soft delete através de status)
   */
  deleteBatch(batchId: string): Observable<void> {
    return this.repository.update(batchId, {
      status: BATCH_STATUS.DAMAGED,
      updatedAt: Timestamp.now()
    }).pipe(map(() => void 0));
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Busca lotes usando a estratégia especificada
   */
  private getBatchesByStrategy(
    userId: string,
    productId: string,
    strategy: AllocationStrategy
  ): Observable<StockBatch[]> {
    switch (strategy) {
      case 'FIFO':
        return this.repository.getByProductFIFO(userId, productId);

      case 'LIFO':
        return this.repository.getByProductLIFO(userId, productId);

      case 'FEFO':
        return this.repository.getByProductFEFO(userId, productId);

      case 'HIGHEST_QUALITY':
        return this.repository.getAvailableByProduct(userId, productId).pipe(
          map(batches => this.sortByQuality(batches))
        );

      case 'LOWEST_COST':
        return this.repository.getAvailableByProduct(userId, productId).pipe(
          map(batches => batches.sort((a, b) => a.averageCostPerUnit - b.averageCostPerUnit))
        );

      default:
        return this.repository.getByProductFIFO(userId, productId);
    }
  }

  /**
   * Calcula alocação de lotes para atender quantidade necessária
   */
  private calculateAllocation(batches: StockBatch[], quantityNeeded: number): AllocationResult {
    const allocations: BatchAllocation[] = [];
    let remainingQuantity = quantityNeeded;
    let totalCost = 0;

    for (const batch of batches) {
      if (remainingQuantity <= 0) break;
      if (!isBatchAvailable(batch)) continue;

      const quantityToAllocate = Math.min(batch.currentQuantity, remainingQuantity);
      const allocationCost = quantityToAllocate * batch.averageCostPerUnit;

      allocations.push({
        batchId: batch.id!,
        batchNumber: batch.batchNumber,
        quantityAllocated: quantityToAllocate,
        costPerUnit: batch.averageCostPerUnit,
        quality: batch.quality,
        grade: batch.grade,
        harvestDate: batch.harvestDate,
        productionId: batch.productionId,
        harvestId: batch.harvestId
      });

      remainingQuantity -= quantityToAllocate;
      totalCost += allocationCost;
    }

    const totalQuantityAllocated = quantityNeeded - remainingQuantity;
    const averageCostPerUnit = totalQuantityAllocated > 0 ? totalCost / totalQuantityAllocated : 0;

    return {
      allocations,
      totalQuantityAllocated,
      totalCost,
      averageCostPerUnit,
      hasInsufficientStock: remainingQuantity > 0,
      remainingQuantityNeeded: remainingQuantity
    };
  }

  /**
   * Ordena lotes por qualidade (melhor primeiro)
   */
  private sortByQuality(batches: StockBatch[]): StockBatch[] {
    const qualityOrder: Record<HARVEST_QUALITY, number> = {
      [HARVEST_QUALITY.EXCELLENT]: 4,
      [HARVEST_QUALITY.GOOD]: 3,
      [HARVEST_QUALITY.AVERAGE]: 2,
      [HARVEST_QUALITY.POOR]: 1
    };

    return batches.sort((a, b) => {
      const qualityDiff = qualityOrder[b.quality] - qualityOrder[a.quality];
      if (qualityDiff !== 0) return qualityDiff;

      // Se mesma qualidade, ordenar por grade
      if (a.grade && b.grade) {
        return a.grade.localeCompare(b.grade);
      }

      return 0;
    });
  }
}
