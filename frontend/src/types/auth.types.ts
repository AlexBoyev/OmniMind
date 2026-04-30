export type Role = 'admin' | 'user'

export interface LoginRequest {
  email_or_username: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}
