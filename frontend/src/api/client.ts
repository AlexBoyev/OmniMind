import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api/v1`,
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing: Promise<string> | null = null

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retried) {
      return Promise.reject(error)
    }

    original._retried = true

    try {
      if (!refreshing) {
        refreshing = apiClient
          .post<{ access_token: string }>('/auth/refresh')
          .then((r) => r.data.access_token)
          .finally(() => {
            refreshing = null
          })
      }

      const newToken = await refreshing
      useAuthStore.getState().setAuth(newToken, useAuthStore.getState().user!)
      original.headers.Authorization = `Bearer ${newToken}`
      return apiClient(original)
    } catch {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
      return Promise.reject(error)
    }
  },
)
