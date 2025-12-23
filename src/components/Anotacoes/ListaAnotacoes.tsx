import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Anotacao, TipoTransgressao } from '../../lib/types'
import { Button } from '../UI/Button'
import { Input } from '../UI/Input'
import { MdDelete } from 'react-icons/md'

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
  const [tiposTransgressoes, setTiposTransgressoes] = useState<TipoTransgressao[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [eTransgressao, setETransgressao] = useState(false)
  const [tipoTransgressaoId, setTipoTransgressaoId] = useState<string>('')
  const [outrosTitulo, setOutrosTitulo] = useState('')
  const [dataEvento, setDataEvento] = useState('')
  const [nomeEvento, setNomeEvento] = useState('')
  const [localEvento, setLocalEvento] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [criando, setCriando] = useState(false)

  useEffect(() => {
    carregarTiposTransgressoes()
    carregarAnotacoes()
  }, [tipo, equipeId, operadorId])

  const carregarTiposTransgressoes = async () => {
    try {
      console.log('Carregando tipos de transgressões...')
      
      // Primeiro tentar sem filtro de ativo para ver todos
      let query = supabase
        .from('tipos_transgressoes')
        .select('*')
        .order('nome')

      const { data, error } = await query

      if (error) {
        console.error('Erro ao carregar tipos de transgressões:', error)
        console.error('Código do erro:', error.code)
        console.error('Mensagem:', error.message)
        console.error('Detalhes:', error.details)
        throw error
      }

      console.log('Tipos de transgressões carregados:', data)
      
      // Filtrar apenas os ativos no frontend
      const tiposAtivos = (data || []).filter(tipo => tipo.ativo !== false)
      console.log('Tipos ativos filtrados:', tiposAtivos)
      
      setTiposTransgressoes(tiposAtivos)
      
      if (tiposAtivos.length === 0) {
        console.warn('Nenhum tipo de transgressão ativo encontrado. Verifique se os dados foram inseridos no banco.')
      }
    } catch (error: any) {
      console.error('Erro ao carregar tipos de transgressões:', error)
      alert('Erro ao carregar tipos de transgressões: ' + (error.message || 'Erro desconhecido'))
      setTiposTransgressoes([])
    }
  }

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
        
        // Buscar tipos de transgressões se houver
        const tipoTransgressaoIds = [...new Set(data.filter((anot: any) => anot.tipo_transgressao_id).map((anot: any) => anot.tipo_transgressao_id))]
        let tiposMap = new Map()
        
        if (tipoTransgressaoIds.length > 0) {
          const { data: tiposData } = await supabase
            .from('tipos_transgressoes')
            .select('id, nome, descricao')
            .in('id', tipoTransgressaoIds)
          
          if (tiposData) {
            tiposMap = new Map(tiposData.map(t => [t.id, t]))
          }
        }
        
        // Mapear anotações com email do criador e tipo de transgressão
        const anotacoesComCriador = data.map((anot: any) => ({
          ...anot,
          criado_por_nome: usersMap.get(anot.criado_por) || 'Desconhecido',
          tipo_transgressao: anot.tipo_transgressao_id ? tiposMap.get(anot.tipo_transgressao_id) || null : null
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
    if (eTransgressao) {
      // Validações para transgressão
      if (!tipoTransgressaoId) {
        alert('Por favor, selecione um tipo de transgressão!')
        return
      }
      if (!dataEvento) {
        alert('Por favor, informe a data do evento!')
        return
      }
      if (!nomeEvento.trim()) {
        alert('Por favor, informe o nome do evento!')
        return
      }
      if (!localEvento.trim()) {
        alert('Por favor, informe o local do evento!')
        return
      }
    } else {
      if (!descricao.trim()) {
        alert('Por favor, preencha a descrição da anotação!')
        return
      }
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
        descricao: eTransgressao 
          ? `Data: ${dataEvento} | Evento: ${nomeEvento.trim()} | Local: ${localEvento.trim()}`
          : descricao.trim(),
        criado_por: user.id,
        titulo: eTransgressao 
          ? (tipoTransgressaoId === 'outros' ? outrosTitulo.trim() : tiposTransgressoes.find(t => t.id === tipoTransgressaoId)?.nome || '')
          : (titulo.trim() || null),
        e_transgressao: eTransgressao
      }

      if (eTransgressao) {
        // Se for "Outros", não vincular a um tipo específico
        if (tipoTransgressaoId !== 'outros') {
          anotacaoData.tipo_transgressao_id = tipoTransgressaoId
        }
        anotacaoData.data_evento = dataEvento
        anotacaoData.nome_evento = nomeEvento.trim()
        anotacaoData.local_evento = localEvento.trim()
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
          ...anotacaoData,
          tipo: 'equipe' as const,
          equipe_id: operadorEquipeId,
          operador_id: null,
          descricao: `[Operador] ${anotacaoData.descricao}`
        }

        await supabase
          .from('anotacoes')
          .insert([anotacaoEquipeData])
      }

      // Limpar formulário
      setTitulo('')
      setDescricao('')
      setETransgressao(false)
      setTipoTransgressaoId('')
      setOutrosTitulo('')
      setDataEvento('')
      setNomeEvento('')
      setLocalEvento('')
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

  const formatarDataEvento = (data: string) => {
    if (!data) return '-'
    return new Date(data).toLocaleDateString('pt-BR')
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
            {/* Toggle Transgressão/Anotação */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setETransgressao(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !eTransgressao
                    ? 'bg-fta-green text-white'
                    : 'bg-fta-gray text-white/60 hover:text-white'
                }`}
              >
                Anotação Normal
              </button>
              <button
                onClick={() => setETransgressao(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  eTransgressao
                    ? 'bg-red-500 text-white'
                    : 'bg-fta-gray text-white/60 hover:text-white'
                }`}
              >
                Transgressão
              </button>
            </div>

            {eTransgressao ? (
              /* Formulário de Transgressão */
              <>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Tipo de Transgressão *
                  </label>
                  <select
                    value={tipoTransgressaoId || ''}
                    onChange={(e) => {
                      setTipoTransgressaoId(e.target.value)
                      setOutrosTitulo('')
                    }}
                    className="w-full px-4 py-2 bg-fta-gray border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
                    required
                  >
                    <option value="">Selecione um tipo...</option>
                    {tiposTransgressoes.length > 0 ? (
                      tiposTransgressoes.map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nome}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Carregando tipos...</option>
                    )}
                    <option value="outros">Outros</option>
                  </select>
                  {tiposTransgressoes.length === 0 && (
                    <p className="text-yellow-400 text-xs mt-1">
                      Nenhum tipo de transgressão encontrado. Verifique se os dados foram inseridos no banco.
                    </p>
                  )}
                </div>

                {tipoTransgressaoId === 'outros' && (
                  <Input
                    label="Especificar Tipo de Transgressão *"
                    value={outrosTitulo}
                    onChange={(e) => setOutrosTitulo(e.target.value)}
                    placeholder="Digite o tipo de transgressão"
                    required
                  />
                )}

                <Input
                  label="Data do Evento *"
                  type="date"
                  value={dataEvento}
                  onChange={(e) => setDataEvento(e.target.value)}
                  required
                />

                <Input
                  label="Nome do Evento *"
                  value={nomeEvento}
                  onChange={(e) => setNomeEvento(e.target.value)}
                  placeholder="Ex: Jogo de Airsoft, Treinamento, etc."
                  required
                />

                <Input
                  label="Local do Evento *"
                  value={localEvento}
                  onChange={(e) => setLocalEvento(e.target.value)}
                  placeholder="Ex: Campo XYZ, Local ABC"
                  required
                />
              </>
            ) : (
              /* Formulário de Anotação Normal */
              <>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Título (opcional)
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Observação importante, Nota sobre comportamento, etc."
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
              </>
            )}

            {tipo === 'operador' && operadorEquipeId && (
              <div className="bg-blue-500/20 border border-blue-500/50 p-3 rounded-lg">
                <p className="text-blue-400 text-xs">
                  Esta anotação será automaticamente copiada para a ficha da equipe.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={criarAnotacao} disabled={criando} className="flex-1">
                {criando ? 'Salvando...' : 'Salvar ' + (eTransgressao ? 'Transgressão' : 'Anotação')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMostrarForm(false)
                  setTitulo('')
                  setDescricao('')
                  setETransgressao(false)
                  setTipoTransgressaoId('')
                  setOutrosTitulo('')
                  setDataEvento('')
                  setNomeEvento('')
                  setLocalEvento('')
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
              className={`p-4 rounded-lg border ${
                anotacao.e_transgressao
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-fta-dark border-white/10'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  {anotacao.e_transgressao && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                        TRANSTREGRESSÃO
                      </span>
                      {anotacao.tipo_transgressao && (
                        <span className="px-2 py-1 bg-white/10 rounded text-xs">
                          {anotacao.tipo_transgressao.nome}
                        </span>
                      )}
                    </div>
                  )}
                  {anotacao.titulo && (
                    <h4 className="font-semibold text-white mb-1">{anotacao.titulo}</h4>
                  )}
                  <p className="text-white/80 text-sm whitespace-pre-wrap">{anotacao.descricao}</p>
                  
                  {/* Informações adicionais de transgressão */}
                  {anotacao.e_transgressao && (
                    <div className="mt-2 space-y-1 text-xs text-white/60">
                      {anotacao.data_evento && (
                        <div>Data: {formatarDataEvento(anotacao.data_evento)}</div>
                      )}
                      {anotacao.nome_evento && (
                        <div>Evento: {anotacao.nome_evento}</div>
                      )}
                      {anotacao.local_evento && (
                        <div>Local: {anotacao.local_evento}</div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => excluirAnotacao(anotacao.id!)}
                  className="text-red-400 hover:text-red-300 ml-2 p-1"
                  title="Excluir anotação"
                >
                  <MdDelete className="w-4 h-4" />
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
