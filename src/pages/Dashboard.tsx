import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { Button } from '../components/UI/Button'

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalEquipes: 0,
    totalOperadores: 0,
    operadoresAtivos: 0,
    equipesAtivas: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarEstatisticas()
  }, [])

  const carregarEstatisticas = async () => {
    try {
      setLoading(true)

      // Contar equipes
      const { count: countEquipes } = await supabase
        .from('equipes')
        .select('*', { count: 'exact', head: true })

      // Contar operadores
      const { count: countOperadores } = await supabase
        .from('operadores')
        .select('*', { count: 'exact', head: true })

      // Contar operadores ativos (com equipe)
      const { count: countOperadoresAtivos } = await supabase
        .from('operadores')
        .select('*', { count: 'exact', head: true })
        .not('equipe_id', 'is', null)

      // Contar equipes ativas (com pelo menos 1 membro ativo)
      const { count: countEquipesAtivas } = await supabase
        .from('equipes')
        .select('*', { count: 'exact', head: true })
        .gt('ativos', 0)

      setStats({
        totalEquipes: countEquipes || 0,
        totalOperadores: countOperadores || 0,
        operadoresAtivos: countOperadoresAtivos || 0,
        equipesAtivas: countEquipesAtivas || 0
      })
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fta-dark text-white p-8 flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="bg-fta-dark text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">FTA Brasil</h1>
          <p className="text-white/60 text-lg">Sistema de Cadastro de Operadores e Equipes</p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10">
            <div className="text-white/60 text-sm mb-2">Total de Equipes</div>
            <div className="text-3xl font-bold text-fta-green">{stats.totalEquipes}</div>
          </div>
          
          <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10">
            <div className="text-white/60 text-sm mb-2">Total de Operadores</div>
            <div className="text-3xl font-bold text-fta-green">{stats.totalOperadores}</div>
          </div>
          
          <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10">
            <div className="text-white/60 text-sm mb-2">Equipes Ativas</div>
            <div className="text-3xl font-bold text-fta-green">{stats.equipesAtivas}</div>
          </div>
          
          <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10">
            <div className="text-white/60 text-sm mb-2">Operadores com Equipe</div>
            <div className="text-3xl font-bold text-fta-green">{stats.operadoresAtivos}</div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-4 text-fta-green">Navegação</h2>
            <div className="space-y-3">
              <Link to="/operadores">
                <Button variant="outline" className="w-full justify-center">
                  Ver Operadores
                </Button>
              </Link>
              <Link to="/equipes">
                <Button variant="outline" className="w-full justify-center">
                  Ver Equipes
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-4 text-fta-green">Informações do Sistema</h2>
            <p className="text-white/80 leading-relaxed text-sm">
              Sistema desenvolvido para cadastrar e gerenciar operadores e equipes da FTA Brasil.
              Utilize o menu de navegação para acessar as funcionalidades.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

