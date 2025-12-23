import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Equipe, Plano } from '../lib/types'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/UI/Table'
import { Button } from '../components/UI/Button'
import { Input } from '../components/UI/Input'
import { 
  MdCheckCircle, 
  MdPending, 
  MdAttachMoney, 
  MdGroups, 
  MdStar,
  MdEdit,
  MdDelete,
  MdSave,
  MdCancel,
  MdAdd
} from 'react-icons/md'

const VALOR_COBRANCA_PADRAO = 65.00 // Valor padrão (será substituído pelo valor do plano)

type TabType = 'pagamentos' | 'planos'

export const Financeiro: React.FC = () => {
  // Estados para abas
  const [abaAtiva, setAbaAtiva] = useState<TabType>('pagamentos')
  
  // Estados para Pagamentos
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pago' | 'pendente'>('todos')
  
  // Estados para Planos
  const [loadingPlanos, setLoadingPlanos] = useState(false)
  const [editandoPlano, setEditandoPlano] = useState<string | null>(null)
  const [novoPlano, setNovoPlano] = useState<Partial<Plano>>({ nome: '', descricao: '', valor: 0, ativo: true })
  const [mostrarFormNovoPlano, setMostrarFormNovoPlano] = useState(false)
  const [formPlanoEdit, setFormPlanoEdit] = useState<Partial<Plano>>({})

  useEffect(() => {
    carregarDados()
  }, [abaAtiva])

  const carregarDados = async () => {
    await Promise.all([carregarEquipes(), carregarPlanos()])
  }

  const carregarEquipes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('equipes')
        .select(`
          *,
          planos(*)
        `)
        .order('nome')

      if (error) throw error
      if (data) {
        // Mapear plano para o formato correto
        const equipesMapeadas = data.map((eq: any) => ({
          ...eq,
          plano: Array.isArray(eq.planos) && eq.planos.length > 0 ? eq.planos[0] : null
        }))
        setEquipes(equipesMapeadas)
      }
    } catch (error: any) {
      console.error('Erro ao carregar equipes:', error.message)
      alert('Erro ao carregar equipes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const carregarPlanos = async () => {
    try {
      setLoadingPlanos(true)
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .order('valor', { ascending: true })

      if (error) throw error
      if (data) setPlanos(data)
    } catch (error: any) {
      console.error('Erro ao carregar planos:', error.message)
      alert('Erro ao carregar planos: ' + error.message)
    } finally {
      setLoadingPlanos(false)
    }
  }

  const toggleStatusPagamento = async (equipeId: string, statusAtual: boolean) => {
    try {
      const novoStatus = !statusAtual
      const equipe = equipes.find(e => e.id === equipeId)
      const valorCobrado = equipe?.plano?.valor || equipe?.valor_cobrado || VALOR_COBRANCA_PADRAO
      
      // Preparar dados para atualização
      const dadosAtualizacao: any = {
        pagamento_efetuado: novoStatus,
        valor_cobrado: valorCobrado
      }

      // Se está marcando como pago, definir a data de pagamento como hoje
      // Se está marcando como pendente, limpar a data de pagamento
      if (novoStatus === true) {
        dadosAtualizacao.data_pagamento = new Date().toISOString().split('T')[0]
      } else {
        dadosAtualizacao.data_pagamento = null
      }

      const { error } = await supabase
        .from('equipes')
        .update(dadosAtualizacao)
        .eq('id', equipeId)

      if (error) throw error

      await carregarEquipes()
    } catch (error: any) {
      console.error('Erro ao atualizar status de pagamento:', error)
      alert('Erro ao atualizar status: ' + error.message)
    }
  }

  const atualizarPlanoEquipe = async (equipeId: string, planoId: string | null) => {
    try {
      const plano = planos.find(p => p.id === planoId)
      
      const dadosAtualizacao: any = {
        plano_id: planoId,
        valor_cobrado: plano?.valor || null
      }

      const { error } = await supabase
        .from('equipes')
        .update(dadosAtualizacao)
        .eq('id', equipeId)

      if (error) throw error

      await carregarEquipes()
      alert('Plano da equipe atualizado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar plano da equipe:', error)
      alert('Erro ao atualizar plano: ' + error.message)
    }
  }

  // Funções para gerenciar planos
  const criarPlano = async () => {
    try {
      if (!novoPlano.nome || !novoPlano.valor) {
        alert('Preencha nome e valor do plano')
        return
      }

      const { error } = await supabase
        .from('planos')
        .insert([{
          nome: novoPlano.nome,
          descricao: novoPlano.descricao || '',
          valor: novoPlano.valor,
          ativo: novoPlano.ativo !== false
        }])

      if (error) throw error

      setNovoPlano({ nome: '', descricao: '', valor: 0, ativo: true })
      setMostrarFormNovoPlano(false)
      await carregarPlanos()
      alert('Plano criado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao criar plano:', error)
      alert('Erro ao criar plano: ' + error.message)
    }
  }

  const iniciarEdicaoPlano = (plano: Plano) => {
    setEditandoPlano(plano.id!)
    setFormPlanoEdit({ ...plano })
  }

  const cancelarEdicaoPlano = () => {
    setEditandoPlano(null)
    setFormPlanoEdit({})
  }

  const salvarEdicaoPlano = async (planoId: string) => {
    try {
      if (!formPlanoEdit.nome || !formPlanoEdit.valor) {
        alert('Preencha nome e valor do plano')
        return
      }

      const { error } = await supabase
        .from('planos')
        .update({
          nome: formPlanoEdit.nome,
          descricao: formPlanoEdit.descricao || '',
          valor: formPlanoEdit.valor,
          ativo: formPlanoEdit.ativo !== false
        })
        .eq('id', planoId)

      if (error) throw error

      setEditandoPlano(null)
      setFormPlanoEdit({})
      await carregarPlanos()
      alert('Plano atualizado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar plano:', error)
      alert('Erro ao atualizar plano: ' + error.message)
    }
  }

  const deletarPlano = async (planoId: string) => {
    try {
      if (!confirm('Tem certeza que deseja deletar este plano? Equipes com este plano terão o plano removido.')) {
        return
      }

      // Primeiro, remover plano das equipes
      await supabase
        .from('equipes')
        .update({ plano_id: null })
        .eq('plano_id', planoId)

      // Depois, deletar o plano
      const { error } = await supabase
        .from('planos')
        .delete()
        .eq('id', planoId)

      if (error) throw error

      await carregarPlanos()
      await carregarEquipes()
      alert('Plano deletado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao deletar plano:', error)
      alert('Erro ao deletar plano: ' + error.message)
    }
  }

  const toggleStatusPlano = async (planoId: string, statusAtual: boolean) => {
    try {
      const { error } = await supabase
        .from('planos')
        .update({ ativo: !statusAtual })
        .eq('id', planoId)

      if (error) throw error

      await carregarPlanos()
    } catch (error: any) {
      console.error('Erro ao atualizar status do plano:', error)
      alert('Erro ao atualizar status: ' + error.message)
    }
  }

  const formatarData = (data: string) => {
    if (!data) return '-'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  // Calcular métricas (usando valores dos planos)
  const equipesPagas = equipes.filter(e => e.pagamento_efetuado === true).length
  const equipesPendentes = equipes.filter(e => e.pagamento_efetuado !== true).length
  const totalEquipes = equipes.length
  const totalArrecadado = equipes
    .filter(e => e.pagamento_efetuado === true)
    .reduce((sum, e) => sum + (e.plano?.valor || e.valor_cobrado || VALOR_COBRANCA_PADRAO), 0)
  const totalPendente = equipes
    .filter(e => e.pagamento_efetuado !== true)
    .reduce((sum, e) => sum + (e.plano?.valor || e.valor_cobrado || VALOR_COBRANCA_PADRAO), 0)
  const totalPrevisto = equipes.reduce((sum, e) => sum + (e.plano?.valor || e.valor_cobrado || VALOR_COBRANCA_PADRAO), 0)

  // Filtrar equipes
  const equipesFiltradas = filtroStatus === 'todos'
    ? equipes
    : filtroStatus === 'pago'
    ? equipes.filter(e => e.pagamento_efetuado === true)
    : equipes.filter(e => e.pagamento_efetuado !== true)

  if (loading && abaAtiva === 'pagamentos') {
    return (
      <div className="min-h-screen bg-fta-dark text-white p-8 flex items-center justify-center">
        <div className="text-xl">Carregando dados financeiros...</div>
      </div>
    )
  }

  return (
    <div className="bg-fta-dark text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Financeiro</h1>
          <p className="text-white/60">Controle de pagamentos, planos e receitas das equipes</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <button
            onClick={() => setAbaAtiva('pagamentos')}
            className={`px-6 py-3 font-medium transition-colors ${
              abaAtiva === 'pagamentos'
                ? 'text-fta-green border-b-2 border-fta-green'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Pagamentos
          </button>
          <button
            onClick={() => setAbaAtiva('planos')}
            className={`px-6 py-3 font-medium transition-colors ${
              abaAtiva === 'planos'
                ? 'text-fta-green border-b-2 border-fta-green'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Planos
          </button>
        </div>

        {/* Conteúdo da Aba Pagamentos */}
        {abaAtiva === 'pagamentos' && (
          <>
            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Arrecadado */}
              <div className="bg-fta-gray/50 p-6 rounded-xl border border-fta-green/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-fta-green/20 rounded-lg">
                    <MdAttachMoney className="w-6 h-6 text-fta-green" />
                  </div>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Total Arrecadado</h3>
                <p className="text-3xl font-bold text-fta-green">{formatarMoeda(totalArrecadado)}</p>
                <p className="text-white/40 text-xs mt-2">{equipesPagas} equipe(s) pagas</p>
              </div>

              {/* Total Pendente */}
              <div className="bg-fta-gray/50 p-6 rounded-xl border border-yellow-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-500/20 rounded-lg">
                    <MdPending className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Total Pendente</h3>
                <p className="text-3xl font-bold text-yellow-500">{formatarMoeda(totalPendente)}</p>
                <p className="text-white/40 text-xs mt-2">{equipesPendentes} equipe(s) pendentes</p>
              </div>

              {/* Total Previsto */}
              <div className="bg-fta-gray/50 p-6 rounded-xl border border-blue-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <MdGroups className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Total Previsto</h3>
                <p className="text-3xl font-bold text-blue-400">{formatarMoeda(totalPrevisto)}</p>
                <p className="text-white/40 text-xs mt-2">{totalEquipes} equipe(s) cadastradas</p>
              </div>

              {/* Total de Planos */}
              <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-lg">
                    <MdStar className="w-6 h-6 text-white/60" />
                  </div>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Total de Planos</h3>
                <p className="text-3xl font-bold text-white">{planos.filter(p => p.ativo).length}</p>
                <p className="text-white/40 text-xs mt-2">planos ativos</p>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-fta-gray/50 p-4 rounded-xl border border-white/10 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="text-white/80 font-medium">Filtrar por Status:</label>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value as 'todos' | 'pago' | 'pendente')}
                    className="px-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
                  >
                    <option value="todos">Todas</option>
                    <option value="pago">Pagas</option>
                    <option value="pendente">Pendentes</option>
                  </select>
                </div>
                <div className="text-white/60 text-sm">
                  Mostrando: {equipesFiltradas.length} de {totalEquipes} equipe(s)
                </div>
              </div>
            </div>

            {/* Tabela de Equipes */}
            {equipesFiltradas.length === 0 ? (
              <div className="bg-fta-gray/50 p-12 rounded-xl border border-white/10 text-center">
                <p className="text-white/60 text-lg">
                  {equipes.length === 0 
                    ? 'Nenhuma equipe cadastrada ainda.'
                    : 'Nenhuma equipe encontrada com o filtro aplicado.'}
                </p>
              </div>
            ) : (
              <div className="bg-fta-gray/50 rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableHeaderCell>Equipe</TableHeaderCell>
                      <TableHeaderCell>Capitão</TableHeaderCell>
                      <TableHeaderCell>Cidade / Estado</TableHeaderCell>
                      <TableHeaderCell>Membro Desde</TableHeaderCell>
                      <TableHeaderCell>Plano</TableHeaderCell>
                      <TableHeaderCell>Valor</TableHeaderCell>
                      <TableHeaderCell>Status Pagamento</TableHeaderCell>
                      <TableHeaderCell>Data Pagamento</TableHeaderCell>
                      <TableHeaderCell>Ações</TableHeaderCell>
                    </TableHeader>
                    <TableBody>
                      {equipesFiltradas.map((equipe) => (
                        <TableRow key={equipe.id}>
                          <TableCell className="font-medium">{equipe.nome}</TableCell>
                          <TableCell>{equipe.capitao}</TableCell>
                          <TableCell>{equipe.cidade} / {equipe.estado}</TableCell>
                          <TableCell>{formatarData(equipe.membro_desde)}</TableCell>
                          <TableCell>
                            <select
                              value={equipe.plano_id || ''}
                              onChange={(e) => atualizarPlanoEquipe(equipe.id!, e.target.value || null)}
                              className="px-3 py-1.5 bg-fta-dark border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-fta-green"
                            >
                              <option value="">Sem Plano</option>
                              {planos.filter(p => p.ativo).map(plano => (
                                <option key={plano.id} value={plano.id}>
                                  {plano.nome} ({formatarMoeda(plano.valor)})
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell className="font-semibold text-fta-green">
                            {formatarMoeda(equipe.plano?.valor || equipe.valor_cobrado || VALOR_COBRANCA_PADRAO)}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                              equipe.pagamento_efetuado === true
                                ? 'bg-fta-green/20 text-fta-green border border-fta-green/30'
                                : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                            }`}>
                              {equipe.pagamento_efetuado === true ? (
                                <>
                                  <MdCheckCircle className="w-4 h-4" />
                                  <span>Pago</span>
                                </>
                              ) : (
                                <>
                                  <MdPending className="w-4 h-4" />
                                  <span>Pendente</span>
                                </>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-white/60 text-xs">
                            {equipe.data_pagamento ? formatarData(equipe.data_pagamento) : '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              onClick={() => toggleStatusPagamento(equipe.id!, equipe.pagamento_efetuado === true)}
                              className={`text-xs px-3 py-1 ${
                                equipe.pagamento_efetuado === true
                                  ? 'text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10'
                                  : 'text-fta-green border-fta-green/50 hover:bg-fta-green/10'
                              }`}
                            >
                              {equipe.pagamento_efetuado === true ? 'Marcar Pendente' : 'Marcar Pago'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Resumo */}
            <div className="mt-6 bg-fta-gray/50 p-6 rounded-xl border border-white/10">
              <h3 className="text-xl font-semibold mb-4 text-fta-green">Resumo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-white/60 text-sm">Equipes Pagas</p>
                  <p className="text-2xl font-bold text-fta-green">{equipesPagas}</p>
                  <p className="text-white/40 text-xs mt-1">{totalEquipes > 0 ? ((equipesPagas / totalEquipes) * 100).toFixed(1) : 0}% do total</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Equipes Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-500">{equipesPendentes}</p>
                  <p className="text-white/40 text-xs mt-1">{totalEquipes > 0 ? ((equipesPendentes / totalEquipes) * 100).toFixed(1) : 0}% do total</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Taxa de Pagamento</p>
                  <p className="text-2xl font-bold text-blue-400">{totalEquipes > 0 ? ((equipesPagas / totalEquipes) * 100).toFixed(1) : 0}%</p>
                  <p className="text-white/40 text-xs mt-1">do total de equipes</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Conteúdo da Aba Planos */}
        {abaAtiva === 'planos' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Gerenciar Planos</h2>
              <Button onClick={() => setMostrarFormNovoPlano(!mostrarFormNovoPlano)}>
                <MdAdd className="w-5 h-5" /> Novo Plano
              </Button>
            </div>

            {/* Formulário de Novo Plano */}
            {mostrarFormNovoPlano && (
              <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10 mb-6">
                <h3 className="text-xl font-semibold mb-4 text-fta-green">Criar Novo Plano</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome do Plano"
                    value={novoPlano.nome || ''}
                    onChange={(e) => setNovoPlano({ ...novoPlano, nome: e.target.value })}
                    placeholder="Ex: Básico, Plus, Premium"
                    required
                  />
                  <Input
                    label="Valor (R$)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoPlano.valor || ''}
                    onChange={(e) => setNovoPlano({ ...novoPlano, valor: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex: 50.90"
                    required
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Descrição"
                      value={novoPlano.descricao || ''}
                      onChange={(e) => setNovoPlano({ ...novoPlano, descricao: e.target.value })}
                      placeholder="Descrição do plano (opcional)"
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-4">
                    <Button onClick={criarPlano}>
                      <MdSave className="w-5 h-5" /> Salvar Plano
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setMostrarFormNovoPlano(false)
                      setNovoPlano({ nome: '', descricao: '', valor: 0, ativo: true })
                    }}>
                      <MdCancel className="w-5 h-5" /> Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Cards de Planos */}
            {loadingPlanos ? (
              <div className="text-center py-12">
                <p className="text-white/60">Carregando planos...</p>
              </div>
            ) : planos.length === 0 ? (
              <div className="bg-fta-gray/50 p-12 rounded-xl border border-white/10 text-center">
                <p className="text-white/60 text-lg">Nenhum plano cadastrado ainda.</p>
                <p className="text-white/40 text-sm mt-2">Clique em "Novo Plano" para criar o primeiro plano.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {planos.map((plano) => (
                  <div
                    key={plano.id}
                    className={`bg-fta-gray/50 p-6 rounded-xl border ${
                      plano.ativo 
                        ? 'border-fta-green/30' 
                        : 'border-white/10 opacity-60'
                    }`}
                  >
                    {editandoPlano === plano.id ? (
                      <div className="space-y-4">
                        <Input
                          label="Nome"
                          value={formPlanoEdit.nome || ''}
                          onChange={(e) => setFormPlanoEdit({ ...formPlanoEdit, nome: e.target.value })}
                          required
                        />
                        <Input
                          label="Valor (R$)"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formPlanoEdit.valor || ''}
                          onChange={(e) => setFormPlanoEdit({ ...formPlanoEdit, valor: parseFloat(e.target.value) || 0 })}
                          required
                        />
                        <Input
                          label="Descrição"
                          value={formPlanoEdit.descricao || ''}
                          onChange={(e) => setFormPlanoEdit({ ...formPlanoEdit, descricao: e.target.value })}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`ativo-${plano.id}`}
                            checked={formPlanoEdit.ativo !== false}
                            onChange={(e) => setFormPlanoEdit({ ...formPlanoEdit, ativo: e.target.checked })}
                            className="w-4 h-4 rounded border-white/20 bg-fta-dark text-fta-green focus:ring-fta-green"
                          />
                          <label htmlFor={`ativo-${plano.id}`} className="text-sm text-white/80">
                            Ativo
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => salvarEdicaoPlano(plano.id!)} className="flex-1">
                            <MdSave className="w-4 h-4" /> Salvar
                          </Button>
                          <Button variant="outline" onClick={cancelarEdicaoPlano} className="flex-1">
                            <MdCancel className="w-4 h-4" /> Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-fta-green mb-1">{plano.nome}</h3>
                            <p className="text-3xl font-bold text-white mb-2">{formatarMoeda(plano.valor)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            plano.ativo
                              ? 'bg-fta-green/20 text-fta-green'
                              : 'bg-white/10 text-white/60'
                          }`}>
                            {plano.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        {plano.descricao && (
                          <p className="text-white/60 text-sm mb-4">{plano.descricao}</p>
                        )}
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            onClick={() => iniciarEdicaoPlano(plano)}
                            className="flex-1"
                          >
                            <MdEdit className="w-4 h-4" /> Editar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => toggleStatusPlano(plano.id!, plano.ativo)}
                            className="flex-1"
                          >
                            {plano.ativo ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => deletarPlano(plano.id!)}
                            className="text-red-400 border-red-400/50 hover:bg-red-400/10"
                          >
                            <MdDelete className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
