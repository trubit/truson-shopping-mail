import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore.js'

const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ─── Token helpers ────────────────────────────────────────────────────────────

function isTokenExpired(token: string): boolean {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1])) as { exp: number }
    return exp * 1000 < Date.now() + 10_000  // treat as expired 10 s before actual expiry
  } catch {
    return true
  }
}

// Shared promise so concurrent requests don't all fire separate refreshes
let proactiveRefreshPromise: Promise<string | null> | null = null

function proactiveRefresh(): Promise<string | null> {
  if (!proactiveRefreshPromise) {
    proactiveRefreshPromise = axios
      .post<{ data: { accessToken: string } }>('/api/v1/auth/refresh', {}, { withCredentials: true })
      .then(({ data }) => {
        const token = data.data.accessToken
        localStorage.setItem('accessToken', token)
        return token
      })
      .catch(() => null)
      .finally(() => { proactiveRefreshPromise = null })
  }
  return proactiveRefreshPromise
}

// ─── Request interceptor — proactively refresh before sending expired token ──
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  let token = localStorage.getItem('accessToken')

  // If the stored token is expired (or about to expire), refresh it BEFORE
  // sending the request so we never hit the server with a bad token.
  if (token && isTokenExpired(token)) {
    const fresh = await proactiveRefresh()
    token = fresh  // null if refresh failed; the response interceptor will handle it
  }

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor — catch any unexpected 401s that slipped through ───
let isRefreshing = false
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token?: string) => {
  failedQueue.forEach(({ resolve, reject }) => (token ? resolve(token) : reject(error)))
  failedQueue = []
}

const forceLogout = () => {
  // Clear BOTH localStorage token AND Zustand persisted state so that the
  // /login GuestRoute doesn't immediately redirect back to / (redirect loop).
  localStorage.removeItem('accessToken')
  useAuthStore.getState().clearAuth()
  window.location.href = '/login'
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
        const newToken: string = data.data.accessToken
        localStorage.setItem('accessToken', newToken)
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        forceLogout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
