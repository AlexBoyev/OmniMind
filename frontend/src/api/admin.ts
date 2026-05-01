import { apiClient } from './client'
import type { User, PaginatedUsers } from '@/types/user.types'

export interface AuditLogEntry {
  id: string
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  ip_address: string
  user_agent: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface PaginatedAuditLog {
  logs: AuditLogEntry[]
  total: number
  page: number
  size: number
}

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

  getAuditLog: async (params: {
    page?: number
    size?: number
    user_id?: string
    action?: string
  } = {}): Promise<PaginatedAuditLog> => {
    const { data } = await apiClient.get<PaginatedAuditLog>('/admin/audit-log', { params })
    return data
  },
}
