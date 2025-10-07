import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Goal, GOAL_TYPE } from '@fiap-hackaton/dashboard-domain';
import { GoalRepository } from '../infrastructure/goal.repository';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class GoalFacade {
  private repository = inject(GoalRepository);

  create(goal: Omit<Goal, 'id'>): Observable<string> {
    return this.repository.create(goal);
  }

  update(id: string, goal: Partial<Goal>): Observable<void> {
    return this.repository.update(id, goal);
  }

  delete(id: string): Observable<void> {
    return this.repository.delete(id);
  }

  getById(id: string): Observable<Goal | null> {
    return this.repository.getById(id);
  }

  getByUserId(userId: string): Observable<Goal[]> {
    return this.repository.getByUserId(userId);
  }

  getByType(userId: string, type: GOAL_TYPE): Observable<Goal[]> {
    return this.repository.getByType(userId, type);
  }

  getActiveGoals(userId: string): Observable<Goal[]> {
    return this.repository.getActiveGoals(userId, Timestamp.now());
  }

  getCompletedGoals(userId: string): Observable<Goal[]> {
    return this.repository.getCompletedGoals(userId);
  }

  updateProgress(id: string, currentValue: number): Observable<void> {
    return this.repository.update(id, { currentValue });
  }

  completeGoal(id: string): Observable<void> {
    return this.repository.update(id, { isCompleted: true });
  }
}
