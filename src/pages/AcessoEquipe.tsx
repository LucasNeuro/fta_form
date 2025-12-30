import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Equipe, Anotacao, Boleto, Operador } from '../lib/types'
import { Button } from '../components/UI/Button'
import { Sideover } from '../components/UI/Sideover'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/UI/Table'
import { MdWarning, MdCheckCircle, MdLock, MdPerson, MdEvent, MdLocationOn, MdTitle, MdGroup, MdEmail, MdPhone, MdCalendarToday, MdReceipt } from 'react-icons/md'

// Tipo estendido para anotações com operadores
interface AnotacaoComOperador extends Anotacao {
  operadores?: {
    id: string
    nome: string
    codinome: string
  }
  criado_por_nome?: string
}

export const AcessoEquipe: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [equipe, setEquipe] = useState<Equipe | null>(null)
  const [anotacoes, setAnotacoes] = useState<AnotacaoComOperador[]>([])
  const [boletos, setBoletos] = useState<Boleto[]>([])
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [linkValido, setLinkValido] = useState(false)
  const [pagamentoValido, setPagamentoValido] = useState(false)
  const [motivoBloqueio, setMotivoBloqueio] = useState<string>('')
  const [operadorSelecionado, setOperadorSelecionado] = useState<Operador | null>(null)
  const [anotacaoSelecionada, setAnotacaoSelecionada] = useState<AnotacaoComOperador | null>(null)
  const [sideoverAberto, setSideoverAberto] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<'operadores' | 'anotacoes'>('operadores')

  useEffect(() => {
    validarAcesso()
  }, [token])

  const validarAcesso = async () => {
    if (!token) {
      setMotivoBloqueio('Token inválido')
      setLoading(false)
      return
    }

    try {
      // 1. Validar o link
      const { data: linkData, error: linkError } = await supabase
        .from('links_acesso_equipes')
        .select('*, equipes(*)')
        .eq('token', token)
        .eq('ativo', true)
        .single()

      if (linkError || !linkData) {
        setMotivoBloqueio('Link inválido ou desativado')
        setLoading(false)
        return
      }

      setLinkValido(true)
      const equipeData = linkData.equipes as Equipe
      setEquipe(equipeData)

      // 2. Verificar pagamento válido (status = 'pago' e dentro de 38 dias)
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      const { data: boletosData, error: boletosError } = await supabase
        .from('boletos')
        .select('*')
        .eq('equipe_id', equipeData.id)
        .eq('status', 'pago')
        .not('data_pagamento', 'is', null)
        .order('data_pagamento', { ascending: false })
        .limit(1)

      if (boletosError) {
        console.error('Erro ao buscar boletos:', boletosError)
      }

      // Verificar se há pagamento válido
      let pagamentoValidoLocal = false
      if (boletosData && boletosData.length > 0) {
        const ultimoBoleto = boletosData[0]
        if (ultimoBoleto.data_pagamento) {
          const dataPagamento = new Date(ultimoBoleto.data_pagamento)
          dataPagamento.setHours(0, 0, 0, 0)
          
          const dataValidade = new Date(dataPagamento)
          dataValidade.setDate(dataValidade.getDate() + 38)

          if (hoje <= dataValidade) {
            pagamentoValidoLocal = true
            setPagamentoValido(true)
            setBoletos(boletosData)
          } else {
            setMotivoBloqueio(`Pagamento expirado. Último pagamento em ${formatarData(ultimoBoleto.data_pagamento)}. Válido por 38 dias.`)
          }
        }
      } else {
        setMotivoBloqueio('Nenhum pagamento encontrado. É necessário ter um pagamento válido para acessar.')
      }

      // 3. Carregar anotações e operadores da equipe (só se tiver pagamento válido)
      if (pagamentoValidoLocal) {
        await Promise.all([
          carregarAnotacoes(equipeData.id!),
          carregarOperadores(equipeData.id!)
        ])
      }

      // 4. Atualizar último acesso
      await supabase
        .from('links_acesso_equipes')
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq('token', token)

    } catch (error: any) {
      console.error('Erro ao validar acesso:', error)
      setMotivoBloqueio('Erro ao validar acesso: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const carregarAnotacoes = async (equipeId: string) => {
    try {
      // Buscar anotações da equipe
      const { data: anotacoesEquipe, error: errorEquipe } = await supabase
        .from('anotacoes')
        .select(`
          *,
          tipos_transgressoes:tipo_transgressao_id(id, nome, descricao),
          criado_por_user:users!anotacoes_criado_por_fkey(id, email)
        `)
        .eq('tipo', 'equipe')
        .eq('equipe_id', equipeId)
        .order('created_at', { ascending: false })

      if (errorEquipe) throw errorEquipe

      // Buscar anotações de operadores da equipe (transgressões)
      const { data: anotacoesOperadores, error: errorOperadores } = await supabase
        .from('anotacoes')
        .select(`
          *,
          tipos_transgressoes:tipo_transgressao_id(id, nome, descricao),
          operadores:operador_id(id, nome, codinome),
          criado_por_user:users!anotacoes_criado_por_fkey(id, email)
        `)
        .eq('tipo', 'operador')
        .eq('e_transgressao', true)
        .not('operador_id', 'is', null)
        .order('created_at', { ascending: false })

      if (errorOperadores) throw errorOperadores

      // Filtrar apenas operadores da equipe
      const { data: operadoresEquipe } = await supabase
        .from('operadores')
        .select('id')
        .eq('equipe_id', equipeId)

      const operadoresIds = operadoresEquipe?.map(op => op.id) || []
      const anotacoesOperadoresFiltradas = anotacoesOperadores?.filter(
        anot => anot.operador_id && operadoresIds.includes(anot.operador_id)
      ) || []

      // Buscar informações dos usuários que criaram as anotações
      const userIds = [
        ...new Set([
          ...(anotacoesEquipe?.map(a => a.criado_por) || []),
          ...(anotacoesOperadoresFiltradas?.map(a => a.criado_por) || [])
        ])
      ]

      const { data: usersData } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds)

      const usersMap = new Map(usersData?.map(u => [u.id, u.email]) || [])

      // Processar anotações com informações completas
      const todasAnotacoes: AnotacaoComOperador[] = [
        ...(anotacoesEquipe || []).map(a => ({
          ...a,
          criado_por_nome: usersMap.get(a.criado_por) || 'Desconhecido'
        })),
        ...anotacoesOperadoresFiltradas.map(a => ({
          ...a,
          criado_por_nome: usersMap.get(a.criado_por) || 'Desconhecido',
          operadores: (a as any).operadores
        }))
      ]

      setAnotacoes(todasAnotacoes)
    } catch (error: any) {
      console.error('Erro ao carregar anotações:', error)
    }
  }

  const carregarOperadores = async (equipeId: string) => {
    try {
      const { data, error } = await supabase
        .from('operadores')
        .select('*')
        .eq('equipe_id', equipeId)
        .order('nome')

      if (error) throw error
      setOperadores(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar operadores:', error)
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const calcularValidade = (dataPagamento: string) => {
    const data = new Date(dataPagamento)
    data.setDate(data.getDate() + 38)
    return formatarData(data.toISOString())
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fta-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fta-green mx-auto mb-4"></div>
          <p className="text-white/60">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!linkValido || !equipe) {
    return (
      <div className="min-h-screen bg-fta-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-fta-gray/50 p-8 rounded-xl border border-red-500/30">
          <div className="text-center">
            <MdLock className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
            <p className="text-white/60 mb-4">{motivoBloqueio || 'Link inválido ou desativado'}</p>
            <Button onClick={() => navigate('/login')} variant="outline">
              Voltar ao Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!pagamentoValido) {
    return (
      <div className="min-h-screen bg-fta-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-fta-gray/50 p-8 rounded-xl border border-yellow-500/30">
          <div className="text-center">
            <MdWarning className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Acesso Bloqueado</h1>
            <p className="text-white/60 mb-4">{motivoBloqueio}</p>
            <p className="text-white/40 text-sm mb-6">
              Para continuar tendo acesso, é necessário realizar um novo pagamento.
            </p>
            <Button onClick={() => navigate('/login')} variant="outline">
              Voltar ao Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Página de acompanhamento (só chega aqui se tiver pagamento válido)
  const ultimoBoleto = boletos[0]
  const dataValidade = ultimoBoleto?.data_pagamento 
    ? calcularValidade(ultimoBoleto.data_pagamento)
    : 'N/A'

  const abrirDetalhesOperador = (operador: Operador) => {
    setOperadorSelecionado(operador)
    setSideoverAberto(true)
  }

  return (
    <div className="min-h-screen bg-fta-dark">
      {/* Navbar Fixo */}
      <nav className="fixed top-0 left-0 right-0 h-16 z-50 bg-fta-dark border-b border-white/10 shadow-lg">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-fta-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base sm:text-lg">F</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-white">FTA Brasil</span>
          </div>
          <div className="flex items-center gap-2 text-fta-green">
            <MdCheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-medium text-xs sm:text-sm">Acesso Ativo</span>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <div className="pt-20 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header da Equipe */}
          <div className="bg-gradient-to-r from-fta-gray/50 to-fta-gray/30 p-4 sm:p-6 rounded-xl border border-fta-green/30 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-fta-green mb-2">{equipe.nome}</h1>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-white/60 text-sm sm:text-base">
                  <span className="flex items-center gap-1">
                    <MdPerson className="w-4 h-4" />
                    Capitão: {equipe.capitao}
                  </span>
                  <span>{equipe.cidade} - {equipe.estado}</span>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-white/60 text-xs sm:text-sm mb-1">Válido até</p>
                <p className="text-fta-green font-semibold text-base sm:text-lg">{dataValidade}</p>
              </div>
            </div>
          </div>

          {/* Informações da Equipe */}
          <div className="bg-fta-gray/50 p-4 sm:p-6 rounded-xl border border-white/10 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <MdGroup className="w-5 h-5 text-fta-green" />
              Informações da Equipe
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white/5 p-3 sm:p-4 rounded-lg">
                <p className="text-white/60 text-xs mb-1">Total de Membros</p>
                <p className="text-white font-semibold text-lg sm:text-xl">{equipe.total_membros}</p>
              </div>
              <div className="bg-white/5 p-3 sm:p-4 rounded-lg">
                <p className="text-white/60 text-xs mb-1">Membros Ativos</p>
                <p className="text-white font-semibold text-lg sm:text-xl">{equipe.ativos}</p>
              </div>
              <div className="bg-white/5 p-3 sm:p-4 rounded-lg">
                <p className="text-white/60 text-xs mb-1">Graduação FTA</p>
                <p className="text-white font-semibold text-sm sm:text-base">{equipe.graduacao_fta}</p>
              </div>
              <div className="bg-white/5 p-3 sm:p-4 rounded-lg">
                <p className="text-white/60 text-xs mb-1">Membro desde</p>
                <p className="text-white font-semibold text-sm sm:text-base">{formatarData(equipe.membro_desde)}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-white/10 overflow-x-auto">
            <button
              onClick={() => setAbaAtiva('operadores')}
              className={`px-4 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                abaAtiva === 'operadores'
                  ? 'text-fta-green border-b-2 border-fta-green'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <MdGroup className="w-5 h-5" />
                Operadores ({operadores.length})
              </span>
            </button>
            <button
              onClick={() => setAbaAtiva('anotacoes')}
              className={`px-4 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                abaAtiva === 'anotacoes'
                  ? 'text-fta-green border-b-2 border-fta-green'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <MdWarning className="w-5 h-5" />
              Anotações e Transgressões ({anotacoes.length})
            </button>
          </div>

          {/* Conteúdo da Aba Operadores */}
          {abaAtiva === 'operadores' && (
            <div className="bg-fta-gray/50 rounded-xl border border-white/10 overflow-hidden">
              {operadores.length === 0 ? (
                <div className="p-12 text-center">
                  <MdPerson className="w-12 h-12 text-white/20 mx-auto mb-2" />
                  <p className="text-white/60 text-lg">Nenhum operador cadastrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableHeaderCell className="min-w-[150px]">Nome</TableHeaderCell>
                      <TableHeaderCell className="min-w-[120px]">Codinome</TableHeaderCell>
                      <TableHeaderCell className="min-w-[150px]">Cidade / Estado</TableHeaderCell>
                      <TableHeaderCell className="min-w-[100px]">Labs FTA</TableHeaderCell>
                      <TableHeaderCell className="min-w-[120px]">Ações</TableHeaderCell>
                    </TableHeader>
                    <TableBody>
                      {operadores.map((operador) => (
                        <TableRow 
                          key={operador.id}
                          onClick={() => abrirDetalhesOperador(operador)}
                          className="cursor-pointer"
                        >
                          <TableCell className="font-medium">{operador.nome}</TableCell>
                          <TableCell>
                            {operador.codinome ? (
                              <span className="text-fta-green font-medium">{operador.codinome}</span>
                            ) : (
                              <span className="text-white/40">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{operador.cidade} / {operador.estado}</TableCell>
                          <TableCell>
                            {operador.lab_fta !== undefined && operador.lab_fta > 0 ? (
                              <span className="text-fta-green font-medium">
                                {operador.lab_fta} Lab{operador.lab_fta > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-white/40">0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                abrirDetalhesOperador(operador)
                              }}
                              className="text-xs px-2 sm:px-3 py-1 whitespace-nowrap"
                            >
                              <span className="hidden sm:inline">Ver Detalhes</span>
                              <span className="sm:hidden">Detalhes</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* Conteúdo da Aba Anotações */}
          {abaAtiva === 'anotacoes' && (
            <div className="bg-fta-gray/50 rounded-xl border border-white/10 overflow-hidden">
              {anotacoes.length === 0 ? (
                <div className="p-12 text-center">
                  <MdCheckCircle className="w-12 h-12 text-fta-green mx-auto mb-2" />
                  <p className="text-white/60 text-lg">Nenhuma anotação ou transgressão registrada</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableHeaderCell className="min-w-[120px]">Tipo</TableHeaderCell>
                      <TableHeaderCell className="min-w-[200px]">Título</TableHeaderCell>
                      <TableHeaderCell className="min-w-[150px]">Operador</TableHeaderCell>
                      <TableHeaderCell className="min-w-[120px]">Data Evento</TableHeaderCell>
                      <TableHeaderCell className="min-w-[150px]">Local</TableHeaderCell>
                      <TableHeaderCell className="min-w-[150px]">Criado em</TableHeaderCell>
                      <TableHeaderCell className="min-w-[140px]">Ações</TableHeaderCell>
                    </TableHeader>
                    <TableBody>
                      {anotacoes.map((anotacao) => (
                        <TableRow 
                          key={anotacao.id}
                          className={anotacao.e_transgressao ? 'bg-red-500/5' : ''}
                        >
                          <TableCell>
                            <div className="space-y-1">
                              {anotacao.e_transgressao ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                                  <MdWarning className="w-3 h-3" />
                                  <span className="hidden sm:inline">Transgressão</span>
                                  <span className="sm:hidden">Trans.</span>
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-white/10 text-white/80 border border-white/20">
                                  Anotação
                                </span>
                              )}
                              {anotacao.tipo_transgressao && (
                                <div className="mt-1">
                                  <span className="px-2 py-1 rounded text-xs bg-white/5 text-white/60 truncate block max-w-[100px] sm:max-w-none" title={anotacao.tipo_transgressao.nome || anotacao.tipo_transgressao_nome}>
                                    {anotacao.tipo_transgressao.nome || anotacao.tipo_transgressao_nome}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium max-w-xs">
                            <div className="truncate" title={anotacao.titulo || anotacao.descricao}>
                              {anotacao.titulo || (anotacao.descricao ? anotacao.descricao.substring(0, 30) + '...' : '-')}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[150px]">
                            {anotacao.operadores ? (
                              <span className="text-fta-green font-medium truncate block" title={`${anotacao.operadores.nome}${anotacao.operadores.codinome ? ` (${anotacao.operadores.codinome})` : ''}`}>
                                {anotacao.operadores.nome}
                                {anotacao.operadores.codinome && (
                                  <span className="hidden sm:inline"> ({anotacao.operadores.codinome})</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-white/40">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {anotacao.data_evento ? (
                              <span className="flex items-center gap-1">
                                <MdEvent className="w-4 h-4 text-white/60 flex-shrink-0" />
                                <span className="text-xs sm:text-sm">{formatarData(anotacao.data_evento)}</span>
                              </span>
                            ) : (
                              <span className="text-white/40">-</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            {anotacao.local_evento ? (
                              <div className="truncate" title={anotacao.local_evento}>
                                <span className="flex items-center gap-1">
                                  <MdLocationOn className="w-4 h-4 text-white/60 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm truncate">{anotacao.local_evento}</span>
                                </span>
                              </div>
                            ) : (
                              <span className="text-white/40">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-white/60 text-xs whitespace-nowrap">
                            <span className="hidden sm:inline">{new Date(anotacao.created_at || '').toLocaleString('pt-BR')}</span>
                            <span className="sm:hidden">{new Date(anotacao.created_at || '').toLocaleDateString('pt-BR')}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Button
                                variant="outline"
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  if (anotacao.operadores && anotacao.operador_id) {
                                    const { data: operadorCompleto } = await supabase
                                      .from('operadores')
                                      .select('*')
                                      .eq('id', anotacao.operador_id)
                                      .single()
                                    
                                    if (operadorCompleto) {
                                      setOperadorSelecionado(operadorCompleto)
                                      setAnotacaoSelecionada(null)
                                      setSideoverAberto(true)
                                    }
                                  }
                                }}
                                className="text-xs px-2 sm:px-3 py-1"
                                disabled={!anotacao.operadores}
                                title={anotacao.operadores ? 'Ver detalhes do operador' : 'Sem operador'}
                              >
                                <span className="hidden sm:inline">{anotacao.operadores ? 'Operador' : '-'}</span>
                                <MdPerson className="w-4 h-4 sm:hidden" />
                              </Button>
                              <Button
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setAnotacaoSelecionada(anotacao)
                                  setOperadorSelecionado(null)
                                  setSideoverAberto(true)
                                }}
                                className="text-xs px-2 sm:px-3 py-1"
                                title="Ver detalhes da anotação"
                              >
                                <MdReceipt className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sideover para Detalhes */}
      <Sideover
        isOpen={sideoverAberto}
        onClose={() => {
          setSideoverAberto(false)
          setOperadorSelecionado(null)
          setAnotacaoSelecionada(null)
        }}
        title={
          operadorSelecionado 
            ? `Detalhes - ${operadorSelecionado.nome}` 
            : anotacaoSelecionada
            ? `Detalhes - ${anotacaoSelecionada.titulo || 'Anotação'}`
            : 'Detalhes'
        }
      >
        {/* Detalhes do Operador */}
        {operadorSelecionado && (
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MdPerson className="w-5 h-5 text-fta-green" />
                Informações Básicas
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-white/60 text-xs mb-1">Nome Completo</p>
                  <p className="text-white font-medium">{operadorSelecionado.nome}</p>
                </div>
                {operadorSelecionado.codinome && (
                  <div>
                    <p className="text-white/60 text-xs mb-1">Codinome</p>
                    <p className="text-fta-green font-medium">{operadorSelecionado.codinome}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-white/60 text-xs mb-1">Cidade</p>
                    <p className="text-white font-medium">{operadorSelecionado.cidade}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs mb-1">Estado</p>
                    <p className="text-white font-medium">{operadorSelecionado.estado}</p>
                  </div>
                </div>
                {operadorSelecionado.nascimento && (
                  <div className="flex items-center gap-2">
                    <MdCalendarToday className="w-4 h-4 text-white/60" />
                    <div>
                      <p className="text-white/60 text-xs mb-1">Data de Nascimento</p>
                      <p className="text-white font-medium">{formatarData(operadorSelecionado.nascimento)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contato */}
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MdEmail className="w-5 h-5 text-fta-green" />
                Contato
              </h3>
              <div className="space-y-3">
                {operadorSelecionado.email && (
                  <div className="flex items-center gap-3">
                    <MdEmail className="w-5 h-5 text-white/60 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/60 text-xs mb-1">E-mail</p>
                      <a 
                        href={`mailto:${operadorSelecionado.email}`}
                        className="text-white font-medium hover:text-fta-green transition-colors break-all"
                      >
                        {operadorSelecionado.email}
                      </a>
                    </div>
                  </div>
                )}
                {operadorSelecionado.telefone && (
                  <div className="flex items-center gap-3">
                    <MdPhone className="w-5 h-5 text-white/60 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/60 text-xs mb-1">Telefone</p>
                      <a 
                        href={`tel:${operadorSelecionado.telefone.replace(/\D/g, '')}`}
                        className="text-white font-medium hover:text-fta-green transition-colors"
                      >
                        {operadorSelecionado.telefone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Estatísticas */}
            {operadorSelecionado.lab_fta !== undefined && (
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Estatísticas</h3>
                <div>
                  <p className="text-white/60 text-xs mb-1">Laboratórios FTA</p>
                  <p className="text-fta-green font-semibold text-2xl">
                    {operadorSelecionado.lab_fta || 0}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detalhes da Anotação */}
        {anotacaoSelecionada && !operadorSelecionado && (
          <div className="space-y-6">
            {/* Tipo e Status */}
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {anotacaoSelecionada.e_transgressao && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                    <MdWarning className="w-4 h-4" />
                    TRANSTREGRESSÃO
                  </span>
                )}
                {anotacaoSelecionada.tipo_transgressao && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/20">
                    {anotacaoSelecionada.tipo_transgressao.nome || anotacaoSelecionada.tipo_transgressao_nome}
                  </span>
                )}
              </div>
              {anotacaoSelecionada.titulo && (
                <h3 className="text-xl font-semibold text-white mb-2">{anotacaoSelecionada.titulo}</h3>
              )}
            </div>

            {/* Informações do Operador (se houver) */}
            {anotacaoSelecionada.operadores && anotacaoSelecionada.operador_id && (
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MdPerson className="w-5 h-5 text-fta-green" />
                  Operador Responsável
                </h3>
                <div className="space-y-2">
                  <p className="text-white font-medium">
                    {anotacaoSelecionada.operadores.nome}
                    {anotacaoSelecionada.operadores.codinome && (
                      <span className="text-fta-green ml-2">({anotacaoSelecionada.operadores.codinome})</span>
                    )}
                  </p>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const { data: operadorCompleto } = await supabase
                        .from('operadores')
                        .select('*')
                        .eq('id', anotacaoSelecionada.operador_id)
                        .single()
                      
                      if (operadorCompleto) {
                        setOperadorSelecionado(operadorCompleto)
                        setAnotacaoSelecionada(null)
                      }
                    }}
                    className="text-xs"
                  >
                    Ver Detalhes do Operador
                  </Button>
                </div>
              </div>
            )}

            {/* Detalhes do Evento (se for transgressão) */}
            {anotacaoSelecionada.e_transgressao && (
              <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Detalhes do Evento</h3>
                
                {anotacaoSelecionada.data_evento && (
                  <div className="flex items-start gap-3">
                    <MdEvent className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-white/60 text-xs mb-1">Data do Evento</p>
                      <p className="text-white font-medium">{formatarData(anotacaoSelecionada.data_evento)}</p>
                    </div>
                  </div>
                )}
                
                {anotacaoSelecionada.nome_evento && (
                  <div className="flex items-start gap-3">
                    <MdTitle className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-white/60 text-xs mb-1">Nome do Evento</p>
                      <p className="text-white font-medium">{anotacaoSelecionada.nome_evento}</p>
                    </div>
                  </div>
                )}
                
                {anotacaoSelecionada.local_evento && (
                  <div className="flex items-start gap-3">
                    <MdLocationOn className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-white/60 text-xs mb-1">Local do Evento</p>
                      <p className="text-white font-medium">{anotacaoSelecionada.local_evento}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Descrição */}
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Descrição</h3>
              <p className="text-white/80 text-sm whitespace-pre-wrap">
                {anotacaoSelecionada.descricao && anotacaoSelecionada.descricao.includes('Observação:')
                  ? anotacaoSelecionada.descricao.split('Observação:')[1]?.trim() || anotacaoSelecionada.descricao
                  : anotacaoSelecionada.descricao}
              </p>
            </div>

            {/* Informações de Criação */}
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Informações</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-white/60 text-xs mb-1">Criado por</p>
                  <p className="text-white">{anotacaoSelecionada.criado_por_nome || 'Desconhecido'}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-1">Data de criação</p>
                  <p className="text-white">{new Date(anotacaoSelecionada.created_at || '').toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Sideover>
    </div>
  )
}

