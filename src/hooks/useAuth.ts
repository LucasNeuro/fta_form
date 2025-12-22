import { useState, useEffect } from 'react'
import { auth } from '../lib/auth'
import { UserWithRole, UserRole } from '../lib/types'

export const useAuth = () => {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carregar usuário do localStorage
    const currentUser = auth.getCurrentUser()
    setUser(currentUser)
    setLoading(false)

    // Listener para mudanças no localStorage (logout em outras abas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fta_user') {
        const newUser = auth.getCurrentUser()
        setUser(newUser)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = async (email: string, password: string) => {
    const loggedUser = await auth.login(email, password)
    setUser(loggedUser)
    return loggedUser
  }

  const logout = async () => {
    await auth.logout()
    setUser(null)
  }

  const role: UserRole = user?.role || 'user'
  const isAdmin = user?.is_admin === true || user?.role === 'admin'
  const isResponsavelEquipe = role === 'responsavel_equipe'
  const equipeId = user?.equipe_id || null

  return { 
    user, 
    loading, 
    role, 
    isAdmin, 
    isResponsavelEquipe, 
    equipeId,
    login,
    logout
  }
}
