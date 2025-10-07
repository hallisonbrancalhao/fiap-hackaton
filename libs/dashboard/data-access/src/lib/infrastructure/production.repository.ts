import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { Production, PRODUCTION_STATUS } from '@fiap-hackaton/dashboard-domain';
import { Observable } from 'rxjs';
import { where, orderBy, Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class ProductionRepository extends BaseRepository<Production> {
  protected collectionName = 'productions';

  getByStatus(userId: string, status: PRODUCTION_STATUS): Observable<Production[]> {
    return this.getAll([
      where('userId', '==', userId),
      where('status', '==', status),
      orderBy('plantingDate', 'desc')
    ]);
  }

  getByProduct(userId: string, productId: string): Observable<Production[]> {
    return this.getAll([
      where('userId', '==', userId),
      where('productId', '==', productId),
      orderBy('plantingDate', 'desc')
    ]);
  }

  getUpcomingHarvests(userId: string, beforeDate: Timestamp): Observable<Production[]> {
    return this.getAll([
      where('userId', '==', userId),
      where('status', '==', PRODUCTION_STATUS.IN_PRODUCTION),
      where('expectedHarvestDate', '<=', beforeDate),
      orderBy('expectedHarvestDate', 'asc')
    ]);
  }
}
