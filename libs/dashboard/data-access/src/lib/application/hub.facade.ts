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

  /**
   * Obtém estatísticas do dashboard.
   *
   * NOTA: Usa filtragem no cliente para evitar necessidade de índice composto do Firestore.
   * Para melhor performance em produção, crie o índice conforme documentado em FIRESTORE_INDEXES.md
   */
  getDashboardStats(userId: string): Observable<DashboardStats> {
    const startOfMonth = this.getStartOfMonth();
    const endOfMonth = this.getEndOfMonth();

    return combineLatest([
      this.productFacade.getByUserId(userId),
      this.saleFacade.getByUserId(userId),
    ]).pipe(
      map(([products, allSales]) => {
        // Filtrar vendas do mês atual no cliente
        const monthlySales = allSales.filter(sale => {
          if (!sale.saleDate) return false;
          const saleTimestamp = sale.saleDate as Timestamp;
          const saleMillis = saleTimestamp.toMillis();
          return saleMillis >= startOfMonth.toMillis() &&
                 saleMillis <= endOfMonth.toMillis();
        });

        const monthlyRevenue = monthlySales.reduce(
          (sum, sale) => sum + (sale.totalAmount || 0),
          0
        );

        const stats = {
          totalProducts: products.length,
          totalSales: allSales.length,
          monthlyRevenue,
          recentSalesCount: monthlySales.length,
        };
        return stats;
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
