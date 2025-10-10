import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductAnalytics } from '@fiap-hackaton/dashboard-domain';
import { ProductAnalyticsRepository } from '../infrastructure/product-analytics.repository';

@Injectable({
  providedIn: 'root',
})
export class ProductAnalyticsFacade {
  private repository = inject(ProductAnalyticsRepository);

  create(analytics: Omit<ProductAnalytics, 'id'>): Observable<string> {
    return this.repository.create(analytics);
  }

  update(id: string, analytics: Partial<ProductAnalytics>): Observable<void> {
    return this.repository.update(id, analytics);
  }

  delete(id: string): Observable<void> {
    return this.repository.delete(id);
  }

  getById(id: string): Observable<ProductAnalytics | null> {
    return this.repository.getById(id);
  }

  getByUserId(userId: string): Observable<ProductAnalytics[]> {
    return this.repository.getByUserId(userId);
  }

  getTopProfitableProducts(userId: string, limit?: number): Observable<ProductAnalytics[]> {
    return this.repository.getTopProfitableProducts(userId, limit);
  }

  getByProduct(userId: string, productId: string): Observable<ProductAnalytics[]> {
    return this.repository.getByProduct(userId, productId);
  }

  getTopRevenueProducts(userId: string, limit?: number): Observable<ProductAnalytics[]> {
    return this.repository.getTopRevenueProducts(userId, limit);
  }
}
