import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { Product, PRODUCT_CATEGORY } from '@fiap-hackaton/dashboard-domain';
import { Observable } from 'rxjs';
import { where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class ProductRepository extends BaseRepository<Product> {
  protected collectionName = 'products';

  getByCategory(farmId: string, category: PRODUCT_CATEGORY): Observable<Product[]> {
    return this.getAll([
      where('farmId', '==', farmId),
      where('category', '==', category)
    ]);
  }

  searchByName(farmId: string, name: string): Observable<Product[]> {
    return this.getAll([
      where('farmId', '==', farmId),
      where('name', '>=', name),
      where('name', '<=', name + '\uf8ff')
    ]);
  }
}
