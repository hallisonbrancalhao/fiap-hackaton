export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error'

export interface AuthState {
  readonly status: AuthStatus
  readonly user: User | null
  readonly error: string | null
  readonly isLoading: boolean
}

import type { User } from './User'

export const initialAuthState: AuthState = {
  status: 'idle',
  user: null,
  error: null,
  isLoading: false
}

export const createLoadingState = (): AuthState => ({
  ...initialAuthState,
  status: 'loading',
  isLoading: true
})

export const createAuthenticatedState = (user: User): AuthState => ({
  status: 'authenticated',
  user,
  error: null,
  isLoading: false
})

export const createUnauthenticatedState = (): AuthState => ({
  status: 'unauthenticated',
  user: null,
  error: null,
  isLoading: false
})

export const createErrorState = (error: string): AuthState => ({
  status: 'error',
  user: null,
  error,
  isLoading: false
})

export const isAuthenticated = (state: AuthState): boolean =>
  state.status === 'authenticated' && state.user !== null

export const isLoading = (state: AuthState): boolean =>
  state.isLoading || state.status === 'loading'

export const getErrorMessage = (state: AuthState): string | null => {
  if (!state.error) return null

  const errorMessages: Record<string, string> = {
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/email-already-in-use': 'Este email já está em uso',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres',
    'auth/invalid-email': 'Email inválido',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde'
  }

  return errorMessages[state.error] || 'Ocorreu um erro inesperado'
}
