import { apiClient } from './client'
import type { User, PaginatedUsers } from '@/types/user.types'

export const adminApi = {
  listUsers: async (page = 1, size = 20): Promise<PaginatedUsers> => {
    const { data } = await apiClient.get<PaginatedUsers>('/admin/users', {
      params: { page, size },
    })
    return data
  },

  getUser: async (id: string): Promise<User> => {
    const { data } = await apiClient.get<User>(`/admin/users/${id}`)
    return data
  },

  updateUser: async (id: string, updates: Partial<Pick<User, 'is_active' | 'role'>>): Promise<User> => {
    const { data } = await apiClient.patch<User>(`/admin/users/${id}`, updates)
    return data
  },
}
