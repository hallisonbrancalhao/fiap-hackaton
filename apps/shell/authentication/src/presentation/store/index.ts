/**
 * Configuração do Redux Store
 * 
 * Este arquivo configura o store principal do Redux,
 * combinando todos os reducers e configurando middleware.
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

/**
 * Configura o store do Redux
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignora ações do Firebase que podem conter funções
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

/**
 * Tipos TypeScript para o store
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
