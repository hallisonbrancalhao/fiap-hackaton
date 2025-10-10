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
import {
  StockBatch,
  BATCH_STATUS,
  HARVEST_QUALITY
} from '@fiap-hackaton/dashboard-domain';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StockBatchRepository extends BaseRepository<StockBatch> {
  protected collectionName = 'stockBatches';

  /**
   * Busca lotes disponíveis por produto
   */
  getAvailableByProduct(userId: string, productId: string): Observable<StockBatch[]> {
    const batchesRef = collection(this.firestore, this.collectionName) as CollectionReference<StockBatch>;
    const q = query(
      batchesRef,
      where('userId', '==', userId),
      where('productId', '==', productId),
      where('status', '==', BATCH_STATUS.AVAILABLE),
      where('currentQuantity', '>', 0),
      orderBy('currentQuantity', 'desc')
    ) as Query<StockBatch>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes por produto ordenados por data (FIFO)
   */
  getByProductFIFO(userId: string, productId: string): Observable<StockBatch[]> {
    const batchesRef = collection(this.firestore, this.collectionName) as CollectionReference<StockBatch>;
    const q = query(
      batchesRef,
      where('userId', '==', userId),
      where('productId', '==', productId),
      where('status', '==', BATCH_STATUS.AVAILABLE),
      where('currentQuantity', '>', 0),
      orderBy('currentQuantity'),
      orderBy('harvestDate', 'asc')
    ) as Query<StockBatch>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes por produto ordenados por data (LIFO)
   */
  getByProductLIFO(userId: string, productId: string): Observable<StockBatch[]> {
    const batchesRef = collection(this.firestore, this.collectionName) as CollectionReference<StockBatch>;
    const q = query(
      batchesRef,
      where('userId', '==', userId),
      where('productId', '==', productId),
      where('status', '==', BATCH_STATUS.AVAILABLE),
      where('currentQuantity', '>', 0),
      orderBy('currentQuantity'),
      orderBy('harvestDate', 'desc')
    ) as Query<StockBatch>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes por produto ordenados por validade (FEFO)
   */
  getByProductFEFO(userId: string, productId: string): Observable<StockBatch[]> {
    const batchesRef = collection(this.firestore, this.collectionName) as CollectionReference<StockBatch>;
    const q = query(
      batchesRef,
      where('userId', '==', userId),
      where('productId', '==', productId),
      where('status', '==', BATCH_STATUS.AVAILABLE),
      where('currentQuantity', '>', 0),
      orderBy('currentQuantity'),
      orderBy('expirationDate', 'asc')
    ) as Query<StockBatch>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes próximos do vencimento
   */
  getNearExpiration(userId: string, daysThreshold = 7): Observable<StockBatch[]> {
    const now = Timestamp.now();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    const thresholdTimestamp = Timestamp.fromDate(thresholdDate);

    const batchesRef = collection(this.firestore, this.collectionName) as CollectionReference<StockBatch>;
    const q = query(
      batchesRef,
      where('userId', '==', userId),
      where('status', '==', BATCH_STATUS.AVAILABLE),
      where('expirationDate', '<=', thresholdTimestamp),
      where('expirationDate', '>', now),
      orderBy('expirationDate', 'asc')
    ) as Query<StockBatch>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes vencidos
   */
  getExpired(userId: string): Observable<StockBatch[]> {
    const now = Timestamp.now();

    const batchesRef = collection(this.firestore, this.collectionName) as CollectionReference<StockBatch>;
    const q = query(
      batchesRef,
      where('userId', '==', userId),
      where('expirationDate', '<=', now),
      orderBy('expirationDate', 'desc')
    ) as Query<StockBatch>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes por colheita
   */
  getByHarvest(userId: string, harvestId: string): Observable<StockBatch[]> {
    const batchesRef = collection(this.firestore, this.collectionName) as CollectionReference<StockBatch>;
    const q = query(
      batchesRef,
      where('userId', '==', userId),
      where('harvestId', '==', harvestId),
      orderBy('createdAt', 'desc')
    ) as Query<StockBatch>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes por produção
   */
  getByProduction(userId: string, productionId: string): Observable<StockBatch[]> {
    const batchesRef = collection(this.firestore, this.collectionName) as CollectionReference<StockBatch>;
    const q = query(
      batchesRef,
      where('userId', '==', userId),
      where('productionId', '==', productionId),
      orderBy('harvestDate', 'desc')
    ) as Query<StockBatch>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes por qualidade
   */
  getByQuality(userId: string, quality: HARVEST_QUALITY): Observable<StockBatch[]> {
    const batchesRef = collection(this.firestore, this.collectionName) as CollectionReference<StockBatch>;
    const q = query(
      batchesRef,
      where('userId', '==', userId),
      where('quality', '==', quality),
      where('status', '==', BATCH_STATUS.AVAILABLE),
      orderBy('harvestDate', 'asc')
    ) as Query<StockBatch>;

    return this.getByQuery(q);
  }

  /**
   * Busca lotes por status
   */
  getByStatus(userId: string, status: BATCH_STATUS): Observable<StockBatch[]> {
    const batchesRef = collection(this.firestore, this.collectionName) as CollectionReference<StockBatch>;
    const q = query(
      batchesRef,
      where('userId', '==', userId),
      where('status', '==', status),
      orderBy('updatedAt', 'desc')
    ) as Query<StockBatch>;

    return this.getByQuery(q);
  }

  /**
   * Busca um lote específico por número
   */
  getByBatchNumber(userId: string, batchNumber: string): Observable<StockBatch[]> {
    const batchesRef = collection(this.firestore, this.collectionName) as CollectionReference<StockBatch>;
    const q = query(
      batchesRef,
      where('userId', '==', userId),
      where('batchNumber', '==', batchNumber)
    ) as Query<StockBatch>;

    return this.getByQuery(q);
  }

  /**
   * Busca todos os lotes de um usuário
   */
  getAllByUser(userId: string): Observable<StockBatch[]> {
    const batchesRef = collection(this.firestore, this.collectionName) as CollectionReference<StockBatch>;
    const q = query(
      batchesRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ) as Query<StockBatch>;

    return this.getByQuery(q);
  }

  /**
   * Calcula quantidade total disponível por produto
   */
  getTotalAvailableQuantity(userId: string, productId: string): Observable<number> {
    return new Observable(observer => {
      this.getAvailableByProduct(userId, productId).subscribe(batches => {
        const total = batches.reduce((sum, batch) => sum + batch.currentQuantity, 0);
        observer.next(total);
        observer.complete();
      });
    });
  }
}
