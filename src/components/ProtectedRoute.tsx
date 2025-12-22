import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireResponsavel?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireResponsavel = false 
}) => {
  const { user, loading, isAdmin, isResponsavelEquipe } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-fta-dark text-white flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  if (requireResponsavel && !isResponsavelEquipe) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
