import type { Role } from './auth.types'

export interface User {
  id: string
  email: string
  username: string
  role: Role
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export interface PaginatedUsers {
  items: User[]
  total: number
  page: number
  size: number
}
