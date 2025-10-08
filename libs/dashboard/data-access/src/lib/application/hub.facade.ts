import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { ProductFacade } from './product.facade';
import { SaleFacade } from './sale.facade';
import { Timestamp } from '@angular/fire/firestore';

export interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  monthlyRevenue: number;
  recentSalesCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class HubFacade {
  private productFacade = inject(ProductFacade);
  private saleFacade = inject(SaleFacade);

  getDashboardStats(farmId: string): Observable<DashboardStats> {
    const startOfMonth = this.getStartOfMonth();
    const endOfMonth = this.getEndOfMonth();

    return combineLatest([
      this.productFacade.getByFarmId(farmId),
      this.saleFacade.getByFarmId(farmId),
      this.saleFacade.getByDateRange(farmId, startOfMonth, endOfMonth),
    ]).pipe(
      map(([products, allSales]) => {
        const monthlySales = allSales.filter(sale => {
          if (!sale.saleDate) return false;
          const saleTimestamp = sale.saleDate as Timestamp;
          return saleTimestamp.toMillis() >= startOfMonth.toMillis() &&
                 saleTimestamp.toMillis() <= endOfMonth.toMillis();
        });

        const monthlyRevenue = monthlySales.reduce(
          (sum, sale) => sum + (sale.totalAmount || 0),
          0
        );

        return {
          totalProducts: products.length,
          totalSales: allSales.length,
          monthlyRevenue,
          recentSalesCount: monthlySales.length,
        };
      })
    );
  }

  private getStartOfMonth(): Timestamp {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return Timestamp.fromDate(startOfMonth);
  }

  private getEndOfMonth(): Timestamp {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return Timestamp.fromDate(endOfMonth);
  }
}
