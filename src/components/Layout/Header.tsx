import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../UI/Button'
import { useAuth } from '../../hooks/useAuth'

export const Header: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAdmin, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <header className="bg-fta-dark border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-fta-green rounded flex items-center justify-center">
              <span className="text-white font-bold">F</span>
            </div>
            <span className="text-2xl font-bold text-white">FTA Brasil</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-white/60 text-sm">{user.email}</span>
                <Button variant="outline" onClick={handleLogout}>
                  Sair
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/login')}>
                Entrar
              </Button>
            )}
          </div>
        </div>

        {user && (
          <nav className="flex items-center gap-1 border-t border-white/10 pt-4">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-fta-green text-white'
                  : 'text-white/80 hover:text-fta-green'
              }`}
            >
              Dashboard
            </Link>
            
            {isAdmin && (
              <Link
                to="/admin"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin')
                    ? 'bg-fta-green text-white'
                    : 'text-white/80 hover:text-fta-green'
                }`}
              >
                Admin
              </Link>
            )}

            <Link
              to="/operadores"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/operadores')
                  ? 'bg-fta-green text-white'
                  : 'text-white/80 hover:text-fta-green'
              }`}
            >
              Operadores
            </Link>

            <Link
              to="/equipes"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/equipes')
                  ? 'bg-fta-green text-white'
                  : 'text-white/80 hover:text-fta-green'
              }`}
            >
              Equipes
            </Link>

            {isAdmin && (
              <Link
                to="/relatorio-equipes"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/relatorio-equipes')
                    ? 'bg-fta-green text-white'
                    : 'text-white/80 hover:text-fta-green'
                }`}
              >
                Relatório Equipes
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
