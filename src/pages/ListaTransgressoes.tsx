import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Anotacao, Equipe } from '../lib/types'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/UI/Table'
import { Button } from '../components/UI/Button'
import { MdFilterList, MdDelete } from 'react-icons/md'
import { useAuth } from '../hooks/useAuth'

export const ListaTransgressoes: React.FC = () => {
  const { isAdmin } = useAuth()
  const [transgressoes, setTransgressoes] = useState<Anotacao[]>([])
  const [transgressoesFiltradas, setTransgressoesFiltradas] = useState<Anotacao[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [operadores, setOperadores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [filtroEquipe, setFiltroEquipe] = useState<string>('')
  const [filtroOperador, setFiltroOperador] = useState<string>('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'equipe' | 'operador'>('todos')
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('')
  const [filtroDataFim, setFiltroDataFim] = useState<string>('')

  useEffect(() => {
    carregarTransgressoes()
    carregarEquipes()
    carregarOperadores()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [transgressoes, filtroEquipe, filtroOperador, filtroTipo, filtroDataInicio, filtroDataFim])

  const carregarTransgressoes = async () => {
    try {
      setLoading(true)
      
      // Buscar todas as transgressões
      const { data, error } = await supabase
        .from('anotacoes')
        .select('*')
        .eq('e_transgressao', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        // Buscar dados relacionados (usuários, tipos, equipes, operadores)
        const userIds = [...new Set(data.map(t => t.criado_por))]
        const tipoTransgressaoIds = [...new Set(data.filter(t => t.tipo_transgressao_id).map(t => t.tipo_transgressao_id!))]
        const equipeIds = [...new Set(data.filter(t => t.equipe_id).map(t => t.equipe_id!))]
        const operadorIds = [...new Set(data.filter(t => t.operador_id).map(t => t.operador_id!))]

        // Buscar dados relacionados
        const [usersRes, tiposRes, equipesRes, operadoresRes] = await Promise.all([
          supabase.from('users').select('id, email').in('id', userIds),
          tipoTransgressaoIds.length > 0 
            ? supabase.from('tipos_transgressoes').select('id, nome').in('id', tipoTransgressaoIds)
            : Promise.resolve({ data: [], error: null }),
          equipeIds.length > 0
            ? supabase.from('equipes').select('id, nome').in('id', equipeIds)
            : Promise.resolve({ data: [], error: null }),
          operadorIds.length > 0
            ? supabase.from('operadores').select('id, nome, codinome').in('id', operadorIds)
            : Promise.resolve({ data: [], error: null })
        ])

        const usersMap = new Map(usersRes.data?.map(u => [u.id, u.email]) || [])
        const tiposMap = new Map(tiposRes.data?.map(t => [t.id, t.nome]) || [])
        const equipesMap = new Map(equipesRes.data?.map(e => [e.id, e.nome]) || [])
        const operadoresMap = new Map(operadoresRes.data?.map(op => [
          op.id, 
          { nome: op.nome, codinome: op.codinome, display: op.codinome ? `${op.nome} (${op.codinome})` : op.nome }
        ]) || [])

        // Mapear transgressões com dados relacionados
        const transgressoesComDados = data.map((t: any) => ({
          ...t,
          criado_por_nome: usersMap.get(t.criado_por) || 'Desconhecido',
          tipo_transgressao_nome: t.tipo_transgressao_id ? tiposMap.get(t.tipo_transgressao_id) : null,
          equipe_nome: t.equipe_id ? equipesMap.get(t.equipe_id) : null,
          operador_info: t.operador_id ? operadoresMap.get(t.operador_id) : null
        }))

        setTransgressoes(transgressoesComDados)
      }
    } catch (error: any) {
      console.error('Erro ao carregar transgressões:', error.message)
      alert('Erro ao carregar transgressões: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const carregarEquipes = async () => {
    try {
      const { data, error } = await supabase
        .from('equipes')
        .select('id, nome')
        .order('nome')

      if (error) throw error
      if (data) {
        setEquipes(data as Equipe[])
      }
    } catch (error: any) {
      console.error('Erro ao carregar equipes:', error.message)
    }
  }

  const carregarOperadores = async () => {
    try {
      const { data, error } = await supabase
        .from('operadores')
        .select('id, nome, codinome')
        .order('nome')

      if (error) throw error
      if (data) {
        setOperadores(data)
      }
    } catch (error: any) {
      console.error('Erro ao carregar operadores:', error.message)
    }
  }

  const aplicarFiltros = () => {
    let filtradas = [...transgressoes]

    // Filtro por tipo (equipe/operador)
    if (filtroTipo !== 'todos') {
      filtradas = filtradas.filter(t => t.tipo === filtroTipo)
    }

    // Filtro por equipe
    if (filtroEquipe) {
      filtradas = filtradas.filter(t => t.equipe_id === filtroEquipe)
    }

    // Filtro por operador
    if (filtroOperador) {
      filtradas = filtradas.filter(t => t.operador_id === filtroOperador)
    }

    // Filtro por data
    if (filtroDataInicio) {
      filtradas = filtradas.filter(t => {
        const dataEvento = t.data_evento ? new Date(t.data_evento) : null
        const dataInicio = new Date(filtroDataInicio)
        return dataEvento && dataEvento >= dataInicio
      })
    }

    if (filtroDataFim) {
      filtradas = filtradas.filter(t => {
        const dataEvento = t.data_evento ? new Date(t.data_evento) : null
        const dataFim = new Date(filtroDataFim)
        dataFim.setHours(23, 59, 59, 999) // Fim do dia
        return dataEvento && dataEvento <= dataFim
      })
    }

    setTransgressoesFiltradas(filtradas)
  }

  const formatarData = (data: string) => {
    if (!data) return '-'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const formatarDataEvento = (data: string) => {
    if (!data) return '-'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const excluirTransgressao = async (transgressaoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transgressão?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('anotacoes')
        .delete()
        .eq('id', transgressaoId)

      if (error) throw error

      await carregarTransgressoes()
      alert('Transgressão excluída com sucesso!')
    } catch (error: any) {
      console.error('Erro ao excluir transgressão:', error)
      alert('Erro ao excluir transgressão: ' + error.message)
    }
  }

  const limparFiltros = () => {
    setFiltroEquipe('')
    setFiltroOperador('')
    setFiltroTipo('todos')
    setFiltroDataInicio('')
    setFiltroDataFim('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fta-dark text-white p-8 flex items-center justify-center">
        <div className="text-xl">Carregando transgressões...</div>
      </div>
    )
  }

  return (
    <div className="bg-fta-dark text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Transgressões</h1>
          <p className="text-white/60">Visualize e gerencie todas as transgressões registradas</p>
        </div>

        {/* Filtros */}
        <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MdFilterList className="w-5 h-5 text-fta-green" />
            <h2 className="text-2xl font-semibold text-fta-green">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Filtro por Tipo */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Tipo
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as 'todos' | 'equipe' | 'operador')}
                className="w-full px-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
              >
                <option value="todos">Todos</option>
                <option value="equipe">Equipe</option>
                <option value="operador">Operador</option>
              </select>
            </div>

            {/* Filtro por Equipe */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Equipe
              </label>
              <select
                value={filtroEquipe}
                onChange={(e) => setFiltroEquipe(e.target.value)}
                className="w-full px-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
              >
                <option value="">Todas as equipes</option>
                {equipes.map(equipe => (
                  <option key={equipe.id} value={equipe.id}>{equipe.nome}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Operador */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Operador
              </label>
              <select
                value={filtroOperador}
                onChange={(e) => setFiltroOperador(e.target.value)}
                className="w-full px-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
              >
                <option value="">Todos os operadores</option>
                {operadores.map(operador => (
                  <option key={operador.id} value={operador.id}>
                    {operador.codinome ? `${operador.nome} (${operador.codinome})` : operador.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Data Início */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className="w-full px-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
              />
            </div>

            {/* Filtro por Data Fim */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className="w-full px-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
              />
            </div>
          </div>

          {/* Botão Limpar Filtros e Contador */}
          <div className="mt-4 flex justify-between items-center">
            {(filtroEquipe || filtroOperador || filtroTipo !== 'todos' || filtroDataInicio || filtroDataFim) && (
              <Button variant="outline" onClick={limparFiltros} className="text-sm">
                Limpar Filtros
              </Button>
            )}
            <div className="text-white/60 text-sm ml-auto">
              Mostrando: {transgressoesFiltradas.length} de {transgressoes.length} transgressão(ões)
            </div>
          </div>
        </div>

        {/* Tabela de Transgressões */}
        {transgressoesFiltradas.length === 0 ? (
          <div className="bg-fta-gray/50 p-12 rounded-xl border border-white/10 text-center">
            <p className="text-white/60 text-lg mb-4">
              {transgressoes.length === 0 
                ? 'Nenhuma transgressão registrada ainda.'
                : 'Nenhuma transgressão encontrada com os filtros aplicados.'}
            </p>
            {transgressoes.length > 0 && (
              <Button variant="outline" onClick={limparFiltros}>
                Limpar Filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-fta-gray/50 rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHeaderCell>Tipo</TableHeaderCell>
                  <TableHeaderCell>Equipe</TableHeaderCell>
                  <TableHeaderCell>Operador</TableHeaderCell>
                  <TableHeaderCell>Tipo Transgressão</TableHeaderCell>
                  <TableHeaderCell>Data Evento</TableHeaderCell>
                  <TableHeaderCell>Evento</TableHeaderCell>
                  <TableHeaderCell>Local</TableHeaderCell>
                  <TableHeaderCell>Criado por</TableHeaderCell>
                  <TableHeaderCell>Data Registro</TableHeaderCell>
                  {isAdmin && <TableHeaderCell>Ações</TableHeaderCell>}
                </TableHeader>
                <TableBody>
                  {transgressoesFiltradas.map((transgressao) => (
                    <TableRow key={transgressao.id}>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          transgressao.tipo === 'equipe'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {transgressao.tipo === 'equipe' ? 'Equipe' : 'Operador'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {transgressao.equipe_nome ? (
                          <span className="px-2 py-1 bg-white/10 rounded text-xs">
                            {transgressao.equipe_nome}
                          </span>
                        ) : (
                          <span className="text-white/40 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {transgressao.operador_info ? (
                          <span className="px-2 py-1 bg-fta-green/20 text-fta-green rounded text-xs font-medium">
                            {transgressao.operador_info.display}
                          </span>
                        ) : (
                          <span className="text-white/40 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {transgressao.tipo_transgressao_nome ? (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                            {transgressao.tipo_transgressao_nome}
                          </span>
                        ) : (
                          <span className="text-white/40 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>{formatarDataEvento(transgressao.data_evento || '')}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={transgressao.nome_evento || ''}>
                          {transgressao.nome_evento || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={transgressao.local_evento || ''}>
                          {transgressao.local_evento || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-white/60 text-xs">
                        {transgressao.criado_por_nome || 'Desconhecido'}
                      </TableCell>
                      <TableCell className="text-white/50 text-xs">
                        {formatarData(transgressao.created_at || '')}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <button
                            onClick={() => excluirTransgressao(transgressao.id!)}
                            className="text-red-400 hover:text-red-300 p-2"
                            title="Excluir"
                          >
                            <MdDelete className="w-4 h-4" />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

