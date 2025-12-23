import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/UI/Button'
import { Input } from '../components/UI/Input'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/UI/Table'
import { MdContentCopy, MdDelete, MdCheckCircle, MdCancel, MdLink } from 'react-icons/md'

export const AdminPanel: React.FC = () => {
  const { user } = useAuth()
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [linkCriado, setLinkCriado] = useState<string>('')
  const [nomeLink, setNomeLink] = useState<string>('')

  useEffect(() => {
    carregarLinks()
  }, [])

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
      }
    } catch (error: any) {
      console.error('Erro ao carregar links:', error.message)
    } finally {
      setLoading(false)
    }
  }

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
      alert(`Link ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`)
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
      
      alert('Link excluído com sucesso!')
      await carregarLinks()
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
          <h2 className="text-2xl font-semibold mb-4 text-fta-green">Links de Equipes Criados</h2>
          
          {links.length === 0 ? (
            <p className="text-white/60">Nenhum link criado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableHeaderCell>Nome</TableHeaderCell>
                <TableHeaderCell>Link</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Criado em</TableHeaderCell>
                <TableHeaderCell>Ações</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
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
