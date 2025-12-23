import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Equipe } from '../lib/types'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/UI/Table'
import { Button } from '../components/UI/Button'
import { MdPayment, MdCheckCircle, MdPending, MdAttachMoney, MdGroups } from 'react-icons/md'

const VALOR_COBRANCA = 65.00 // Valor fixo por equipe

export const Financeiro: React.FC = () => {
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pago' | 'pendente'>('todos')

  useEffect(() => {
    carregarEquipes()
  }, [])

  const carregarEquipes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('equipes')
        .select('*')
        .order('nome')

      if (error) throw error
      if (data) setEquipes(data)
    } catch (error: any) {
      console.error('Erro ao carregar equipes:', error.message)
      alert('Erro ao carregar equipes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleStatusPagamento = async (equipeId: string, statusAtual: boolean) => {
    try {
      const novoStatus = !statusAtual
      const { error } = await supabase
        .from('equipes')
        .update({ pagamento_efetuado: novoStatus })
        .eq('id', equipeId)

      if (error) throw error

      await carregarEquipes()
    } catch (error: any) {
      console.error('Erro ao atualizar status de pagamento:', error)
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

  // Calcular métricas
  const equipesPagas = equipes.filter(e => e.pagamento_efetuado === true).length
  const equipesPendentes = equipes.filter(e => e.pagamento_efetuado !== true).length
  const totalEquipes = equipes.length
  const totalArrecadado = equipesPagas * VALOR_COBRANCA
  const totalPendente = equipesPendentes * VALOR_COBRANCA
  const totalPrevisto = totalEquipes * VALOR_COBRANCA

  // Filtrar equipes
  const equipesFiltradas = filtroStatus === 'todos'
    ? equipes
    : filtroStatus === 'pago'
    ? equipes.filter(e => e.pagamento_efetuado === true)
    : equipes.filter(e => e.pagamento_efetuado !== true)

  if (loading) {
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
          <p className="text-white/60">Controle de pagamentos e receitas das equipes</p>
        </div>

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

          {/* Valor por Equipe */}
          <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/10 rounded-lg">
                <MdPayment className="w-6 h-6 text-white/60" />
              </div>
            </div>
            <h3 className="text-white/60 text-sm font-medium mb-1">Valor por Equipe</h3>
            <p className="text-3xl font-bold text-white">{formatarMoeda(VALOR_COBRANCA)}</p>
            <p className="text-white/40 text-xs mt-2">Mensalidade</p>
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
                      <TableCell className="font-semibold text-fta-green">
                        {formatarMoeda(VALOR_COBRANCA)}
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
      </div>
    </div>
  )
}

