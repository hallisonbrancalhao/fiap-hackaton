import {
  Firestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData,
  Timestamp,
  CollectionReference,
  DocumentReference,
  collectionData,
  docData,
  Query,
} from '@angular/fire/firestore';
import { Observable, from, map, defer, take } from 'rxjs';
import { inject, Injectable } from '@angular/core';

@Injectable()
export abstract class BaseRepository<T extends DocumentData> {
  protected readonly firestore = inject(Firestore);
  protected abstract collectionName: string;

  create(data: Omit<T, 'id'>): Observable<string> {
    return defer(() => {
      const timestamp = Timestamp.now();
      const docDataObj = {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      return from(addDoc(this.getCollectionRef(), docDataObj)).pipe(
        map((docRef) => docRef.id)
      );
    });
  }

  /**
   * Cria documento com ID customizado (útil para vincular com Firebase Auth UID)
   */
  createWithId(id: string, data: Omit<T, 'id'>): Observable<void> {
    return defer(() => {
      const timestamp = Timestamp.now();
      const docDataObj = {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const docRef = this.getDocRef(id);
      return from(setDoc(docRef, docDataObj));
    });
  }

  update(id: string, data: Partial<T>): Observable<void> {
    return defer(() => {
      const docRef = this.getDocRef(id);
      const updateData = {
        ...data,
        updatedAt: Timestamp.now(),
      };

      return from(updateDoc(docRef, updateData));
    });
  }

  delete(id: string): Observable<void> {
    return defer(() => {
      const docRef = this.getDocRef(id);
      return from(deleteDoc(docRef));
    });
  }

  getById(id: string): Observable<T | null> {
    return defer(() => {
      const docRef = this.getDocRef(id);
      return docData(docRef, { idField: 'id' }).pipe(
        take(1), // Completa após primeira emissão
        map(data => data ? data as T : null)
      );
    });
  }

  getAll(constraints: QueryConstraint[] = []): Observable<T[]> {
    return defer(() => {
      const collectionRef = this.getCollectionRef();
      const q = query(collectionRef, ...constraints);
      return (collectionData(q, { idField: 'id' }) as Observable<T[]>).pipe(
        take(1) // Completa após primeira emissão para funcionar com forkJoin
      );
    });
  }

  getByUserId(userId: string, constraints: QueryConstraint[] = []): Observable<T[]> {
    const allConstraints = [where('userId', '==', userId), ...constraints];
    return this.getAll(allConstraints);
  }

  list(
    options?: {
      limitCount?: number;
      orderByField?: string;
      orderDirection?: 'asc' | 'desc';
    }
  ): Observable<T[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || 'asc'));
    }

    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    return this.getAll(constraints);
  }

  /**
   * Executa uma query customizada no Firestore
   */
  protected getByQuery(q: Query<T>): Observable<T[]> {
    return defer(() => {
      return (collectionData(q, { idField: 'id' }) as Observable<T[]>).pipe(
        take(1)
      );
    });
  }

  protected getCollectionRef(): CollectionReference<DocumentData> {
    return collection(this.firestore, this.collectionName);
  }

  protected getDocRef(id: string): DocumentReference<DocumentData> {
    return doc(this.firestore, this.collectionName, id);
  }
}
