import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Production, PRODUCTION_STATUS } from '@fiap-hackaton/dashboard-domain';
import { ProductionRepository } from '../infrastructure/production.repository';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class ProductionFacade {
  private repository = inject(ProductionRepository);

  create(production: Omit<Production, 'id'>): Observable<string> {
    return this.repository.create(production);
  }

  update(id: string, production: Partial<Production>): Observable<void> {
    return this.repository.update(id, production);
  }

  delete(id: string): Observable<void> {
    return this.repository.delete(id);
  }

  getById(id: string): Observable<Production | null> {
    return this.repository.getById(id);
  }

  getByUserId(userId: string): Observable<Production[]> {
    return this.repository.getByUserId(userId);
  }

  getByStatus(userId: string, status: PRODUCTION_STATUS): Observable<Production[]> {
    return this.repository.getByStatus(userId, status);
  }

  getByProduct(userId: string, productId: string): Observable<Production[]> {
    return this.repository.getByProduct(userId, productId);
  }

  getUpcomingHarvests(userId: string, beforeDate: Timestamp): Observable<Production[]> {
    return this.repository.getUpcomingHarvests(userId, beforeDate);
  }

  updateStatus(id: string, status: PRODUCTION_STATUS): Observable<void> {
    return this.repository.update(id, { status });
  }

  completeHarvest(id: string): Observable<void> {
    return this.repository.update(id, {
      status: PRODUCTION_STATUS.HARVESTED,
      actualHarvestDate: Timestamp.now(),
    });
  }
}
