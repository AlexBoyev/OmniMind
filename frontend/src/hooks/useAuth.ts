import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'

export function useAuth() {
  const navigate = useNavigate()
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore()

  const login = async (emailOrUsername: string, password: string) => {
    const { access_token, user: me } = await authApi.login(emailOrUsername, password)
    setAuth(access_token, me)
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      clearAuth()
      navigate('/login')
    }
  }

  const isAdmin = () => user?.role === 'admin'

  return { user, isAuthenticated, login, logout, isAdmin }
}
