import type { User } from '../../domain/entities/User';

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

export interface RegisterCredentials {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
}

export type AuthResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string };

export type AuthStateChangeCallback = (user: User | null) => void;

