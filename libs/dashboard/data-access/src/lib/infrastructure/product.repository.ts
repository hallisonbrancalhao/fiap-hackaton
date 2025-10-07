import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { Product, PRODUCT_CATEGORY } from '@fiap-hackaton/dashboard-domain';
import { Observable } from 'rxjs';
import { where, orderBy } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class ProductRepository extends BaseRepository<Product> {
  protected collectionName = 'products';

  getByCategory(userId: string, category: PRODUCT_CATEGORY): Observable<Product[]> {
    return this.getAll([
      where('userId', '==', userId),
      where('category', '==', category),
      orderBy('name', 'asc')
    ]);
  }

  searchByName(userId: string, name: string): Observable<Product[]> {
    return this.getAll([
      where('userId', '==', userId),
      where('name', '>=', name),
      where('name', '<=', name + '\uf8ff')
    ]);
  }
}
