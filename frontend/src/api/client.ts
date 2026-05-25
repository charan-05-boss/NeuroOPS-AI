/**
 * NeuroOps AI — Axios HTTP Client
 * Centralised instance with base URL, timeout, and request/response interceptors.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'
// Derive root URL by stripping '/api/v1' from the end of the base URL
const ROOT_URL = BASE_URL.replace(/\/api\/v1\/?$/, '')

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const rootApiClient = axios.create({
  baseURL: ROOT_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Interceptor Setup ────────────────────────────────────────────────────────
const requestInterceptor = (config: any) => config
const requestErrorInterceptor = (error: any) => Promise.reject(error)

const responseInterceptor = (response: any) => response
const responseErrorInterceptor = (error: any) => {
  const message =
    error.response?.data?.detail ?? error.message ?? 'An unexpected error occurred'
  return Promise.reject(new Error(message))
}

// Apply interceptors to both clients
apiClient.interceptors.request.use(requestInterceptor, requestErrorInterceptor)
apiClient.interceptors.response.use(responseInterceptor, responseErrorInterceptor)

rootApiClient.interceptors.request.use(requestInterceptor, requestErrorInterceptor)
rootApiClient.interceptors.response.use(responseInterceptor, responseErrorInterceptor)

export default apiClient
