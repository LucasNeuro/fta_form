import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/UI/Button'
import { Input } from '../components/UI/Input'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/UI/Table'
import { MdContentCopy, MdDelete, MdCheckCircle, MdCancel, MdLink, MdSearch, MdFilterList } from 'react-icons/md'

export const AdminPanel: React.FC = () => {
  const { user } = useAuth()
  const [links, setLinks] = useState<any[]>([])
  const [linksFiltrados, setLinksFiltrados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [linkCriado, setLinkCriado] = useState<string>('')
  const [nomeLink, setNomeLink] = useState<string>('')
  const [filtroNome, setFiltroNome] = useState<string>('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos') // 'todos', 'ativo', 'desativado', 'usado'

  useEffect(() => {
    carregarLinks()
  }, [])

  useEffect(() => {
    aplicarFiltros(links, filtroNome, filtroStatus)
  }, [filtroNome, filtroStatus, links])

  const aplicarFiltros = (linksParaFiltrar: any[], nome: string, status: string) => {
    let filtrados = [...linksParaFiltrar]

    // Filtro por nome
    if (nome.trim()) {
      filtrados = filtrados.filter(link => 
        link.nome?.toLowerCase().includes(nome.toLowerCase().trim())
      )
    }

    // Filtro por status
    if (status !== 'todos') {
      filtrados = filtrados.filter(link => {
        if (status === 'usado') {
          return link.usado === true
        } else if (status === 'ativo') {
          return link.ativo !== false && !link.usado
        } else if (status === 'desativado') {
          return link.ativo === false
        }
        return true
      })
    }

    setLinksFiltrados(filtrados)
  }

  const carregarLinks = async () => {
    try {
      setLoading(true)
      const linksRes = await supabase
        .from('cadastro_links')
        .select('*')
        .eq('tipo', 'equipe')
        .order('created_at', { ascending: false })

      if (linksRes.data) {
        setLinks(linksRes.data)
        setLinksFiltrados(linksRes.data)
      }
    } catch (error: any) {
      console.error('Erro ao carregar links:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = (linksParaFiltrar: any[], nome: string, status: string) => {
    let filtrados = [...linksParaFiltrar]

    // Filtro por nome
    if (nome.trim()) {
      filtrados = filtrados.filter(link => 
        link.nome?.toLowerCase().includes(nome.toLowerCase().trim())
      )
    }

    // Filtro por status
    if (status !== 'todos') {
      filtrados = filtrados.filter(link => {
        if (status === 'usado') {
          return link.usado === true
        } else if (status === 'ativo') {
          return link.ativo !== false && !link.usado
        } else if (status === 'desativado') {
          return link.ativo === false
        }
        return true
      })
    }

    setLinksFiltrados(filtrados)
  }

  useEffect(() => {
    aplicarFiltros(links, filtroNome, filtroStatus)
  }, [filtroNome, filtroStatus])

  const criarLinkEquipe = async () => {
    try {
      if (!user) {
        alert('Você precisa estar logado!')
        return
      }

      if (!nomeLink.trim()) {
        alert('Por favor, informe um nome para identificar o link!')
        return
      }

      const token = crypto.randomUUID()
      const { error } = await supabase
        .from('cadastro_links')
        .insert([{
          token,
          tipo: 'equipe',
          criado_por: user.id,
          usado: false,
          ativo: true,
          nome: nomeLink.trim()
        }])

      if (error) throw error

      const url = `${window.location.origin}/cadastro/equipe/${token}`
      setLinkCriado(url)
      
      // Copiar automaticamente
      navigator.clipboard.writeText(url)
      
      // Limpar nome do link
      setNomeLink('')
      
      carregarLinks()
    } catch (error: any) {
      alert('Erro ao criar link: ' + error.message)
    }
  }

  const copiarLink = (token: string, tipo: string) => {
    const url = `${window.location.origin}/cadastro/${tipo}/${token}`
    navigator.clipboard.writeText(url)
    alert('Link copiado para a área de transferência!')
  }

  const toggleLinkAtivo = async (linkId: string, ativoAtual: boolean) => {
    try {
      const novoStatus = !ativoAtual
      const { error } = await supabase
        .from('cadastro_links')
        .update({ ativo: novoStatus })
        .eq('id', linkId)

      if (error) {
        console.error('Erro detalhado:', error)
        throw error
      }
      
      await carregarLinks()
      // Não mostrar alert para não interromper o fluxo
    } catch (error: any) {
      console.error('Erro ao atualizar link:', error)
      alert('Erro ao atualizar link: ' + (error.message || 'Erro desconhecido'))
    }
  }

  const excluirLink = async (linkId: string) => {
    if (!confirm('Tem certeza que deseja excluir este link? Esta ação não pode ser desfeita!')) {
      return
    }

    try {
      const { error } = await supabase
        .from('cadastro_links')
        .delete()
        .eq('id', linkId)

      if (error) {
        console.error('Erro detalhado:', error)
        throw error
      }
      
      await carregarLinks()
      alert('Link excluído com sucesso!')
    } catch (error: any) {
      console.error('Erro ao excluir link:', error)
      alert('Erro ao excluir link: ' + (error.message || 'Erro desconhecido'))
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
          <h1 className="text-4xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-white/60">Gerencie links de cadastro de equipes</p>
        </div>

        {/* Criar Link de Equipe */}
        <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-fta-green">Criar Link de Cadastro de Equipe</h2>
          <p className="text-white/60 mb-4">
            Crie um link único para responsáveis cadastrarem suas equipes.
          </p>

          {linkCriado ? (
            <div className="space-y-4">
              <div className="bg-fta-dark p-4 rounded border border-fta-green/30">
                <p className="text-white/60 text-xs mb-2">Link criado (copiado para área de transferência):</p>
                <p className="text-fta-green text-sm break-all font-mono">{linkCriado}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(linkCriado)
                    alert('Link copiado novamente!')
                  }}
                  className="flex-1"
                >
                  Copiar Link Novamente
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setLinkCriado('')
                    setNomeLink('')
                  }}
                  className="flex-1"
                >
                  Criar Novo Link
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Nome do Link (ex: Link para Equipe Alpha, Cadastro SP, etc.)"
                value={nomeLink}
                onChange={(e) => setNomeLink(e.target.value)}
                placeholder="Ex: Link para Equipe Alpha"
                required
              />
              <Button onClick={criarLinkEquipe} className="flex items-center gap-2">
                <MdLink className="w-5 h-5" />
                Gerar Link de Cadastro de Equipe
              </Button>
            </div>
          )}
        </div>

        {/* Lista de Links */}
        <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-fta-green">Links de Equipes Criados</h2>
            {links.length > 0 && (
              <span className="text-white/60 text-sm">
                Total: {links.length} | Mostrando: {linksFiltrados.length}
              </span>
            )}
          </div>

          {/* Filtros */}
          {links.length > 0 && (
            <div className="bg-fta-dark p-4 rounded-lg border border-white/10 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <MdFilterList className="w-5 h-5 text-fta-green" />
                <span className="text-white/80 font-medium">Filtros</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Filtro por Nome */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Buscar por Nome
                  </label>
                  <div className="relative">
                    <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                    <input
                      type="text"
                      value={filtroNome}
                      onChange={(e) => setFiltroNome(e.target.value)}
                      placeholder="Digite o nome do link..."
                      className="w-full pl-10 pr-4 py-2 bg-fta-gray border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-fta-green"
                    />
                  </div>
                </div>

                {/* Filtro por Status */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Filtrar por Status
                  </label>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="w-full px-4 py-2 bg-fta-gray border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
                  >
                    <option value="todos">Todos</option>
                    <option value="ativo">Ativos</option>
                    <option value="desativado">Desativados</option>
                    <option value="usado">Usados</option>
                  </select>
                </div>
              </div>

              {/* Botão Limpar Filtros */}
              {(filtroNome.trim() || filtroStatus !== 'todos') && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFiltroNome('')
                      setFiltroStatus('todos')
                    }}
                    className="text-sm"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {links.length === 0 ? (
            <p className="text-white/60">Nenhum link criado ainda.</p>
          ) : linksFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/60 mb-2">Nenhum link encontrado com os filtros aplicados.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setFiltroNome('')
                  setFiltroStatus('todos')
                }}
                className="mt-2"
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHeaderCell>Nome</TableHeaderCell>
                  <TableHeaderCell>Link</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Criado em</TableHeaderCell>
                  <TableHeaderCell>Ações</TableHeaderCell>
                </TableHeader>
                <TableBody>
                  {linksFiltrados.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <span className="font-medium text-white">
                        {link.nome || <span className="text-white/40 italic">Sem nome</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-fta-green text-xs break-all font-mono max-w-xs truncate">
                        {`${window.location.origin}/cadastro/equipe/${link.token}`}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {link.usado ? (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs w-fit">
                            Usado
                          </span>
                        ) : link.ativo !== false ? (
                          <span className="px-2 py-1 bg-fta-green/20 text-fta-green rounded text-xs w-fit">
                            Ativo
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs w-fit">
                            Desativado
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {link.created_at ? new Date(link.created_at).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copiarLink(link.token, link.tipo)}
                          className="p-2 text-fta-green hover:bg-fta-green/10 rounded transition-colors"
                          title="Copiar link"
                        >
                          <MdContentCopy className="w-4 h-4" />
                        </button>
                        {!link.usado && (
                          <button
                            onClick={() => toggleLinkAtivo(link.id, link.ativo !== false)}
                            className={`p-2 rounded transition-colors ${
                              link.ativo !== false
                                ? 'text-yellow-400 hover:bg-yellow-400/10'
                                : 'text-fta-green hover:bg-fta-green/10'
                            }`}
                            title={link.ativo !== false ? 'Desativar' : 'Ativar'}
                          >
                            {link.ativo !== false ? (
                              <MdCancel className="w-4 h-4" />
                            ) : (
                              <MdCheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => excluirLink(link.id)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                          title="Excluir"
                        >
                          <MdDelete className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="mt-6 bg-fta-gray/50 p-4 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold mb-2 text-fta-green">Como Funciona:</h3>
          <ol className="list-decimal list-inside space-y-2 text-white/60 text-sm">
            <li>Crie links de cadastro de equipe e envie para os responsáveis</li>
            <li>Após as equipes serem cadastradas, vá em "Equipes"</li>
            <li>Clique no ícone de visualizar ao lado de cada equipe</li>
            <li>No painel lateral, crie links de cadastro de operadores vinculados àquela equipe</li>
            <li>Envie os links para os operadores se cadastrarem</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
