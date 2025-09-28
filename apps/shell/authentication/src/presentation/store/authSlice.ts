/**
 * Redux Slice para autenticação
 * 
 * Este slice gerencia o estado de autenticação usando Redux Toolkit.
 * Ele conecta os casos de uso com a interface do usuário.
 */

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { type AuthState, initialAuthState, createLoadingState, createAuthenticatedState, createUnauthenticatedState, createErrorState } from '../../domain/entities/AuthState';
import { type User } from '../../domain/entities/User';
import { type LoginCredentials, type RegisterCredentials } from '../../shared/types/AuthTypes';
import { executeLogin, executeRegister, executeLogout } from '../../domain/usecases';
import { FirebaseAuthRepository } from '../../data/repositories/FirebaseAuthRepository';

/**
 * Cria a instância do repositório
 */
const authRepository = new FirebaseAuthRepository();

/**
 * Async thunk para login
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    const result = await executeLogin({ authRepository }, credentials);
    
    if (result.success) {
      return result.data;
    } else {
      return rejectWithValue(result.error);
    }
  }
);

/**
 * Async thunk para registro
 */
export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    const result = await executeRegister({ authRepository }, credentials);
    
    if (result.success) {
      return result.data;
    } else {
      return rejectWithValue(result.error);
    }
  }
);

/**
 * Async thunk para logout
 */
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    const result = await executeLogout({ authRepository });
    
    if (result.success) {
      return undefined;
    } else {
      return rejectWithValue(result.error);
    }
  }
);

/**
 * Slice do Redux para autenticação
 */
const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    /**
     * Define o usuário atual (usado quando a página carrega)
     */
    setUser: (_, action: PayloadAction<User | null>) => {
      if (action.payload) {
        return createAuthenticatedState(action.payload);
      } else {
        return createUnauthenticatedState();
      }
    },
    
    /**
     * Limpa o estado de erro
     */
    clearError: (state) => {
      if (state.status === 'error') {
        return {
          ...state,
          status: 'idle',
          error: null
        };
      }
    },
    
    /**
     * Define o estado de loading
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      return {
        ...state,
        isLoading: action.payload
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, () => createLoadingState())
      .addCase(loginUser.fulfilled, (_, action) => createAuthenticatedState(action.payload))
      .addCase(loginUser.rejected, (_, action) => createErrorState(action.payload as string))
      
      // Register
      .addCase(registerUser.pending, () => createLoadingState())
      .addCase(registerUser.fulfilled, (_, action) => createAuthenticatedState(action.payload))
      .addCase(registerUser.rejected, (_, action) => createErrorState(action.payload as string))
      
      // Logout
      .addCase(logoutUser.pending, () => createLoadingState())
      .addCase(logoutUser.fulfilled, () => createUnauthenticatedState())
      .addCase(logoutUser.rejected, (_, action) => createErrorState(action.payload as string));
  }
});

/**
 * Exporta as ações
 */
export const { setUser, clearError, setLoading } = authSlice.actions;

/**
 * Exporta o reducer
 */
export default authSlice.reducer;

/**
 * Selectors para acessar o estado
 */
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => 
  state.auth.status === 'authenticated' && state.auth.user !== null;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectError = (state: { auth: AuthState }) => state.auth.error;
