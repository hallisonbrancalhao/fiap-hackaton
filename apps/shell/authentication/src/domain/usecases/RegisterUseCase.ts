import type { AuthRepository } from '../repositories/AuthRepository'
import type {
  RegisterCredentials,
  AuthResult
} from '../../shared/types/AuthTypes'
import type { User } from '../entities/User'

export interface RegisterUseCaseDependencies {
  authRepository: AuthRepository
}

export const executeRegister = async (
  dependencies: RegisterUseCaseDependencies,
  credentials: RegisterCredentials
): Promise<AuthResult<User>> => {
  try {
    const validationResult = validateRegisterCredentials(credentials)
    if (!validationResult.isValid) {
      return {
        success: false,
        error: validationResult.error || 'Credenciais inválidas'
      }
    }

    const result = await dependencies.authRepository.register(credentials)

    return result
  } catch (error) {
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}

const validateRegisterCredentials = (
  credentials: RegisterCredentials
): { isValid: boolean; error?: string } => {
  if (!credentials.email || !credentials.password || !credentials.displayName) {
    return {
      isValid: false,
      error: 'Todos os campos são obrigatórios'
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

  if (credentials.displayName.trim().length < 2) {
    return {
      isValid: false,
      error: 'Nome deve ter pelo menos 2 caracteres'
    }
  }

  // Validação de senha forte
  if (!isStrongPassword(credentials.password)) {
    return {
      isValid: false,
      error:
        'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'
    }
  }

  return { isValid: true }
}

/**
 * Função para validar formato de email
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Função para validar força da senha
 */
const isStrongPassword = (password: string): boolean => {
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)

  return hasUpperCase && hasLowerCase && hasNumbers
}
