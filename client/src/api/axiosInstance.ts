import axios, { type AxiosError } from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '',
  withCredentials: true,  // trimite HttpOnly cookie cu refresh token
})

// ===== Request interceptor — Bearer token + Correlation ID =====
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (!config.headers['X-Correlation-Id']) {
    config.headers['X-Correlation-Id'] = uuidv4()
  }
  return config
})

// ===== Response interceptor — refresh automat la 401 =====
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    const isAuthEndpoint = originalRequest?.url?.startsWith('/api/auth/');
    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Pune în coadă până se termină refresh-ul curent
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            originalRequest!.headers!['Authorization'] = `Bearer ${token}`
            resolve(api(originalRequest!))
          })
        })
      }

      originalRequest!._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(
          '/api/auth/refresh',
          {},
          { withCredentials: true }
        )

        // axios.post direct returnează AxiosResponse.data = ApiResponse<{ accessToken, user, permissions }>
        const loginData = data.data
        useAuthStore.getState().setAuth(loginData.user, loginData.accessToken, loginData.permissions ?? [])

        refreshQueue.forEach((cb) => cb(loginData.accessToken))
        refreshQueue = []

        originalRequest!.headers!['Authorization'] = `Bearer ${loginData.accessToken}`
        return api(originalRequest!)
      } catch {
        useAuthStore.getState().clearAuth()
        refreshQueue = []
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    // Parsare mesaj eroare din API response
    // Prioritate: mesaj backend > mesaj specific rețea > mesaj generic
    let apiError: string

    if (error.response?.data) {
      // Backend a răspuns cu un mesaj de eroare
      apiError =
        (error.response.data as { message?: string }).message ??
        'A apărut o eroare neașteptată.'
    } else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || !error.response) {
      // Eroare de rețea — serverul nu răspunde
      apiError = 'Nu se poate conecta la server. Verificați dacă backend-ul este pornit.'
    } else {
      apiError = 'A apărut o eroare neașteptată.'
    }

    return Promise.reject(new Error(apiError))
  }
)

export default api
