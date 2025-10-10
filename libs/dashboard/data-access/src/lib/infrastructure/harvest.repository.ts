import { Injectable } from '@angular/core';
import { BaseRepository } from '@fiap-hackaton/shared-data-access';
import { Harvest, HARVEST_QUALITY } from '@fiap-hackaton/dashboard-domain';
import { Observable } from 'rxjs';
import { where, orderBy, Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class HarvestRepository extends BaseRepository<Harvest> {
  protected collectionName = 'harvests';

  getByProduction(productionId: string): Observable<Harvest[]> {
    return this.getAll([
      where('productionId', '==', productionId),
      orderBy('harvestDate', 'desc')
    ]);
  }

  getByProduct(userId: string, productId: string): Observable<Harvest[]> {
    return this.getAll([
      where('userId', '==', userId),
      where('productId', '==', productId),
      orderBy('harvestDate', 'desc')
    ]);
  }

  getByQuality(userId: string, quality: HARVEST_QUALITY): Observable<Harvest[]> {
    return this.getAll([
      where('userId', '==', userId),
      where('quality', '==', quality),
      orderBy('harvestDate', 'desc')
    ]);
  }

  getByDateRange(
    userId: string,
    startDate: Timestamp,
    endDate: Timestamp
  ): Observable<Harvest[]> {
    return this.getAll([
      where('userId', '==', userId),
      where('harvestDate', '>=', startDate),
      where('harvestDate', '<=', endDate),
      orderBy('harvestDate', 'desc')
    ]);
  }

  getRecentHarvests(userId: string, _limitCount = 10): Observable<Harvest[]> {
    return this.getByUserId(userId, [
      orderBy('harvestDate', 'desc')
    ]);
  }
}
