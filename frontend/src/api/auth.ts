import { apiClient } from './client'
import type { LoginRequest, RegisterRequest } from '@/types/auth.types'
import type { User } from '@/types/user.types'

interface LoginResult {
  access_token: string
  user: User
}

export const authApi = {
  login: async (emailOrUsername: string, password: string): Promise<LoginResult> => {
    const { data } = await apiClient.post<{ access_token: string }>('/auth/login', {
      email_or_username: emailOrUsername,
      password,
    } satisfies LoginRequest)

    const { data: user } = await apiClient.get<User>('/auth/me', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })

    return { access_token: data.access_token, user }
  },

  register: async (email: string, username: string, password: string): Promise<User> => {
    const { data } = await apiClient.post<User>('/auth/register', {
      email,
      username,
      password,
    } satisfies RegisterRequest)
    return data
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me')
    return data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  refresh: async (): Promise<{ access_token: string }> => {
    const { data } = await apiClient.post<{ access_token: string }>('/auth/refresh')
    return data
  },
}
