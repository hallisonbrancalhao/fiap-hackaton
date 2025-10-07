import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { ProductAnalytics } from '@fiap-hackaton/dashboard-domain';
import { Observable } from 'rxjs';
import { where, orderBy, limit } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class ProductAnalyticsRepository extends BaseRepository<ProductAnalytics> {
  protected collectionName = 'productAnalytics';

  getTopProfitableProducts(userId: string, limitCount = 10): Observable<ProductAnalytics[]> {
    return this.getAll([
      where('userId', '==', userId),
      orderBy('profit', 'desc'),
      limit(limitCount)
    ]);
  }

  getByProduct(userId: string, productId: string): Observable<ProductAnalytics[]> {
    return this.getAll([
      where('userId', '==', userId),
      where('productId', '==', productId),
      orderBy('period.endDate', 'desc')
    ]);
  }

  getTopRevenueProducts(userId: string, limitCount = 10): Observable<ProductAnalytics[]> {
    return this.getAll([
      where('userId', '==', userId),
      orderBy('totalRevenue', 'desc'),
      limit(limitCount)
    ]);
  }
}
