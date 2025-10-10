import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, forkJoin, of } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { BatchAnalyticsRepository } from '../infrastructure/batch-analytics.repository';
import { StockBatchRepository } from '../infrastructure/stock-batch.repository';
import {
  BatchAnalytics,
  BatchAnalyticsSummary,
  BatchComparison,
  StockBatch,
  calculateBatchROI,
  calculatePaybackPeriod,
  calculateTurnoverRate,
  calculateProfitPerDay,
  compareBatches
} from '@fiap-hackaton/dashboard-domain';

@Injectable({
  providedIn: 'root'
})
export class BatchAnalyticsFacade {
  private analyticsRepository = inject(BatchAnalyticsRepository);
  private batchRepository = inject(StockBatchRepository);

  /**
   * Calcula ou atualiza analytics para um lote específico
   */
  calculateBatchAnalytics(batch: StockBatch, sales?: Array<{ quantity: number; price: number; date: Timestamp }>): Observable<string | void> {
    const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.quantity * sale.price), 0) || 0;
    const totalProfit = totalRevenue - batch.totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const roi = calculateBatchROI(totalRevenue, batch.totalCost);

    const now = Date.now();
    const receivedTime = batch.receivedDate.toMillis();
    const daysInStock = Math.floor((now - receivedTime) / (1000 * 60 * 60 * 24));

    const turnoverRate = calculateTurnoverRate(batch.soldQuantity, batch.initialQuantity, daysInStock || 1);
    const paybackPeriod = calculatePaybackPeriod(batch.totalCost, totalRevenue, daysInStock || 1);
    const profitPerDay = calculateProfitPerDay(totalProfit, daysInStock || 1);

    const soldPercentage = (batch.soldQuantity / batch.initialQuantity) * 100;
    const lossPercentage = (batch.lostQuantity / batch.initialQuantity) * 100;

    const firstSaleDate = sales && sales.length > 0
      ? sales.sort((a, b) => a.date.toMillis() - b.date.toMillis())[0].date
      : undefined;

    const lastSaleDate = sales && sales.length > 0
      ? sales.sort((a, b) => b.date.toMillis() - a.date.toMillis())[0].date
      : undefined;

    const averageSalePrice = batch.soldQuantity > 0
      ? totalRevenue / batch.soldQuantity
      : 0;

    const analytics: Omit<BatchAnalytics, 'id'> = {
      userId: batch.userId,
      batchId: batch.id ?? '',
      batchNumber: batch.batchNumber,
      productId: batch.productId,
      productName: batch.productName,
      productionId: batch.productionId,
      harvestId: batch.harvestId,

      initialQuantity: batch.initialQuantity,
      quantitySold: batch.soldQuantity,
      quantityRemaining: batch.currentQuantity,
      quantityLost: batch.lostQuantity,
      quantityReserved: batch.reservedQuantity,

      soldPercentage,
      lossPercentage,

      totalCost: batch.totalCost,
      costPerUnit: batch.averageCostPerUnit,

      productionCost: batch.productionCost,
      harvestCost: batch.harvestCost,
      processingCost: batch.processingCost || 0,
      storageCost: batch.storageCost || 0,

      totalRevenue,
      totalProfit,
      profitMargin,

      averageSalePrice,
      numberOfSales: sales?.length || 0,
      daysInStock,
      turnoverRate,

      roi,
      paybackPeriod: paybackPeriod > 0 ? paybackPeriod : undefined,
      profitPerDay: profitPerDay > 0 ? profitPerDay : undefined,

      quality: batch.quality,

      harvestDate: batch.harvestDate,

      isActive: batch.currentQuantity > 0,
      isSoldOut: batch.soldQuantity >= batch.initialQuantity,
      isExpired: batch.expirationDate ? Date.now() > batch.expirationDate.toMillis() : false,

      period: {
        startDate: batch.receivedDate,
        endDate: Timestamp.now()
      },

      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Adicionar campos opcionais apenas se existirem
    if (batch.grade) analytics.grade = batch.grade;
    if (firstSaleDate) analytics.firstSaleDate = firstSaleDate;
    if (lastSaleDate) analytics.lastSaleDate = lastSaleDate;
    if (batch.expirationDate) analytics.expirationDate = batch.expirationDate;

    // Remover campos undefined
    const cleanedAnalytics = this.removeUndefinedFields(analytics);

    // Verificar se já existe analytics para este lote
    return this.analyticsRepository.getByBatch(batch.userId, batch.id ?? '').pipe(
      switchMap(existingAnalytics => {
        if (existingAnalytics.length > 0) {
          // Atualizar existente
          return this.analyticsRepository.update(existingAnalytics[0].id ?? '', cleanedAnalytics);
        } else {
          // Criar novo
          return this.analyticsRepository.create(cleanedAnalytics);
        }
      })
    );
  }

  /**
   * Recalcula analytics para todos os lotes de um produto
   */
  recalculateProductAnalytics(userId: string, productId: string): Observable<void> {
    return this.batchRepository.getAvailableByProduct(userId, productId).pipe(
      switchMap(batches => {
        if (batches.length === 0) {
          return of(void 0);
        }

        const updates = batches.map(batch => this.calculateBatchAnalytics(batch));
        return forkJoin(updates).pipe(map(() => void 0));
      })
    );
  }

  /**
   * Gera resumo de analytics para múltiplos lotes
   */
  generateBatchSummary(userId: string, productId?: string): Observable<BatchAnalyticsSummary> {
    const analyticsObservable = productId
      ? this.analyticsRepository.getByProduct(userId, productId)
      : this.analyticsRepository.getAllByUser(userId);

    return analyticsObservable.pipe(
      map(analytics => this.buildSummary(userId, analytics, productId))
    );
  }

  /**
   * Compara dois lotes
   */
  compareTwoBatches(userId: string, batchId1: string, batchId2: string): Observable<BatchComparison | null> {
    return forkJoin({
      analytics1: this.analyticsRepository.getByBatch(userId, batchId1),
      analytics2: this.analyticsRepository.getByBatch(userId, batchId2)
    }).pipe(
      map(({ analytics1, analytics2 }) => {
        if (analytics1.length === 0 || analytics2.length === 0) {
          return null;
        }
        return compareBatches(analytics1[0], analytics2[0]);
      })
    );
  }

  /**
   * Busca lotes mais lucrativos
   */
  getMostProfitableBatches(userId: string, limit = 10): Observable<BatchAnalytics[]> {
    return this.analyticsRepository.getMostProfitable(userId, limit);
  }

  /**
   * Busca lotes menos lucrativos
   */
  getLeastProfitableBatches(userId: string, limit = 10): Observable<BatchAnalytics[]> {
    return this.analyticsRepository.getLeastProfitable(userId, limit);
  }

  /**
   * Busca lotes com melhor ROI
   */
  getHighestROIBatches(userId: string, limit = 10): Observable<BatchAnalytics[]> {
    return this.analyticsRepository.getHighestROI(userId, limit);
  }

  /**
   * Busca lotes com alta taxa de giro
   */
  getHighTurnoverBatches(userId: string, minRate = 10): Observable<BatchAnalytics[]> {
    return this.analyticsRepository.getHighTurnover(userId, minRate);
  }

  /**
   * Busca lotes com baixa taxa de giro (estoque parado)
   */
  getLowTurnoverBatches(userId: string, maxRate = 5): Observable<BatchAnalytics[]> {
    return this.analyticsRepository.getLowTurnover(userId, maxRate);
  }

  /**
   * Busca lotes com perdas significativas
   */
  getHighLossBatches(userId: string, minLossPercentage = 10): Observable<BatchAnalytics[]> {
    return this.analyticsRepository.getWithHighLosses(userId, minLossPercentage);
  }

  /**
   * Busca analytics por produto
   */
  getAnalyticsByProduct(userId: string, productId: string): Observable<BatchAnalytics[]> {
    return this.analyticsRepository.getByProduct(userId, productId);
  }

  /**
   * Busca analytics por colheita
   */
  getAnalyticsByHarvest(userId: string, harvestId: string): Observable<BatchAnalytics[]> {
    return this.analyticsRepository.getByHarvest(userId, harvestId);
  }

  /**
   * Busca analytics por produção
   */
  getAnalyticsByProduction(userId: string, productionId: string): Observable<BatchAnalytics[]> {
    return this.analyticsRepository.getByProduction(userId, productionId);
  }

  /**
   * Busca analytics ativos
   */
  getActiveAnalytics(userId: string): Observable<BatchAnalytics[]> {
    return this.analyticsRepository.getActive(userId);
  }

  /**
   * Busca analytics de lotes esgotados
   */
  getSoldOutAnalytics(userId: string): Observable<BatchAnalytics[]> {
    return this.analyticsRepository.getSoldOut(userId);
  }

  /**
   * Busca analytics de lotes vencidos
   */
  getExpiredAnalytics(userId: string): Observable<BatchAnalytics[]> {
    return this.analyticsRepository.getExpired(userId);
  }

  /**
   * Busca analytics por período
   */
  getAnalyticsByPeriod(userId: string, startDate: Timestamp, endDate: Timestamp): Observable<BatchAnalytics[]> {
    return this.analyticsRepository.getByPeriod(userId, startDate, endDate);
  }

  /**
   * Busca todos os analytics do usuário
   */
  getAllAnalytics(userId: string): Observable<BatchAnalytics[]> {
    return this.analyticsRepository.getAllByUser(userId);
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Constrói resumo de analytics
   */
  private buildSummary(userId: string, analytics: BatchAnalytics[], productId?: string): BatchAnalyticsSummary {
    if (analytics.length === 0) {
      return this.getEmptySummary(userId, productId);
    }

    const totalBatches = analytics.length;
    const activeBatches = analytics.filter(a => a.isActive).length;
    const soldOutBatches = analytics.filter(a => a.isSoldOut).length;
    const expiredBatches = analytics.filter(a => a.isExpired).length;

    const totalInitialQuantity = analytics.reduce((sum, a) => sum + a.initialQuantity, 0);
    const totalQuantitySold = analytics.reduce((sum, a) => sum + a.quantitySold, 0);
    const totalQuantityRemaining = analytics.reduce((sum, a) => sum + a.quantityRemaining, 0);
    const totalQuantityLost = analytics.reduce((sum, a) => sum + a.quantityLost, 0);

    const totalCost = analytics.reduce((sum, a) => sum + a.totalCost, 0);
    const totalRevenue = analytics.reduce((sum, a) => sum + a.totalRevenue, 0);
    const totalProfit = analytics.reduce((sum, a) => sum + a.totalProfit, 0);
    const averageProfitMargin = analytics.reduce((sum, a) => sum + a.profitMargin, 0) / totalBatches;
    const averageROI = analytics.reduce((sum, a) => sum + a.roi, 0) / totalBatches;

    const averageDaysInStock = analytics.reduce((sum, a) => sum + a.daysInStock, 0) / totalBatches;
    const averageTurnoverRate = analytics.reduce((sum, a) => sum + a.turnoverRate, 0) / totalBatches;
    const totalNumberOfSales = analytics.reduce((sum, a) => sum + a.numberOfSales, 0);

    const sortedByProfit = [...analytics].sort((a, b) => b.profitMargin - a.profitMargin);
    const bestPerforming = sortedByProfit[0];
    const worstPerforming = sortedByProfit[sortedByProfit.length - 1];

    const qualityDistribution = this.calculateQualityDistribution(analytics);

    const minDate = analytics.reduce((min, a) =>
      a.period.startDate.toMillis() < min.toMillis() ? a.period.startDate : min,
      analytics[0].period.startDate
    );
    const maxDate = analytics.reduce((max, a) =>
      a.period.endDate.toMillis() > max.toMillis() ? a.period.endDate : max,
      analytics[0].period.endDate
    );

    return {
      userId,
      productId,
      totalBatches,
      activeBatches,
      soldOutBatches,
      expiredBatches,
      totalInitialQuantity,
      totalQuantitySold,
      totalQuantityRemaining,
      totalQuantityLost,
      totalCost,
      totalRevenue,
      totalProfit,
      averageProfitMargin,
      averageROI,
      averageDaysInStock,
      averageTurnoverRate,
      totalNumberOfSales,
      bestPerformingBatch: {
        batchId: bestPerforming.batchId,
        batchNumber: bestPerforming.batchNumber,
        profitMargin: bestPerforming.profitMargin,
        revenue: bestPerforming.totalRevenue,
        roi: bestPerforming.roi
      },
      worstPerformingBatch: {
        batchId: worstPerforming.batchId,
        batchNumber: worstPerforming.batchNumber,
        profitMargin: worstPerforming.profitMargin,
        revenue: worstPerforming.totalRevenue,
        roi: worstPerforming.roi
      },
      qualityDistribution,
      period: {
        startDate: minDate,
        endDate: maxDate
      },
      generatedAt: Timestamp.now()
    };
  }

  /**
   * Calcula distribuição por qualidade
   */
  private calculateQualityDistribution(analytics: BatchAnalytics[]) {
    const distribution = {
      excellent: { count: 0, avgProfitMargin: 0, totalRevenue: 0 },
      good: { count: 0, avgProfitMargin: 0, totalRevenue: 0 },
      average: { count: 0, avgProfitMargin: 0, totalRevenue: 0 },
      poor: { count: 0, avgProfitMargin: 0, totalRevenue: 0 }
    };

    analytics.forEach(a => {
      const key = a.quality as keyof typeof distribution;
      distribution[key].count++;
      distribution[key].avgProfitMargin += a.profitMargin;
      distribution[key].totalRevenue += a.totalRevenue;
    });

    // Calcular médias
    Object.keys(distribution).forEach(key => {
      const k = key as keyof typeof distribution;
      if (distribution[k].count > 0) {
        distribution[k].avgProfitMargin /= distribution[k].count;
      }
    });

    return distribution;
  }

  /**
   * Retorna resumo vazio
   */
  private getEmptySummary(userId: string, productId?: string): BatchAnalyticsSummary {
    return {
      userId,
      productId,
      totalBatches: 0,
      activeBatches: 0,
      soldOutBatches: 0,
      expiredBatches: 0,
      totalInitialQuantity: 0,
      totalQuantitySold: 0,
      totalQuantityRemaining: 0,
      totalQuantityLost: 0,
      totalCost: 0,
      totalRevenue: 0,
      totalProfit: 0,
      averageProfitMargin: 0,
      averageROI: 0,
      averageDaysInStock: 0,
      averageTurnoverRate: 0,
      totalNumberOfSales: 0,
      qualityDistribution: {
        excellent: { count: 0, avgProfitMargin: 0, totalRevenue: 0 },
        good: { count: 0, avgProfitMargin: 0, totalRevenue: 0 },
        average: { count: 0, avgProfitMargin: 0, totalRevenue: 0 },
        poor: { count: 0, avgProfitMargin: 0, totalRevenue: 0 }
      },
      period: {
        startDate: Timestamp.now(),
        endDate: Timestamp.now()
      },
      generatedAt: Timestamp.now()
    };
  }

  /**
   * Remove campos undefined de um objeto recursivamente
   * Necessário para evitar erros do Firestore com campos undefined
   */
  private removeUndefinedFields<T>(obj: T): T {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedFields(item)) as T;
    }

    if (typeof obj === 'object' && !(obj instanceof Timestamp) && !(obj instanceof Date)) {
      const cleaned: Record<string, unknown> = {};
      Object.keys(obj as object).forEach(key => {
        const value = (obj as Record<string, unknown>)[key];
        if (value !== undefined) {
          cleaned[key] = this.removeUndefinedFields(value);
        }
      });
      return cleaned as T;
    }

    return obj;
  }
}
