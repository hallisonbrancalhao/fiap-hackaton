import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Product, PRODUCT_CATEGORY } from '@fiap-hackaton/dashboard-domain';
import { ProductRepository } from '../infrastructure/product.repository';

@Injectable({
  providedIn: 'root',
})
export class ProductFacade {
  private repository = inject(ProductRepository);

  create(product: Omit<Product, 'id'>): Observable<string> {
    return this.repository.create(product);
  }

  update(id: string, product: Partial<Product>): Observable<void> {
    return this.repository.update(id, product);
  }

  delete(id: string): Observable<void> {
    return this.repository.delete(id);
  }

  getById(id: string): Observable<Product | null> {
    return this.repository.getById(id);
  }

  getByUserId(userId: string): Observable<Product[]> {
    return this.repository.getByUserId(userId);
  }

  getByFarmId(farmId: string): Observable<Product[]> {
    return this.repository.getByFarmId(farmId);
  }

  getByCategory(farmId: string, category: PRODUCT_CATEGORY): Observable<Product[]> {
    return this.repository.getByCategory(farmId, category);
  }

  searchByName(farmId: string, name: string): Observable<Product[]> {
    return this.repository.searchByName(farmId, name);
  }
}
