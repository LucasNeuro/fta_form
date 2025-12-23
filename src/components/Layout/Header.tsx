import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../UI/Button'
import { useAuth } from '../../hooks/useAuth'
import { MdLogout } from 'react-icons/md'

export const Header: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-20 z-50 bg-fta-dark border-b border-white/10 shadow-lg">
      <div className="h-full max-w-full mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-fta-green rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="text-2xl font-bold text-white">FTA Brasil</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-white/60 text-sm hidden md:block">{user.email}</span>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <MdLogout className="w-4 h-4" />
                <span>Sair</span>
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate('/login')}>
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
