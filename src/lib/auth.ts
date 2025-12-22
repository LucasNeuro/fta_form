// Sistema de autenticação próprio (sem Supabase Auth)
import { supabase } from './supabase'
import { UserWithRole } from './types'

// Armazenar usuário no localStorage
const USER_STORAGE_KEY = 'fta_user'

export const auth = {
  // Login usando função do banco
  async login(email: string, password: string): Promise<UserWithRole> {
    const { data, error } = await supabase.rpc('login_user', {
      p_email: email,
      p_password: password
    })

    if (error) {
      throw new Error(error.message || 'Email ou senha incorretos')
    }

    if (!data || data.length === 0) {
      throw new Error('Email ou senha incorretos')
    }

    const user = data[0] as UserWithRole
    
    // Salvar no localStorage
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    
    return user
  },

  // Logout
  async logout(): Promise<void> {
    localStorage.removeItem(USER_STORAGE_KEY)
  },

  // Obter usuário atual
  getCurrentUser(): UserWithRole | null {
    const userStr = localStorage.getItem(USER_STORAGE_KEY)
    if (!userStr) return null
    
    try {
      return JSON.parse(userStr) as UserWithRole
    } catch {
      return null
    }
  },

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  },

  // Verificar se é admin
  isAdmin(): boolean {
    const user = this.getCurrentUser()
    return user?.is_admin === true || user?.role === 'admin'
  }
}


