import { inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData,
  Timestamp,
  CollectionReference,
  DocumentReference,
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';

export abstract class BaseRepository<T extends DocumentData> {
  protected firestore = inject(Firestore);
  protected abstract collectionName: string;

  create(data: Omit<T, 'id'>): Observable<string> {
    const timestamp = Timestamp.now();
    const docData = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return from(addDoc(this.getCollectionRef(), docData)).pipe(
      map((docRef) => docRef.id)
    );
  }

  update(id: string, data: Partial<T>): Observable<void> {
    const docRef = this.getDocRef(id);
    const updateData = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    return from(updateDoc(docRef, updateData));
  }

  delete(id: string): Observable<void> {
    const docRef = this.getDocRef(id);
    return from(deleteDoc(docRef));
  }

  getById(id: string): Observable<T | null> {
    const docRef = this.getDocRef(id);
    return from(getDoc(docRef)).pipe(
      map((docSnap) => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as unknown as T;
        }
        return null;
      })
    );
  }

  getAll(constraints: QueryConstraint[] = []): Observable<T[]> {
    const collectionRef = this.getCollectionRef();
    const q = query(collectionRef, ...constraints);

    return from(getDocs(q)).pipe(map((querySnapshot) => querySnapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as unknown as T))));
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

  protected getCollectionRef(): CollectionReference<DocumentData> {
    return collection(this.firestore, this.collectionName);
  }

  protected getDocRef(id: string): DocumentReference<DocumentData> {
    return doc(this.firestore, this.collectionName, id);
  }
}
