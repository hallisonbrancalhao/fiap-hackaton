import type { AuthRepository } from '../repositories/AuthRepository'
import type { LoginCredentials, AuthResult } from '../../shared/types/AuthTypes'
import type { User } from '../entities/User'

export interface LoginUseCaseDependencies {
  authRepository: AuthRepository
}

export const executeLogin = async (
  dependencies: LoginUseCaseDependencies,
  credentials: LoginCredentials
): Promise<AuthResult<User>> => {
  try {
    const validationResult = validateLoginCredentials(credentials)
    if (!validationResult.isValid) {
      return {
        success: false,
        error: validationResult.error || 'Credenciais inválidas'
      }
    }

    const result = await dependencies.authRepository.login(credentials)

    return result
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }
  }
}

const validateLoginCredentials = (
  credentials: LoginCredentials
): { isValid: boolean; error?: string } => {
  if (!credentials.email || !credentials.password) {
    return {
      isValid: false,
      error: 'Email e senha são obrigatórios'
    }
  }

  if (!isValidEmail(credentials.email)) {
    return {
      isValid: false,
      error: 'Email inválido'
    }
  }

  if (credentials.password.length < 6) {
    return {
      isValid: false,
      error: 'Senha deve ter pelo menos 6 caracteres'
    }
  }

  return { isValid: true }
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
