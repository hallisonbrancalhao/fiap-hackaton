import { Timestamp } from '@angular/fire/firestore';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface FarmUser {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  farmName: string;
  location: Location;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
