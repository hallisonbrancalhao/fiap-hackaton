import { useDispatch, useSelector } from 'react-redux'
import { useCallback } from 'react'
import { type AppDispatch } from '../store'
import {
  loginUser,
  registerUser,
  logoutUser,
  setUser,
  clearError,
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectError
} from '../store/authSlice'
import type {
  LoginCredentials,
  RegisterCredentials
} from '../../shared/types/AuthTypes'

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>()

  const auth = useSelector(selectAuth)
  const user = useSelector(selectUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isLoading = useSelector(selectIsLoading)
  const error = useSelector(selectError)

  const login = useCallback(
    (credentials: LoginCredentials) => {
      dispatch(loginUser(credentials))
    },
    [dispatch]
  )

  const register = useCallback(
    (credentials: RegisterCredentials) => {
      dispatch(registerUser(credentials))
    },
    [dispatch]
  )

  const logout = useCallback(() => {
    dispatch(logoutUser())
  }, [dispatch])

  const setCurrentUser = useCallback(
    (user: any) => {
      dispatch(setUser(user))
    },
    [dispatch]
  )

  const clearAuthError = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])

  return {
    auth,
    user,
    isAuthenticated,
    isLoading,
    error,

    login,
    register,
    logout,
    setCurrentUser,
    clearError: clearAuthError
  }
}
