/**
 * Authentication Context for BudgetBuddy.
 * Manages JWT tokens, user identity, role permissions, and first-time setup state.
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('budgetbuddy_token'))
  const [loading, setLoading] = useState(true)

  // Verify and hydrate session on application mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('budgetbuddy_token')
      const storedUser = localStorage.getItem('budgetbuddy_user')

      if (storedToken) {
        try {
          if (storedUser) {
            setUser(JSON.parse(storedUser))
          }
          // Fetch fresh user record from backend
          const response = await api.get('/auth/me')
          setUser(response.data)
          localStorage.setItem('budgetbuddy_user', JSON.stringify(response.data))
        } catch (error) {
          console.warn('Session expired or invalid, logging out:', error)
          logout()
        }
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  // User Login
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { access_token, user: userData } = response.data

      localStorage.setItem('budgetbuddy_token', access_token)
      localStorage.setItem('budgetbuddy_user', JSON.stringify(userData))

      setToken(access_token)
      setUser(userData)
      return { success: true, data: response.data }
    } catch (error) {
      const message =
        error.response?.data?.detail || 'Login failed. Please check your credentials.'
      return { success: false, error: message }
    }
  }

  // User Registration
  const register = async ({ full_name, email, password, role }) => {
    try {
      const response = await api.post('/auth/register', {
        full_name,
        email,
        password,
        role,
      })
      const { access_token, user: userData } = response.data

      localStorage.setItem('budgetbuddy_token', access_token)
      localStorage.setItem('budgetbuddy_user', JSON.stringify(userData))

      setToken(access_token)
      setUser(userData)
      return { success: true, data: response.data }
    } catch (error) {
      const message =
        error.response?.data?.detail || 'Registration failed. Please check your inputs.'
      return { success: false, error: message }
    }
  }

  // Complete First-Time Setup
  const completeSetup = async (setupData) => {
    try {
      const response = await api.put('/profile/setup', setupData)
      // Update user state so is_setup_completed becomes true
      setUser((prev) => {
        const updated = {
          ...prev,
          is_setup_completed: true,
          full_name: setupData.full_name || prev?.full_name,
        }
        localStorage.setItem('budgetbuddy_user', JSON.stringify(updated))
        return updated
      })
      return { success: true, data: response.data }
    } catch (error) {
      const message =
        error.response?.data?.detail || 'Failed to complete setup. Please try again.'
      return { success: false, error: message }
    }
  }

  // Password Reset
  const forgotPassword = async (email, new_password) => {
    try {
      const response = await api.post('/auth/forgot-password', {
        email,
        new_password,
      })
      return { success: true, data: response.data }
    } catch (error) {
      const message =
        error.response?.data?.detail || 'Password reset failed. Please check the email entered.'
      return { success: false, error: message }
    }
  }

  // User Logout
  const logout = () => {
    localStorage.removeItem('budgetbuddy_token')
    localStorage.removeItem('budgetbuddy_user')
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isSetupCompleted: !!user?.is_setup_completed,
    role: user?.role || 'student',
    login,
    register,
    completeSetup,
    forgotPassword,
    logout,
    setUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
