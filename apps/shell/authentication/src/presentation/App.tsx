/**
 * Componente principal da aplicação
 * 
 * Este componente configura o roteamento e integra todas as camadas
 * da Clean Architecture com o Redux e React Router.
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAuth } from './hooks/useAuth';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { DashboardView } from './views/DashboardView';
import { ProtectedRoute } from './components/ProtectedRoute';

/**
 * Componente interno que usa hooks (deve estar dentro do Provider)
 */
const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializa o estado de autenticação quando o app carrega
  useEffect(() => {
    // Aqui você pode adicionar lógica para verificar se há um usuário logado
    // Por exemplo, verificar localStorage ou fazer uma chamada para a API
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-on-surface-variant">Inicializando aplicação...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginView
                onSuccess={() => window.location.href = '/dashboard'}
                onSwitchToRegister={() => window.location.href = '/register'}
              />
            )
          }
        />

        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <RegisterView
                onSuccess={() => window.location.href = '/dashboard'}
                onSwitchToLogin={() => window.location.href = '/login'}
              />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-surface">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-on-surface mb-4">404</h1>
                <p className="text-on-surface-variant mb-4">Página não encontrada</p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-primary hover:opacity-90 text-on-primary px-4 py-2 rounded-lg font-medium transition-opacity"
                >
                  Voltar ao início
                </button>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <div className="App">
        <AppRoutes />
      </div>
    </Provider>
  );
};

export default App;
