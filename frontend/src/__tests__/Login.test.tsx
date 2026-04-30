import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginPage } from '@/pages/auth/LoginPage'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(),
    logout: vi.fn(),
    isAdmin: vi.fn(() => false),
  }),
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    setAuth: vi.fn(),
    clearAuth: vi.fn(),
  }),
}))

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LoginPage', () => {
  it('renders the sign-in heading', () => {
    render(<LoginPage />, { wrapper: Wrapper })
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
  })

  it('renders email/username and password fields', () => {
    render(<LoginPage />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders sign-in submit button', () => {
    render(<LoginPage />, { wrapper: Wrapper })
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders link to register page', () => {
    render(<LoginPage />, { wrapper: Wrapper })
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument()
  })
})
