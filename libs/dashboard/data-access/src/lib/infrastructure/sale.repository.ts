import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { Sale, SALE_STATUS } from '@fiap-hackaton/dashboard-domain';
import { Observable } from 'rxjs';
import { where, limit, Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class SaleRepository extends BaseRepository<Sale> {
  protected collectionName = 'sales';

  getByStatus(farmId: string, status: SALE_STATUS): Observable<Sale[]> {
    return this.getAll([
      where('farmId', '==', farmId),
      where('status', '==', status)
    ]);
  }

  getByDateRange(
    farmId: string,
    startDate: Timestamp,
    endDate: Timestamp
  ): Observable<Sale[]> {
    return this.getAll([
      where('farmId', '==', farmId),
      where('saleDate', '>=', startDate),
      where('saleDate', '<=', endDate)
    ]);
  }

  getRecentSales(farmId: string, limitCount = 10): Observable<Sale[]> {
    return this.getByFarmId(farmId, [
      limit(limitCount)
    ]);
  }
}
