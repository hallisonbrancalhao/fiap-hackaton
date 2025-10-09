import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseRepository } from '@fiap-hackaton/shared-data-access';
import { FarmArea } from '@fiap-hackaton/domain';
import { where, QueryConstraint } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class FarmAreaRepository extends BaseRepository<FarmArea> {
  protected override collectionName = 'farmAreas';

  /**
   * Busca a área de fazenda de um usuário específico
   * Um usuário deve ter apenas uma área de fazenda
   */
  getFarmAreaByUserId(userId: string): Observable<FarmArea | null> {
    const constraints: QueryConstraint[] = [where('userId', '==', userId)];
    return super.getAll(constraints).pipe(
      map(areas => areas.length > 0 ? areas[0] : null)
    );
  }

  /**
   * Cria uma nova área de fazenda
   */
  createFarmArea(farmArea: Omit<FarmArea, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    return this.create(farmArea as Omit<FarmArea, 'id'>);
  }

  /**
   * Atualiza a área de fazenda
   */
  updateFarmArea(id: string, data: Partial<FarmArea>): Observable<void> {
    return this.update(id, data);
  }

  /**
   * Deleta a área de fazenda
   */
  deleteFarmArea(id: string): Observable<void> {
    return this.delete(id);
  }
}
