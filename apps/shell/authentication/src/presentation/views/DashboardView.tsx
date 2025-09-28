import React from 'react'
import { useAuth } from '../hooks/useAuth'

export const DashboardView: React.FC = () => {
  const { user, logout, isLoading } = useAuth()

  const handleLogout = () => {
    logout()
  }

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-surface'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary'></div>
          <p className='mt-4 text-on-surface-variant'>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-surface'>
      <header className='bg-surface-container shadow-sm border-b border-outline'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-6'>
            <div>
              <h1 className='text-3xl font-bold text-on-surface'>FIAP Farms</h1>
              <p className='text-on-surface-variant'>Cooperativa de Fazendas</p>
            </div>
            <button
              onClick={handleLogout}
              className='bg-error hover:opacity-90 text-on-error px-4 py-2 rounded-lg text-sm font-medium transition-opacity'
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          <div className='bg-surface-container overflow-hidden shadow-sm rounded-lg border border-outline'>
            <div className='px-4 py-5 sm:p-6'>
              <h2 className='text-2xl font-bold text-on-surface mb-4'>
                Seja bem-vindo, {user?.displayName}!
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <div className='space-y-2'>
                    <p className='text-on-surface'>
                      <span className='font-medium text-on-surface'>Membro desde:</span>{' '}
                      <span className='text-on-surface-variant'>
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('pt-BR')
                          : 'N/A'}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-medium text-on-surface mb-2'>
                    Ações da aplicação
                  </h3>
                  <div className='space-y-2'>
                    <div className='bg-primary-container border border-primary rounded-lg p-3'>
                      <p className='text-sm text-on-primary-container'>
                        Explore os dashboards de vendas e produção para ter uma
                        visão estratégica.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='mt-8 grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='bg-surface-container overflow-hidden shadow-sm rounded-lg border border-outline'>
              <div className='px-4 py-5 sm:p-6'>
                <h3 className='text-lg font-medium text-on-surface mb-2'>
                  Dashboard de Vendas
                </h3>
                <p className='text-on-surface-variant text-sm mb-4'>
                  Visualize seus produtos por maior lucro e acompanhe o
                  desempenho.
                </p>
                <button className='bg-primary hover:opacity-90 text-on-primary px-4 py-2 rounded-lg text-sm font-medium transition-opacity'>
                  Acessar Dashboard
                </button>
              </div>
            </div>

            <div className='bg-surface-container overflow-hidden shadow-sm rounded-lg border border-outline'>
              <div className='px-4 py-5 sm:p-6'>
                <h3 className='text-lg font-medium text-on-surface mb-2'>
                  Dashboard de Produção
                </h3>
                <p className='text-on-surface-variant text-sm mb-4'>
                  Acompanhe o que está aguardando, em produção e já colhido.
                </p>
                <button className='bg-secondary hover:opacity-90 text-on-secondary px-4 py-2 rounded-lg text-sm font-medium transition-opacity'>
                  Acessar Dashboard
                </button>
              </div>
            </div>

            <div className='bg-surface-container overflow-hidden shadow-sm rounded-lg border border-outline'>
              <div className='px-4 py-5 sm:p-6'>
                <h3 className='text-lg font-medium text-on-surface mb-2'>
                  Controle de Estoque
                </h3>
                <p className='text-on-surface-variant text-sm mb-4'>
                  Gerencie seu estoque e vendas com dados em tempo real.
                </p>
                <button className='bg-tertiary hover:opacity-90 text-on-tertiary px-4 py-2 rounded-lg text-sm font-medium transition-opacity'>
                  Acessar Controle
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
