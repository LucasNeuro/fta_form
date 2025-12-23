import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Anotacao } from '../../lib/types'
import { Button } from '../UI/Button'

interface ListaAnotacoesProps {
  tipo: 'equipe' | 'operador'
  equipeId?: string
  operadorId?: string
  operadorEquipeId?: string // Para copiar anotações do operador para a equipe
  onAnotacaoCriada?: () => void
}

export const ListaAnotacoes: React.FC<ListaAnotacoesProps> = ({
  tipo,
  equipeId,
  operadorId,
  operadorEquipeId,
  onAnotacaoCriada
}) => {
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [criando, setCriando] = useState(false)

  useEffect(() => {
    carregarAnotacoes()
  }, [tipo, equipeId, operadorId])

  const carregarAnotacoes = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('anotacoes')
        .select('*')
        .eq('tipo', tipo)
        .order('created_at', { ascending: false })

      if (tipo === 'equipe' && equipeId) {
        query = query.eq('equipe_id', equipeId)
      } else if (tipo === 'operador' && operadorId) {
        query = query.eq('operador_id', operadorId)
      }

      const { data, error } = await query

      if (error) throw error
      
      // Processar dados para incluir nome do criador
      if (data) {
        // Buscar todos os IDs de usuários únicos
        const userIds = [...new Set(data.map(anot => anot.criado_por))]
        
        // Buscar todos os usuários de uma vez
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds)
        
        // Criar mapa de usuários
        const usersMap = new Map(usersData?.map(u => [u.id, u.email]) || [])
        
        // Mapear anotações com email do criador
        const anotacoesComCriador = data.map(anot => ({
          ...anot,
          criado_por_nome: usersMap.get(anot.criado_por) || 'Desconhecido'
        }))
        
        setAnotacoes(anotacoesComCriador)
      }
    } catch (error: any) {
      console.error('Erro ao carregar anotações:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const criarAnotacao = async () => {
    if (!descricao.trim()) {
      alert('Por favor, preencha a descrição da anotação!')
      return
    }

    try {
      setCriando(true)
      
      // Buscar usuário atual
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        alert('Você precisa estar logado!')
        return
      }
      const user = JSON.parse(userStr)

      const anotacaoData: any = {
        tipo,
        descricao: descricao.trim(),
        criado_por: user.id,
        titulo: titulo.trim() || null
      }

      if (tipo === 'equipe' && equipeId) {
        anotacaoData.equipe_id = equipeId
      } else if (tipo === 'operador' && operadorId) {
        anotacaoData.operador_id = operadorId
      }

      const { error } = await supabase
        .from('anotacoes')
        .insert([anotacaoData])

      if (error) throw error

      // Se for anotação de operador e tiver equipe_id, criar também na equipe
      if (tipo === 'operador' && operadorEquipeId) {
        const anotacaoEquipeData = {
          tipo: 'equipe' as const,
          equipe_id: operadorEquipeId,
          descricao: `[Operador] ${titulo.trim() ? titulo.trim() + ': ' : ''}${descricao.trim()}`,
          criado_por: user.id,
          titulo: null
        }

        await supabase
          .from('anotacoes')
          .insert([anotacaoEquipeData])
      }

      // Limpar formulário
      setTitulo('')
      setDescricao('')
      setMostrarForm(false)
      
      // Recarregar anotações
      await carregarAnotacoes()
      
      if (onAnotacaoCriada) {
        onAnotacaoCriada()
      }
      
      alert('Anotação criada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao criar anotação:', error)
      alert('Erro ao criar anotação: ' + error.message)
    } finally {
      setCriando(false)
    }
  }

  const excluirAnotacao = async (anotacaoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('anotacoes')
        .delete()
        .eq('id', anotacaoId)

      if (error) throw error

      await carregarAnotacoes()
      alert('Anotação excluída com sucesso!')
    } catch (error: any) {
      console.error('Erro ao excluir anotação:', error)
      alert('Erro ao excluir anotação: ' + error.message)
    }
  }

  const formatarData = (data: string) => {
    if (!data) return '-'
    return new Date(data).toLocaleString('pt-BR')
  }

  if (loading) {
    return <div className="text-white/60 text-sm">Carregando anotações...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-fta-green">
          Anotações {tipo === 'equipe' ? 'da Equipe' : 'do Operador'}
        </h3>
        <Button onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? 'Cancelar' : '+ Nova Anotação'}
        </Button>
      </div>

      {mostrarForm && (
        <div className="bg-fta-dark p-4 rounded-lg border border-fta-green/30">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Título (opcional)
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Falta em jogo, Problema em campo, etc."
                className="w-full px-4 py-2 bg-fta-gray border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Descrição *
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva a observação..."
                rows={4}
                className="w-full px-4 py-2 bg-fta-gray border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green resize-none"
              />
            </div>
            {tipo === 'operador' && operadorEquipeId && (
              <div className="bg-blue-500/20 border border-blue-500/50 p-3 rounded-lg">
                <p className="text-blue-400 text-xs">
                  💡 Esta anotação será automaticamente copiada para a ficha da equipe.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <Button onClick={criarAnotacao} disabled={criando} className="flex-1">
                {criando ? 'Salvando...' : 'Salvar Anotação'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMostrarForm(false)
                  setTitulo('')
                  setDescricao('')
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {anotacoes.length === 0 ? (
        <p className="text-white/60 text-sm">Nenhuma anotação ainda.</p>
      ) : (
        <div className="space-y-3">
          {anotacoes.map((anotacao) => (
            <div
              key={anotacao.id}
              className="bg-fta-dark p-4 rounded-lg border border-white/10"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  {anotacao.titulo && (
                    <h4 className="font-semibold text-white mb-1">{anotacao.titulo}</h4>
                  )}
                  <p className="text-white/80 text-sm whitespace-pre-wrap">{anotacao.descricao}</p>
                </div>
                <button
                  onClick={() => excluirAnotacao(anotacao.id!)}
                  className="text-red-400 hover:text-red-300 ml-2 p-1"
                  title="Excluir anotação"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/60 mt-2">
                <span>Por: {anotacao.criado_por_nome || 'Desconhecido'}</span>
                <span>•</span>
                <span>{formatarData(anotacao.created_at || '')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

