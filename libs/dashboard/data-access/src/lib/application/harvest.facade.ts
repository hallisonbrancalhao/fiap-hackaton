import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, forkJoin, of, map, catchError } from 'rxjs';
import { Harvest, HARVEST_QUALITY, PRODUCTION_STATUS, CreateStockBatchInput } from '@fiap-hackaton/dashboard-domain';
import { HarvestRepository } from '../infrastructure/harvest.repository';
import { ProductionRepository } from '../infrastructure/production.repository';
import { ProductRepository } from '../infrastructure/product.repository';
import { GoalFacade } from './goal.facade';
import { StockBatchFacade } from './stock-batch.facade';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class HarvestFacade {
  private harvestRepository = inject(HarvestRepository);
  private productionRepository = inject(ProductionRepository);
  private productRepository = inject(ProductRepository);
  private goalFacade = inject(GoalFacade);
  private stockBatchFacade = inject(StockBatchFacade);

  create(harvest: Omit<Harvest, 'id'>): Observable<string> {
    return this.harvestRepository.create(harvest);
  }

  update(id: string, harvest: Partial<Harvest>): Observable<void> {
    return this.harvestRepository.update(id, harvest);
  }

  delete(id: string): Observable<void> {
    return this.harvestRepository.delete(id);
  }

  getById(id: string): Observable<Harvest | null> {
    return this.harvestRepository.getById(id);
  }

  getByUserId(userId: string): Observable<Harvest[]> {
    return this.harvestRepository.getByUserId(userId);
  }

  getByProduction(productionId: string): Observable<Harvest[]> {
    return this.harvestRepository.getByProduction(productionId);
  }

  getByProduct(userId: string, productId: string): Observable<Harvest[]> {
    return this.harvestRepository.getByProduct(userId, productId);
  }

  getByQuality(userId: string, quality: HARVEST_QUALITY): Observable<Harvest[]> {
    return this.harvestRepository.getByQuality(userId, quality);
  }

  getByDateRange(
    userId: string,
    startDate: Timestamp,
    endDate: Timestamp
  ): Observable<Harvest[]> {
    return this.harvestRepository.getByDateRange(userId, startDate, endDate);
  }

  getRecentHarvests(userId: string, limit?: number): Observable<Harvest[]> {
    return this.harvestRepository.getRecentHarvests(userId, limit);
  }

  /**
   * Realiza a colheita completa: registra a colheita, cria lote de estoque e atualiza produção
   */
  performHarvest(harvest: Omit<Harvest, 'id'>): Observable<string> {
    return this.harvestRepository.create(harvest).pipe(
      switchMap(harvestId => {
        // Buscar informações do produto e da produção
        return forkJoin({
          harvestId: of(harvestId),
          product: this.productRepository.getById(harvest.productId),
          production: this.productionRepository.getById(harvest.productionId)
        });
      }),
      switchMap(({ harvestId, product, production }) => {
        if (!product || !production) {
          throw new Error('Product or production not found');
        }

        // Criar lote de estoque a partir da colheita
        const batchInput: CreateStockBatchInput = {
          userId: harvest.userId,
          productId: harvest.productId,
          productName: product.name,
          productionId: harvest.productionId,
          harvestId: harvestId,
          quantity: harvest.quantityHarvested,
          unit: product.unit,
          productionCost: production.totalCost || 0,
          harvestCost: harvest.harvestCost || 0,
          processingCost: 0, // Pode ser adicionado depois
          quality: harvest.quality,
          grade: undefined, // Pode ser definido depois
          harvestDate: harvest.harvestDate,
          expirationDate: undefined, // Pode ser definido depois via UI
          warehouseLocation: undefined,
          certifications: [],
          notes: harvest.notes
        };

        return forkJoin({
          harvestId: of(harvestId),
          batch: this.stockBatchFacade.createBatch(batchInput),
          production: of(production)
        });
      }),
      switchMap(({ harvestId }) => {
        // Atualizar status da produção para HARVESTED
        return this.productionRepository.update(harvest.productionId, {
          status: PRODUCTION_STATUS.HARVESTED,
          updatedAt: Timestamp.now()
        }).pipe(
          map(() => harvestId)
        );
      }),
      switchMap(harvestId => {
        // Atualizar metas de produção
        return this.updateProductionGoals(harvest.userId, harvest.quantityHarvested).pipe(
          map(() => harvestId)
        );
      }),
      catchError(() => {
        throw new Error('Error performing harvest');
      })
    );
  }

  /**
   * Calcula o custo médio ponderado do estoque
   */
  private calculateAverageCost(
    currentStock: number,
    currentAvgCost: number,
    newQuantity: number,
    productionCost: number,
    harvestCost: number
  ): number {
    const currentValue = currentStock * currentAvgCost;
    const newCostPerUnit = productionCost + (harvestCost / newQuantity);
    const newValue = newQuantity * newCostPerUnit;
    const totalStock = currentStock + newQuantity;

    return totalStock > 0 ? (currentValue + newValue) / totalStock : 0;
  }

  /**
   * Atualiza as metas de produção após uma colheita
   */
  private updateProductionGoals(userId: string, quantityHarvested: number): Observable<void> {
    return this.goalFacade.getByType(userId, 'production' as unknown as never).pipe(
      switchMap(goals => {
        const activeGoals = goals.filter(g => !g.isCompleted);
        if (activeGoals.length === 0) {
          return of(void 0);
        }

        const updates = activeGoals.map(goal => {
          const newValue = goal.currentValue + quantityHarvested;
          const isCompleted = newValue >= goal.targetValue;

          return this.goalFacade.update(goal.id ?? '', {
            currentValue: newValue,
            isCompleted,
            updatedAt: Timestamp.now()
          });
        });

        return forkJoin(updates).pipe(map(() => void 0));
      }),
      catchError(() => {
        return of(void 0);
      })
    );
  }

  /**
   * Calcula estatísticas de colheita para um período
   */
  getHarvestStatistics(
    userId: string,
    startDate: Timestamp,
    endDate: Timestamp
  ): Observable<{
    totalHarvested: number;
    totalLost: number;
    averageQuality: number;
    totalCost: number;
    harvestsByProduct: { [productId: string]: number };
  }> {
    return this.getByDateRange(userId, startDate, endDate).pipe(
      map(harvests => {
        const stats = {
          totalHarvested: 0,
          totalLost: 0,
          averageQuality: 0,
          totalCost: 0,
          harvestsByProduct: {} as { [productId: string]: number }
        };

        const qualityValues: { [key in HARVEST_QUALITY]: number } = {
          excellent: 4,
          good: 3,
          average: 2,
          poor: 1
        };

        let totalQualityScore = 0;

        harvests.forEach(harvest => {
          stats.totalHarvested += harvest.quantityHarvested;
          stats.totalLost += harvest.quantityLost || 0;
          stats.totalCost += harvest.harvestCost || 0;

          totalQualityScore += qualityValues[harvest.quality];

          if (!stats.harvestsByProduct[harvest.productId]) {
            stats.harvestsByProduct[harvest.productId] = 0;
          }
          stats.harvestsByProduct[harvest.productId] += harvest.quantityHarvested;
        });

        stats.averageQuality = harvests.length > 0
          ? totalQualityScore / harvests.length
          : 0;

        return stats;
      })
    );
  }
}
