import { Injectable } from '@angular/core';
import { BaseRepository } from '@fiap-hackaton/shared-data-access';
import { FarmUser } from '@fiap-hackaton/auth-domain';
import { Observable } from 'rxjs';
import { where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class FarmUserRepository extends BaseRepository<FarmUser> {
  protected collectionName = 'farmUsers';


  getByEmail(email: string): Observable<FarmUser[]> {
    return this.getAll([where('email', '==', email)]);
  }

  searchByFarmName(farmName: string): Observable<FarmUser[]> {
    return this.getAll([
      where('farmName', '>=', farmName),
      where('farmName', '<=', farmName + '\uf8ff')
    ]);
  }
}
