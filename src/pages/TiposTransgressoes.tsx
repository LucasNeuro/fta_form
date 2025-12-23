import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TipoTransgressao } from '../lib/types'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/UI/Table'
import { Button } from '../components/UI/Button'
import { Input } from '../components/UI/Input'
import { useAuth } from '../hooks/useAuth'
import { MdDelete, MdEdit, MdCheckCircle, MdCancel } from 'react-icons/md'

export const TiposTransgressoes: React.FC = () => {
  const { user } = useAuth()
  const [tipos, setTipos] = useState<TipoTransgressao[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(false)
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoTransgressao | null>(null)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarTipos()
  }, [])

  const carregarTipos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tipos_transgressoes')
        .select('*')
        .order('nome')

      if (error) throw error
      if (data) setTipos(data)
    } catch (error: any) {
      console.error('Erro ao carregar tipos:', error.message)
      alert('Erro ao carregar tipos de transgressões: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const iniciarEdicao = (tipo: TipoTransgressao) => {
    setTipoSelecionado(tipo)
    setNome(tipo.nome)
    setDescricao(tipo.descricao || '')
    setEditando(true)
    setMostrarForm(true)
  }

  const cancelarEdicao = () => {
    setEditando(false)
    setTipoSelecionado(null)
    setNome('')
    setDescricao('')
    setMostrarForm(false)
  }

  const salvarTipo = async () => {
    if (!nome.trim()) {
      alert('Por favor, informe o nome do tipo de transgressão!')
      return
    }

    if (!user) {
      alert('Você precisa estar logado!')
      return
    }

    try {
      setSalvando(true)

      if (editando && tipoSelecionado?.id) {
        // Atualizar
        const { error } = await supabase
          .from('tipos_transgressoes')
          .update({
            nome: nome.trim(),
            descricao: descricao.trim() || null
          })
          .eq('id', tipoSelecionado.id)

        if (error) throw error
        alert('Tipo de transgressão atualizado com sucesso!')
      } else {
        // Criar novo
        const { error } = await supabase
          .from('tipos_transgressoes')
          .insert([{
            nome: nome.trim(),
            descricao: descricao.trim() || null,
            criado_por: user.id,
            ativo: true
          }])

        if (error) throw error
        alert('Tipo de transgressão criado com sucesso!')
      }

      cancelarEdicao()
      await carregarTipos()
    } catch (error: any) {
      console.error('Erro ao salvar tipo:', error)
      alert('Erro ao salvar tipo de transgressão: ' + error.message)
    } finally {
      setSalvando(false)
    }
  }

  const toggleAtivo = async (tipo: TipoTransgressao) => {
    try {
      const { error } = await supabase
        .from('tipos_transgressoes')
        .update({ ativo: !tipo.ativo })
        .eq('id', tipo.id!)

      if (error) throw error

      await carregarTipos()
      alert(`Tipo ${tipo.ativo ? 'desativado' : 'ativado'} com sucesso!`)
    } catch (error: any) {
      console.error('Erro ao atualizar tipo:', error)
      alert('Erro ao atualizar tipo: ' + error.message)
    }
  }

  const excluirTipo = async (tipo: TipoTransgressao) => {
    if (!confirm(`Tem certeza que deseja excluir o tipo "${tipo.nome}"? Esta ação não pode ser desfeita!`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('tipos_transgressoes')
        .delete()
        .eq('id', tipo.id!)

      if (error) throw error

      alert('Tipo de transgressão excluído com sucesso!')
      await carregarTipos()
    } catch (error: any) {
      console.error('Erro ao excluir tipo:', error)
      alert('Erro ao excluir tipo: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fta-dark text-white p-8 flex items-center justify-center">
        <div className="text-xl">Carregando tipos de transgressões...</div>
      </div>
    )
  }

  return (
    <div className="bg-fta-dark text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Tipos de Transgressões</h1>
          <p className="text-white/60">Gerencie os tipos pré-definidos de transgressões</p>
        </div>

        {/* Formulário */}
        {mostrarForm && (
          <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-fta-green">
              {editando ? 'Editar Tipo de Transgressão' : 'Novo Tipo de Transgressão'}
            </h2>
            <div className="space-y-4">
              <Input
                label="Nome do Tipo *"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Falta sem justificativa"
                required
              />
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição detalhada do tipo de transgressão..."
                  rows={3}
                  className="w-full px-4 py-2 bg-fta-gray border border-fta-green/30 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-fta-green focus:border-fta-green resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={salvarTipo} disabled={salvando} className="flex-1">
                  {salvando ? 'Salvando...' : editando ? 'Atualizar' : 'Criar'}
                </Button>
                <Button variant="outline" onClick={cancelarEdicao} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Botão Novo */}
        {!mostrarForm && (
          <div className="mb-6">
            <Button onClick={() => setMostrarForm(true)}>
              + Novo Tipo de Transgressão
            </Button>
          </div>
        )}

        {/* Tabela */}
        {tipos.length === 0 ? (
          <div className="bg-fta-gray/50 p-12 rounded-xl border border-white/10 text-center">
            <p className="text-white/60 text-lg mb-4">Nenhum tipo de transgressão cadastrado ainda.</p>
            <p className="text-white/40 text-sm">Clique em "Novo Tipo de Transgressão" para começar.</p>
          </div>
        ) : (
          <div className="bg-fta-gray/50 rounded-xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableHeaderCell>Nome</TableHeaderCell>
                <TableHeaderCell>Descrição</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Ações</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {tipos.map((tipo) => (
                  <TableRow key={tipo.id}>
                    <TableCell className="font-medium">{tipo.nome}</TableCell>
                    <TableCell>
                      <div className="max-w-md truncate" title={tipo.descricao || '-'}>
                        {tipo.descricao || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        tipo.ativo
                          ? 'bg-fta-green/20 text-fta-green'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {tipo.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAtivo(tipo)}
                          className={`p-2 rounded transition-colors ${
                            tipo.ativo
                              ? 'text-yellow-400 hover:bg-yellow-400/10'
                              : 'text-fta-green hover:bg-fta-green/10'
                          }`}
                          title={tipo.ativo ? 'Desativar' : 'Ativar'}
                        >
                          {tipo.ativo ? (
                            <MdCancel className="w-5 h-5" />
                          ) : (
                            <MdCheckCircle className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => iniciarEdicao(tipo)}
                          className="p-2 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                          title="Editar"
                        >
                          <MdEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => excluirTipo(tipo)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                          title="Excluir"
                        >
                          <MdDelete className="w-5 h-5" />
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
    </div>
  )
}

