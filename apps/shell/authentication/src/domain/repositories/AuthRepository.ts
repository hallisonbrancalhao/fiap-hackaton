import type { User } from '../entities/User'
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResult,
  AuthStateChangeCallback
} from '../../shared/types/AuthTypes'

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthResult<User>>

  register(credentials: RegisterCredentials): Promise<AuthResult<User>>

  logout(): Promise<AuthResult<void>>

  getCurrentUser(): Promise<User | null>

  sendEmailVerification(): Promise<AuthResult<void>>

  resetPassword(email: string): Promise<AuthResult<void>>

  updateProfile(
    updates: Partial<Pick<User, 'displayName'>>
  ): Promise<AuthResult<User>>

  onAuthStateChange(callback: AuthStateChangeCallback): () => void
}
