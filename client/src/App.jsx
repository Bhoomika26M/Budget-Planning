/**
 * BudgetBuddy React Application Router.
 * Configures routes, global authentication context, and route protection.
 */

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import {
  Welcome,
  RoleSelection,
  Register,
  Login,
  ForgotPassword,
  FirstTimeSetup,
  Dashboard,
  HealthCheck,
  Expenses,
  Income,
  Budget,
  Savings,
  Analytics,
  Reports,
  Notifications,
} from './pages'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Landing & Authentication Routes */}
          <Route path="/" element={<Welcome />} />
          <Route path="/roles" element={<RoleSelection />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/health" element={<HealthCheck />} />

          {/* Protected First-Time Setup Route */}
          <Route
            path="/setup"
            element={
              <ProtectedRoute requireSetup={false}>
                <FirstTimeSetup />
              </ProtectedRoute>
            }
          />

          {/* Protected Dashboard Route (Requires completed onboarding) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireSetup={true}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Expenses Route */}
          <Route
            path="/expenses"
            element={
              <ProtectedRoute requireSetup={true}>
                <Expenses />
              </ProtectedRoute>
            }
          />

          {/* Protected Income Route */}
          <Route
            path="/income"
            element={
              <ProtectedRoute requireSetup={true}>
                <Income />
              </ProtectedRoute>
            }
          />

          {/* Protected Budget Planning Route */}
          <Route
            path="/budget"
            element={
              <ProtectedRoute requireSetup={true}>
                <Budget />
              </ProtectedRoute>
            }
          />

          {/* Protected Notifications Route */}
          <Route
            path="/savings"
            element={
              <ProtectedRoute requireSetup={true}>
                <Savings />
              </ProtectedRoute>
            }
          />

          {/* Protected Analytics Route */}
          <Route
            path="/analytics"
            element={
              <ProtectedRoute requireSetup={true}>
                <Analytics />
              </ProtectedRoute>
            }
          />

          {/* Premium and Admin Reports Route */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute requireSetup={true} allowedRoles={['premium', 'admin']}>
                <Reports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute requireSetup={true}>
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
