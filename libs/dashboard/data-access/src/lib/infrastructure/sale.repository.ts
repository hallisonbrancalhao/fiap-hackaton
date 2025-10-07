import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { Sale, SALE_STATUS } from '@fiap-hackaton/dashboard-domain';
import { Observable } from 'rxjs';
import { where, orderBy, limit, Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class SaleRepository extends BaseRepository<Sale> {
  protected collectionName = 'sales';

  getByStatus(userId: string, status: SALE_STATUS): Observable<Sale[]> {
    return this.getAll([
      where('userId', '==', userId),
      where('status', '==', status),
      orderBy('saleDate', 'desc')
    ]);
  }

  getByDateRange(
    userId: string,
    startDate: Timestamp,
    endDate: Timestamp
  ): Observable<Sale[]> {
    return this.getAll([
      where('userId', '==', userId),
      where('saleDate', '>=', startDate),
      where('saleDate', '<=', endDate),
      orderBy('saleDate', 'desc')
    ]);
  }

  getRecentSales(userId: string, limitCount = 10): Observable<Sale[]> {
    return this.getByUserId(userId, [
      orderBy('saleDate', 'desc'),
      limit(limitCount)
    ]);
  }
}
