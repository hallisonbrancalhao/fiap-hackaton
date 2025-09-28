import type { AuthRepository } from '../repositories/AuthRepository'
import type { AuthResult } from '../../shared/types/AuthTypes'

export interface LogoutUseCaseDependencies {
  authRepository: AuthRepository
}

export const executeLogout = async (
  dependencies: LogoutUseCaseDependencies
): Promise<AuthResult<void>> => {
  try {
    const result = await dependencies.authRepository.logout()
    return result
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao fazer logout'
    }
  }
}
