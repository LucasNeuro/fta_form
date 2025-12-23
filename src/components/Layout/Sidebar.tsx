import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { 
  MdDashboard, 
  MdAdminPanelSettings, 
  MdPeople, 
  MdGroups, 
  MdAssessment 
} from 'react-icons/md'

export const Sidebar: React.FC = () => {
  const location = useLocation()
  const { isAdmin } = useAuth()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: MdDashboard },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: MdAdminPanelSettings }] : []),
    { path: '/operadores', label: 'Operadores', icon: MdPeople },
    { path: '/equipes', label: 'Equipes', icon: MdGroups },
    ...(isAdmin ? [{ path: '/relatorio-equipes', label: 'Relatório Equipes', icon: MdAssessment }] : []),
  ]

  return (
    <aside className="fixed left-0 top-[80px] bottom-0 w-64 bg-fta-dark border-r border-white/10 z-40 overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? 'bg-fta-green text-white'
                      : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

