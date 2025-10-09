import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FarmUser } from '@fiap-hackaton/auth-domain';
import { FarmUserRepository } from '../infrastructure/farm-user.repository';

@Injectable({
  providedIn: 'root',
})
export class FarmUserFacade {
  private repository = inject(FarmUserRepository);

  create(farmUser: Omit<FarmUser, 'id'>): Observable<string> {
    return this.repository.create(farmUser);
  }

  update(id: string, farmUser: Partial<FarmUser>): Observable<void> {
    return this.repository.update(id, farmUser);
  }

  delete(id: string): Observable<void> {
    return this.repository.delete(id);
  }

  getById(id: string): Observable<FarmUser | null> {
    return this.repository.getById(id);
  }

  getAll(): Observable<FarmUser[]> {
    return this.repository.getAll();
  }

  getByEmail(email: string): Observable<FarmUser[]> {
    return this.repository.getByEmail(email);
  }

  searchByFarmName(farmName: string): Observable<FarmUser[]> {
    return this.repository.searchByFarmName(farmName);
  }
}
