import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Equipe, CadastroLink } from '../lib/types'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/UI/Table'
import { Button } from '../components/UI/Button'
import { Input } from '../components/UI/Input'
import { Sideover } from '../components/UI/Sideover'
import { useAuth } from '../hooks/useAuth'
import { ListaAnotacoes } from '../components/Anotacoes/ListaAnotacoes'

export const ListaEquipes: React.FC = () => {
  const { user, isAdmin } = useAuth()
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [loading, setLoading] = useState(true)
  const [equipeSelecionada, setEquipeSelecionada] = useState<Equipe | null>(null)
  const [sideoverAberto, setSideoverAberto] = useState(false)
  const [linksEquipe, setLinksEquipe] = useState<CadastroLink[]>([])
  const [carregandoLinks, setCarregandoLinks] = useState(false)
  const [nomeLinkOperador, setNomeLinkOperador] = useState<string>('')
  const [mostrarFormLink, setMostrarFormLink] = useState(false)
  const [editando, setEditando] = useState(false)
  const [formEditEquipe, setFormEditEquipe] = useState<Partial<Equipe>>({})
  const [salvando, setSalvando] = useState(false)
  const [ordemData, setOrdemData] = useState<'crescente' | 'decrescente' | null>(null)


  useEffect(() => {
    if (equipeSelecionada) {
      carregarLinksEquipe()
    }
  }, [equipeSelecionada])

  const carregarEquipes = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('equipes')
        .select('*')
      
      // Ordenação
      if (ordemData === 'crescente') {
        query = query.order('membro_desde', { ascending: true })
      } else if (ordemData === 'decrescente') {
        query = query.order('membro_desde', { ascending: false })
      } else {
        query = query.order('nome')
      }
      
      const { data, error } = await query
      
      if (error) throw error
      if (data) setEquipes(data)
    } catch (error: any) {
      console.error('Erro ao carregar equipes:', error.message)
      alert('Erro ao carregar equipes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarEquipes()
  }, [ordemData])

  const carregarLinksEquipe = async () => {
    if (!equipeSelecionada) return
    
    try {
      setCarregandoLinks(true)
      const { data, error } = await supabase
        .from('cadastro_links')
        .select('*')
        .eq('equipe_id', equipeSelecionada.id)
        .eq('tipo', 'operador')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setLinksEquipe(data)
    } catch (error: any) {
      console.error('Erro ao carregar links:', error.message)
    } finally {
      setCarregandoLinks(false)
    }
  }

  const abrirSideover = (equipe: Equipe) => {
    setEquipeSelecionada(equipe)
    setEditando(false)
    setFormEditEquipe({})
    setSideoverAberto(true)
  }

  const iniciarEdicao = () => {
    if (equipeSelecionada) {
      setFormEditEquipe({
        nome: equipeSelecionada.nome,
        total_membros: equipeSelecionada.total_membros,
        ativos: equipeSelecionada.ativos,
        capitao: equipeSelecionada.capitao,
        cidade: equipeSelecionada.cidade,
        estado: equipeSelecionada.estado,
        membro_desde: equipeSelecionada.membro_desde,
        historico_transgressoes: equipeSelecionada.historico_transgressoes || '',
        graduacao_fta: equipeSelecionada.graduacao_fta,
        instagram: equipeSelecionada.instagram || ''
      })
      setEditando(true)
    }
  }

  const cancelarEdicao = () => {
    setEditando(false)
    setFormEditEquipe({})
  }

  const salvarEdicao = async () => {
    if (!equipeSelecionada?.id) return

    try {
      setSalvando(true)
      
      const dadosAtualizados: Partial<Equipe> = {
        nome: formEditEquipe.nome,
        total_membros: formEditEquipe.total_membros,
        ativos: formEditEquipe.ativos,
        capitao: formEditEquipe.capitao,
        cidade: formEditEquipe.cidade,
        estado: formEditEquipe.estado,
        membro_desde: formEditEquipe.membro_desde,
        historico_transgressoes: formEditEquipe.historico_transgressoes || undefined,
        graduacao_fta: formEditEquipe.graduacao_fta,
        instagram: formEditEquipe.instagram || undefined
      }

      const { error } = await supabase
        .from('equipes')
        .update(dadosAtualizados)
        .eq('id', equipeSelecionada.id)

      if (error) throw error

      alert('Equipe atualizada com sucesso!')
      await carregarEquipes()
      
      // Atualizar equipe selecionada
      const { data: equipeAtualizada } = await supabase
        .from('equipes')
        .select('*')
        .eq('id', equipeSelecionada.id)
        .single()

      if (equipeAtualizada) {
        setEquipeSelecionada(equipeAtualizada)
      }
      
      setEditando(false)
      setFormEditEquipe({})
    } catch (error: any) {
      console.error('Erro ao atualizar equipe:', error)
      alert('Erro ao atualizar equipe: ' + error.message)
    } finally {
      setSalvando(false)
    }
  }

  const criarLinkOperador = async () => {
    if (!equipeSelecionada) return

    try {
      if (!user) {
        alert('Você precisa estar logado!')
        return
      }

      if (!nomeLinkOperador.trim()) {
        alert('Por favor, informe um nome para identificar o link!')
        return
      }

      const token = crypto.randomUUID()
      const { error } = await supabase
        .from('cadastro_links')
        .insert([{
          token,
          tipo: 'operador',
          equipe_id: equipeSelecionada.id,
          criado_por: user.id,
          usado: false,
          ativo: true,
          nome: nomeLinkOperador.trim()
        }])

      if (error) throw error

      // Recarregar links
      await carregarLinksEquipe()
      
      // Copiar link automaticamente
      const url = `${window.location.origin}/cadastro/operador/${token}`
      navigator.clipboard.writeText(url)
      alert('Link criado e copiado para área de transferência!')
      
      // Limpar e fechar formulário
      setNomeLinkOperador('')
      setMostrarFormLink(false)
    } catch (error: any) {
      alert('Erro ao criar link: ' + error.message)
    }
  }

  const toggleLinkAtivo = async (linkId: string, ativoAtual: boolean) => {
    try {
      const { error } = await supabase
        .from('cadastro_links')
        .update({ ativo: !ativoAtual })
        .eq('id', linkId)

      if (error) throw error
      await carregarLinksEquipe()
    } catch (error: any) {
      alert('Erro ao atualizar link: ' + error.message)
    }
  }

  const excluirEquipe = async (equipeId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta equipe? Esta ação não pode ser desfeita!')) {
      return
    }

    try {
      const { error } = await supabase
        .from('equipes')
        .delete()
        .eq('id', equipeId)

      if (error) {
        console.error('Erro detalhado:', error)
        throw error
      }
      
      alert('Equipe excluída com sucesso!')
      await carregarEquipes()
      
      if (equipeSelecionada?.id === equipeId) {
        setSideoverAberto(false)
        setEquipeSelecionada(null)
        setLinksEquipe([])
      }
    } catch (error: any) {
      console.error('Erro ao excluir equipe:', error)
      alert('Erro ao excluir equipe: ' + (error.message || 'Erro desconhecido'))
    }
  }

  const toggleEquipeAtivo = async (equipeId: string, ativoAtual: boolean) => {
    try {
      const novoStatus = !ativoAtual
      const { error } = await supabase
        .from('equipes')
        .update({ ativo: novoStatus })
        .eq('id', equipeId)

      if (error) {
        console.error('Erro detalhado:', error)
        throw error
      }
      
      await carregarEquipes()
      
      if (equipeSelecionada?.id === equipeId) {
        setEquipeSelecionada({ ...equipeSelecionada, ativo: novoStatus })
      }
      
      alert(`Equipe ${novoStatus ? 'ativada' : 'desativada'} com sucesso!`)
    } catch (error: any) {
      console.error('Erro ao atualizar equipe:', error)
      alert('Erro ao atualizar equipe: ' + (error.message || 'Erro desconhecido'))
    }
  }

  const formatarData = (data: string) => {
    if (!data) return '-'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const formatarLink = (token: string) => {
    return `${window.location.origin}/cadastro/operador/${token}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fta-dark text-white p-8 flex items-center justify-center">
        <div className="text-xl">Carregando equipes...</div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-fta-dark text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Equipes Cadastradas</h1>
            <div className="flex items-center gap-4">
              <label className="text-white/80 text-sm">Ordenar por data de entrada:</label>
              <select
                value={ordemData || ''}
                onChange={(e) => {
                  const valor = e.target.value
                  setOrdemData(valor ? (valor as 'crescente' | 'decrescente') : null)
                }}
                className="px-4 py-2 bg-fta-gray border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
              >
                <option value="">Padrão (nome)</option>
                <option value="crescente">Mais antigas primeiro</option>
                <option value="decrescente">Mais recentes primeiro</option>
              </select>
            </div>
          </div>

          {equipes.length === 0 ? (
            <div className="bg-fta-gray/50 p-12 rounded-xl border border-white/10 text-center">
              <p className="text-white/60 text-lg mb-4">Nenhuma equipe cadastrada ainda.</p>
              <p className="text-white/40 text-sm">Use um link de cadastro de equipe para começar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableHeaderCell>Nome</TableHeaderCell>
                <TableHeaderCell>Capitão</TableHeaderCell>
                <TableHeaderCell>Total Membros</TableHeaderCell>
                <TableHeaderCell>Ativos</TableHeaderCell>
                <TableHeaderCell>Cidade / Estado</TableHeaderCell>
                <TableHeaderCell>Graduação FTA</TableHeaderCell>
                <TableHeaderCell>Membro Desde</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                {isAdmin && <TableHeaderCell>Ações</TableHeaderCell>}
              </TableHeader>
              <TableBody>
                {equipes.map((equipe) => (
                  <TableRow key={equipe.id}>
                    <TableCell className="font-medium">{equipe.nome}</TableCell>
                    <TableCell>{equipe.capitao}</TableCell>
                    <TableCell>{equipe.total_membros}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-fta-green/20 text-fta-green rounded text-xs font-medium">
                        {equipe.ativos}
                      </span>
                    </TableCell>
                    <TableCell>{equipe.cidade} / {equipe.estado}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-white/10 rounded text-xs">
                        {equipe.graduacao_fta}
                      </span>
                    </TableCell>
                    <TableCell>{formatarData(equipe.membro_desde)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        equipe.ativo !== false 
                          ? 'bg-fta-green/20 text-fta-green' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {equipe.ativo !== false ? 'Ativa' : 'Desativada'}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              abrirSideover(equipe)
                            }}
                            className="text-fta-green hover:text-fta-green/80 transition-colors p-2"
                            title="Ver detalhes e criar link"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleEquipeAtivo(equipe.id!, equipe.ativo !== false)
                            }}
                            className={`p-2 transition-colors ${
                              equipe.ativo !== false
                                ? 'text-yellow-400 hover:text-yellow-300'
                                : 'text-fta-green hover:text-fta-green/80'
                            }`}
                            title={equipe.ativo !== false ? 'Desativar equipe' : 'Ativar equipe'}
                          >
                            {equipe.ativo !== false ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              excluirEquipe(equipe.id!)
                            }}
                            className="text-red-400 hover:text-red-300 transition-colors p-2"
                            title="Excluir equipe"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-4 text-white/60 text-sm">
            Total: {equipes.length} equipe{equipes.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Sideover para gerenciar equipe */}
      <Sideover
        isOpen={sideoverAberto}
        onClose={() => {
          setSideoverAberto(false)
          setEquipeSelecionada(null)
          setLinksEquipe([])
          setMostrarFormLink(false)
          setNomeLinkOperador('')
        }}
        title={equipeSelecionada ? `Equipe: ${equipeSelecionada.nome}` : 'Detalhes da Equipe'}
      >
        {equipeSelecionada && (
          <div className="space-y-6">
            {/* Botão de Editar */}
            {isAdmin && !editando && (
              <div className="flex justify-end">
                <Button onClick={iniciarEdicao}>
                  Editar Equipe
                </Button>
              </div>
            )}

            {/* Detalhes da Equipe ou Formulário de Edição */}
            {editando ? (
              <div className="bg-fta-gray p-4 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold mb-4 text-fta-green">Editar Equipe</h3>
                <div className="space-y-4">
                  <Input
                    label="Nome da Equipe *"
                    value={formEditEquipe.nome || ''}
                    onChange={(e) => setFormEditEquipe({ ...formEditEquipe, nome: e.target.value })}
                    required
                  />
                  <Input
                    label="Capitão *"
                    value={formEditEquipe.capitao || ''}
                    onChange={(e) => setFormEditEquipe({ ...formEditEquipe, capitao: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Total de Membros *"
                      type="number"
                      min="0"
                      value={formEditEquipe.total_membros || 0}
                      onChange={(e) => setFormEditEquipe({ ...formEditEquipe, total_membros: parseInt(e.target.value) || 0 })}
                      required
                    />
                    <Input
                      label="Membros Ativos *"
                      type="number"
                      min="0"
                      value={formEditEquipe.ativos || 0}
                      onChange={(e) => setFormEditEquipe({ ...formEditEquipe, ativos: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Cidade *"
                      value={formEditEquipe.cidade || ''}
                      onChange={(e) => setFormEditEquipe({ ...formEditEquipe, cidade: e.target.value })}
                      required
                    />
                    <Input
                      label="Estado *"
                      value={formEditEquipe.estado || ''}
                      onChange={(e) => setFormEditEquipe({ ...formEditEquipe, estado: e.target.value })}
                      required
                    />
                  </div>
                  <Input
                    label="Data de Membro Desde *"
                    type="date"
                    value={formEditEquipe.membro_desde || ''}
                    onChange={(e) => setFormEditEquipe({ ...formEditEquipe, membro_desde: e.target.value })}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Graduação FTA *
                    </label>
                    <select
                      value={formEditEquipe.graduacao_fta || 'Cadete'}
                      onChange={(e) => setFormEditEquipe({ ...formEditEquipe, graduacao_fta: e.target.value as any })}
                      className="w-full px-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
                    >
                      <option value="Cadete">Cadete</option>
                      <option value="Efetivo">Efetivo</option>
                      <option value="Graduado">Graduado</option>
                      <option value="Estado Maior">Estado Maior</option>
                      <option value="Conselheiro">Conselheiro</option>
                    </select>
                  </div>
                  <Input
                    label="Link do Instagram"
                    type="url"
                    value={formEditEquipe.instagram || ''}
                    onChange={(e) => setFormEditEquipe({ ...formEditEquipe, instagram: e.target.value })}
                  />
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Histórico de Transgressões
                    </label>
                    <textarea
                      value={formEditEquipe.historico_transgressoes || ''}
                      onChange={(e) => setFormEditEquipe({ ...formEditEquipe, historico_transgressoes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={salvarEdicao} disabled={salvando} className="flex-1">
                      {salvando ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                    <Button variant="outline" onClick={cancelarEdicao} className="flex-1">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-fta-gray p-4 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold mb-4 text-fta-green">Informações da Equipe</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                  <span className="text-white/60">Capitão:</span>
                  <p className="text-white font-medium">{equipeSelecionada.capitao}</p>
                </div>
                <div>
                  <span className="text-white/60">Cidade/Estado:</span>
                  <p className="text-white font-medium">{equipeSelecionada.cidade} / {equipeSelecionada.estado}</p>
                </div>
                <div>
                  <span className="text-white/60">Total de Membros:</span>
                  <p className="text-white font-medium">{equipeSelecionada.total_membros}</p>
                </div>
                <div>
                  <span className="text-white/60">Membros Ativos:</span>
                  <p className="text-white font-medium">{equipeSelecionada.ativos}</p>
                </div>
                <div>
                  <span className="text-white/60">Graduação FTA:</span>
                  <p className="text-white font-medium">{equipeSelecionada.graduacao_fta}</p>
                </div>
                <div>
                  <span className="text-white/60">Membro Desde:</span>
                  <p className="text-white font-medium">{formatarData(equipeSelecionada.membro_desde)}</p>
                </div>
                {equipeSelecionada.instagram && (
                  <div className="col-span-2">
                    <span className="text-white/60">Instagram:</span>
                    <p className="text-white font-medium">
                      <a 
                        href={equipeSelecionada.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-fta-green hover:text-fta-green/80 underline break-all"
                      >
                        {equipeSelecionada.instagram}
                      </a>
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-white/60">Status:</span>
                  <p className={`font-medium ${
                    equipeSelecionada.ativo !== false ? 'text-fta-green' : 'text-red-400'
                  }`}>
                    {equipeSelecionada.ativo !== false ? 'Ativa' : 'Desativada'}
                  </p>
                  </div>
                </div>
              </div>
            )}

            {/* Links de Operador Criados */}
            {!editando && (
              <div className="bg-fta-gray p-4 rounded-lg border border-white/10">
                <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-fta-green">Links de Cadastro de Operador</h3>
                <Button onClick={() => setMostrarFormLink(!mostrarFormLink)}>
                  {mostrarFormLink ? 'Cancelar' : '+ Novo Link'}
                </Button>
              </div>

              {mostrarFormLink && (
                <div className="mb-4 p-4 bg-fta-dark rounded-lg border border-fta-green/30">
                  <Input
                    label="Nome do Link (ex: Link para Operador João, Cadastro SP, etc.)"
                    value={nomeLinkOperador}
                    onChange={(e) => setNomeLinkOperador(e.target.value)}
                    placeholder="Ex: Link para Operador João"
                    required
                  />
                  <div className="mt-4 flex gap-3">
                    <Button onClick={criarLinkOperador} className="flex-1">
                      Criar Link
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setMostrarFormLink(false)
                        setNomeLinkOperador('')
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {carregandoLinks ? (
                <p className="text-white/60 text-sm">Carregando links...</p>
              ) : linksEquipe.length === 0 ? (
                <p className="text-white/60 text-sm">Nenhum link criado ainda.</p>
              ) : (
                <div className="space-y-3">
                  {linksEquipe.map((link) => (
                    <div
                      key={link.id}
                      className={`bg-fta-dark p-3 rounded border ${
                        link.ativo !== false ? 'border-fta-green/30' : 'border-red-500/30 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="mb-2">
                            <p className="font-medium text-white text-sm">
                              {link.nome || <span className="text-white/40 italic">Sem nome</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded ${
                              link.ativo !== false
                                ? 'bg-fta-green/20 text-fta-green'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {link.ativo !== false ? 'Ativo' : 'Desativado'}
                            </span>
                            {link.ativo !== false && (
                              <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                                Permite múltiplos cadastros
                              </span>
                            )}
                            {link.created_at && (
                              <span className="text-white/40 text-xs">
                                {formatarData(link.created_at)}
                              </span>
                            )}
                          </div>
                          <p className="text-fta-green text-xs break-all font-mono mb-1">
                            {formatarLink(link.token)}
                          </p>
                          <p className="text-white/60 text-xs">
                            Vários operadores podem usar este link simultaneamente
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(formatarLink(link.token))
                              alert('Link copiado!')
                            }}
                            className="text-white/60 hover:text-white p-1"
                            title="Copiar link"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => toggleLinkAtivo(link.id!, link.ativo !== false)}
                            className={`p-1 ${
                              link.ativo !== false
                                ? 'text-yellow-400 hover:text-yellow-300'
                                : 'text-fta-green hover:text-fta-green/80'
                            }`}
                            title={link.ativo !== false ? 'Desativar link' : 'Ativar link'}
                          >
                            {link.ativo !== false ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            )}

            {/* Anotações da Equipe */}
            {!editando && isAdmin && (
              <div className="bg-fta-gray p-4 rounded-lg border border-white/10">
                <ListaAnotacoes
                  tipo="equipe"
                  equipeId={equipeSelecionada.id}
                />
              </div>
            )}
          </div>
        )}
      </Sideover>
    </>
  )
}
