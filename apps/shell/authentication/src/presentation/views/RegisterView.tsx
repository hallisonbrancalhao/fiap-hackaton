import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { RegisterCredentials } from '../../shared/types/AuthTypes'

interface RegisterViewProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onSuccess,
  onSwitchToLogin
}) => {
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    email: '',
    password: '',
    displayName: ''
  })

  const { register, isLoading, error, clearError, isAuthenticated } = useAuth()

  useEffect(() => {
    clearError()
  }, [clearError])

  useEffect(() => {
    if (isAuthenticated && onSuccess) {
      onSuccess()
    }
  }, [isAuthenticated, onSuccess])

  const handleInputChange =
    (field: keyof RegisterCredentials) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials((prev) => ({
          ...prev,
          [field]: event.target.value
        }))

        if (error) {
          clearError()
        }
      }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (
      !credentials.email ||
      !credentials.password ||
      !credentials.displayName
    ) {
      return
    }

    register(credentials)
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-surface py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-on-surface'>
            Crie sua conta
          </h2>
          <p className='mt-2 text-center text-sm text-on-surface-variant'>
            FIAP Farms - Cooperativa de Fazendas
          </p>
        </div>

        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          <div className='bg-surface-container rounded-lg p-6 border border-outline shadow-sm'>
            <div className='space-y-4'>
              <div>
                <label htmlFor='displayName' className='block text-sm font-medium text-on-surface mb-2'>
                  Nome completo
                </label>
                <input
                  id='displayName'
                  name='displayName'
                  type='text'
                  autoComplete='name'
                  required
                  className='w-full px-3 py-2 border border-outline rounded-lg bg-surface-container-lowest text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors'
                  placeholder='Digite seu nome completo'
                  value={credentials.displayName}
                  onChange={handleInputChange('displayName')}
                />
              </div>
              <div>
                <label htmlFor='email' className='block text-sm font-medium text-on-surface mb-2'>
                  Email
                </label>
                <input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  className='w-full px-3 py-2 border border-outline rounded-lg bg-surface-container-lowest text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors'
                  placeholder='Digite seu email'
                  value={credentials.email}
                  onChange={handleInputChange('email')}
                />
              </div>
              <div>
                <label htmlFor='password' className='block text-sm font-medium text-on-surface mb-2'>
                  Senha
                </label>
                <input
                  id='password'
                  name='password'
                  type='password'
                  autoComplete='new-password'
                  required
                  className='w-full px-3 py-2 border border-outline rounded-lg bg-surface-container-lowest text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors'
                  placeholder='Digite sua senha'
                  value={credentials.password}
                  onChange={handleInputChange('password')}
                />
              </div>
            </div>
          </div>

          {/* Dicas de senha forte */}
          <div className='bg-surface-container-high rounded-lg p-4 border border-outline-variant'>
            <p className='text-sm font-medium text-on-surface mb-2'>A senha deve conter:</p>
            <ul className='text-xs text-on-surface-variant space-y-1'>
              <li className='flex items-center gap-2'>
                <span className='w-1 h-1 bg-primary rounded-full'></span>
                Pelo menos 6 caracteres
              </li>
              <li className='flex items-center gap-2'>
                <span className='w-1 h-1 bg-primary rounded-full'></span>
                Uma letra maiúscula
              </li>
              <li className='flex items-center gap-2'>
                <span className='w-1 h-1 bg-primary rounded-full'></span>
                Uma letra minúscula
              </li>
              <li className='flex items-center gap-2'>
                <span className='w-1 h-1 bg-primary rounded-full'></span>
                Um número
              </li>
            </ul>
          </div>

          {error && (
            <div className='rounded-lg bg-error-container border border-error p-4'>
              <div className='text-sm text-error flex items-center gap-2'>
                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div className='space-y-4'>
            <button
              type='submit'
              disabled={isLoading}
              className='w-full bg-primary text-on-primary py-3 px-4 rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200'
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </button>

            <div className='text-center'>
              <button
                type='button'
                onClick={onSwitchToLogin}
                className='text-primary hover:text-primary-container text-sm font-medium transition-colors'
              >
                Já tem uma conta? Entre aqui
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
