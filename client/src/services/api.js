/**
 * Centralized Axios API Client.
 * Automatically injects the JWT Bearer token into outgoing requests
 * and handles authorization errors.
 */

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Attach JWT token if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('budgetbuddy_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Catch 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if session expires
      localStorage.removeItem('budgetbuddy_token')
      localStorage.removeItem('budgetbuddy_user')
    }
    return Promise.reject(error)
  }
)

export default api

