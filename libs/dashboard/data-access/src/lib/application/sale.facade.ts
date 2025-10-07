import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Sale, SALE_STATUS } from '@fiap-hackaton/dashboard-domain';
import { SaleRepository } from '../infrastructure/sale.repository';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class SaleFacade {
  private repository = inject(SaleRepository);

  create(sale: Omit<Sale, 'id'>): Observable<string> {
    return this.repository.create(sale);
  }

  update(id: string, sale: Partial<Sale>): Observable<void> {
    return this.repository.update(id, sale);
  }

  delete(id: string): Observable<void> {
    return this.repository.delete(id);
  }

  getById(id: string): Observable<Sale | null> {
    return this.repository.getById(id);
  }

  getByUserId(userId: string): Observable<Sale[]> {
    return this.repository.getByUserId(userId);
  }

  getByStatus(userId: string, status: SALE_STATUS): Observable<Sale[]> {
    return this.repository.getByStatus(userId, status);
  }

  getByDateRange(
    userId: string,
    startDate: Timestamp,
    endDate: Timestamp
  ): Observable<Sale[]> {
    return this.repository.getByDateRange(userId, startDate, endDate);
  }

  getRecentSales(userId: string, limit?: number): Observable<Sale[]> {
    return this.repository.getRecentSales(userId, limit);
  }

  updateStatus(id: string, status: SALE_STATUS): Observable<void> {
    return this.repository.update(id, { status });
  }
}
