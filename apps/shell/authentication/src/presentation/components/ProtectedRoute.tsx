import React from 'react'
import { useAuth } from '../hooks/useAuth'

/**
 * Props do componente ProtectedRoute
 */
interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback
}) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600'></div>
          <p className='mt-4 text-gray-600'>Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      fallback || (
        <div className='min-h-screen flex items-center justify-center bg-gray-50'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              Acesso Negado
            </h2>
            <p className='text-gray-600 mb-4'>
              Você precisa estar logado para acessar esta página.
            </p>
            <button
              onClick={() => (window.location.href = '/login')}
              className='bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md'
            >
              Ir para Login
            </button>
          </div>
        </div>
      )
    )
  }

  // Se estiver autenticado, renderiza os children
  return <>{children}</>
}
