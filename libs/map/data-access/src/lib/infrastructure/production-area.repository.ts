import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseRepository } from '@fiap-hackaton/shared-data-access';
import { ProductionArea } from '@fiap-hackaton/domain';
import { where, QueryConstraint, orderBy } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ProductionAreaRepository extends BaseRepository<ProductionArea> {
  protected override collectionName = 'productionAreas';

  /**
   * Busca todas as áreas de produção ativas de um usuário
   */
  getActiveProductionAreasByUserId(userId: string): Observable<ProductionArea[]> {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    ];
    return super.getAll(constraints);
  }

  /**
   * Busca todas as áreas de produção de um usuário (ativas e inativas)
   */
  getAllProductionAreasByUserId(userId: string): Observable<ProductionArea[]> {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ];
    return super.getAll(constraints);
  }

  /**
   * Busca a área de produção vinculada a um plantio específico
   */
  getProductionAreaByProductionId(userId: string, productionId: string): Observable<ProductionArea | null> {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      where('properties.productionId', '==', productionId)
    ];
    return super.getAll(constraints).pipe(
      map(areas => areas.length > 0 ? areas[0] : null)
    );
  }

  /**
   * Busca áreas de produção de uma fazenda específica
   */
  getProductionAreasByFarmAreaId(userId: string, farmAreaId: string): Observable<ProductionArea[]> {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      where('farmAreaId', '==', farmAreaId),
      orderBy('createdAt', 'desc')
    ];
    return super.getAll(constraints);
  }

  /**
   * Cria uma nova área de produção
   */
  createProductionArea(productionArea: Omit<ProductionArea, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    return this.create(productionArea as Omit<ProductionArea, 'id'>);
  }

  /**
   * Atualiza uma área de produção
   */
  updateProductionArea(id: string, data: Partial<ProductionArea>): Observable<void> {
    return this.update(id, data);
  }

  /**
   * Desativa uma área de produção (soft delete)
   */
  deactivateProductionArea(id: string): Observable<void> {
    return this.update(id, { isActive: false });
  }

  /**
   * Deleta uma área de produção (hard delete)
   */
  deleteProductionArea(id: string): Observable<void> {
    return this.delete(id);
  }
}
