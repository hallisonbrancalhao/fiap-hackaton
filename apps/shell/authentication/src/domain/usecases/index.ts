export { executeLogin, type LoginUseCaseDependencies } from './LoginUseCase'
export {
  executeRegister,
  type RegisterUseCaseDependencies
} from './RegisterUseCase'
export { executeLogout, type LogoutUseCaseDependencies } from './LogoutUseCase'

export interface UseCaseDependencies {
  authRepository: import('../repositories/AuthRepository').AuthRepository
}
