import { Injectable } from '@angular/core';
import {
  collection,
  query,
  where,
  orderBy,
  Timestamp,
  CollectionReference,
  Query
} from '@angular/fire/firestore';
import { BaseRepository } from '@fiap-hackaton/shared-data-access';
import { BatchAnalytics } from '@fiap-hackaton/dashboard-domain';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BatchAnalyticsRepository extends BaseRepository<BatchAnalytics> {
  protected collectionName = 'batchAnalytics';

  /**
   * Busca analytics de um lote específico
   */
  getByBatch(userId: string, batchId: string): Observable<BatchAnalytics[]> {
    const analyticsRef = collection(this.firestore, this.collectionName) as CollectionReference<BatchAnalytics>;
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      where('batchId', '==', batchId),
      orderBy('updatedAt', 'desc')
    ) as Query<BatchAnalytics>;

    return this.getByQuery(q);
  }

  /**
   * Busca analytics por produto
   */
  getByProduct(userId: string, productId: string): Observable<BatchAnalytics[]> {
    const analyticsRef = collection(this.firestore, this.collectionName) as CollectionReference<BatchAnalytics>;
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      where('productId', '==', productId),
      orderBy('harvestDate', 'desc')
    ) as Query<BatchAnalytics>;

    return this.getByQuery(q);
  }

  /**
   * Busca analytics por colheita
   */
  getByHarvest(userId: string, harvestId: string): Observable<BatchAnalytics[]> {
    const analyticsRef = collection(this.firestore, this.collectionName) as CollectionReference<BatchAnalytics>;
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      where('harvestId', '==', harvestId),
      orderBy('createdAt', 'desc')
    ) as Query<BatchAnalytics>;

    return this.getByQuery(q);
  }

  /**
   * Busca analytics por produção
   */
  getByProduction(userId: string, productionId: string): Observable<BatchAnalytics[]> {
    const analyticsRef = collection(this.firestore, this.collectionName) as CollectionReference<BatchAnalytics>;
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      where('productionId', '==', productionId),
      orderBy('harvestDate', 'desc')
    ) as Query<BatchAnalytics>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes mais lucrativos
   */
  getMostProfitable(userId: string, _limit = 10): Observable<BatchAnalytics[]> {
    const analyticsRef = collection(this.firestore, this.collectionName) as CollectionReference<BatchAnalytics>;
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      orderBy('profitMargin', 'desc'),
      orderBy('createdAt', 'desc')
    ) as Query<BatchAnalytics>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes menos lucrativos
   */
  getLeastProfitable(userId: string, _limit = 10): Observable<BatchAnalytics[]> {
    const analyticsRef = collection(this.firestore, this.collectionName) as CollectionReference<BatchAnalytics>;
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      orderBy('profitMargin', 'asc'),
      orderBy('createdAt', 'desc')
    ) as Query<BatchAnalytics>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes com melhor ROI
   */
  getHighestROI(userId: string, _limit = 10): Observable<BatchAnalytics[]> {
    const analyticsRef = collection(this.firestore, this.collectionName) as CollectionReference<BatchAnalytics>;
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      orderBy('roi', 'desc'),
      orderBy('createdAt', 'desc')
    ) as Query<BatchAnalytics>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes ativos (ainda com estoque)
   */
  getActive(userId: string): Observable<BatchAnalytics[]> {
    const analyticsRef = collection(this.firestore, this.collectionName) as CollectionReference<BatchAnalytics>;
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('daysInStock', 'desc')
    ) as Query<BatchAnalytics>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes esgotados
   */
  getSoldOut(userId: string): Observable<BatchAnalytics[]> {
    const analyticsRef = collection(this.firestore, this.collectionName) as CollectionReference<BatchAnalytics>;
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      where('isSoldOut', '==', true),
      orderBy('lastSaleDate', 'desc')
    ) as Query<BatchAnalytics>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes vencidos
   */
  getExpired(userId: string): Observable<BatchAnalytics[]> {
    const analyticsRef = collection(this.firestore, this.collectionName) as CollectionReference<BatchAnalytics>;
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      where('isExpired', '==', true),
      orderBy('expirationDate', 'desc')
    ) as Query<BatchAnalytics>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes por período
   */
  getByPeriod(userId: string, startDate: Timestamp, endDate: Timestamp): Observable<BatchAnalytics[]> {
    const analyticsRef = collection(this.firestore, this.collectionName) as CollectionReference<BatchAnalytics>;
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      where('period.startDate', '>=', startDate),
      where('period.endDate', '<=', endDate),
      orderBy('period.startDate', 'asc'),
      orderBy('period.endDate', 'asc')
    ) as Query<BatchAnalytics>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes com alta taxa de giro
   */
  getHighTurnover(userId: string, minTurnoverRate = 10): Observable<BatchAnalytics[]> {
    const analyticsRef = collection(this.firestore, this.collectionName) as CollectionReference<BatchAnalytics>;
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      where('turnoverRate', '>=', minTurnoverRate),
      orderBy('turnoverRate', 'desc')
    ) as Query<BatchAnalytics>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes com baixa taxa de giro (estoque parado)
   */
  getLowTurnover(userId: string, maxTurnoverRate = 5): Observable<BatchAnalytics[]> {
    const analyticsRef = collection(this.firestore, this.collectionName) as CollectionReference<BatchAnalytics>;
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      where('turnoverRate', '<=', maxTurnoverRate),
      where('isActive', '==', true),
      orderBy('turnoverRate', 'asc')
    ) as Query<BatchAnalytics>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes com perdas significativas
   */
  getWithHighLosses(userId: string, minLossPercentage = 10): Observable<BatchAnalytics[]> {
    const analyticsRef = collection(this.firestore, this.collectionName) as CollectionReference<BatchAnalytics>;
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      where('lossPercentage', '>=', minLossPercentage),
      orderBy('lossPercentage', 'desc')
    ) as Query<BatchAnalytics>;

    return this.getByQuery(q);
  }

  /**
   * Busca todos os analytics de um usuário
   */
  getAllByUser(userId: string): Observable<BatchAnalytics[]> {
    const analyticsRef = collection(this.firestore, this.collectionName) as CollectionReference<BatchAnalytics>;
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ) as Query<BatchAnalytics>;

    return this.getByQuery(q);
  }
}
