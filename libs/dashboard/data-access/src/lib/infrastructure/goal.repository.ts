import { Injectable } from '@angular/core';
import { BaseRepository } from '@fiap-hackaton/shared-data-access';
import { Goal, GOAL_TYPE } from '@fiap-hackaton/dashboard-domain';
import { Observable } from 'rxjs';
import { where, orderBy, Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class GoalRepository extends BaseRepository<Goal> {
  protected collectionName = 'goals';



  getByType(userId: string, type: GOAL_TYPE): Observable<Goal[]> {
    return this.getAll([
      where('userId', '==', userId),
      where('type', '==', type),
      orderBy('endDate', 'desc')
    ]);
  }

  getActiveGoals(userId: string, currentDate: Timestamp): Observable<Goal[]> {
    return this.getAll([
      where('userId', '==', userId),
      where('isCompleted', '==', false),
      where('endDate', '>=', currentDate),
      orderBy('endDate', 'asc')
    ]);
  }

  getCompletedGoals(userId: string): Observable<Goal[]> {
    return this.getAll([
      where('userId', '==', userId),
      where('isCompleted', '==', true),
      orderBy('endDate', 'desc')
    ]);
  }
}
