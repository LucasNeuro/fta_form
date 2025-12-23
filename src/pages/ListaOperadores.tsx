import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Operador } from '../lib/types'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/UI/Table'
import { Sideover } from '../components/UI/Sideover'
import { ListaAnotacoes } from '../components/Anotacoes/ListaAnotacoes'
import { useAuth } from '../hooks/useAuth'

interface OperadorComEquipe extends Operador {
  equipe?: {
    nome: string
  }
}

export const ListaOperadores: React.FC = () => {
  const { isAdmin } = useAuth()
  const [operadores, setOperadores] = useState<OperadorComEquipe[]>([])
  const [loading, setLoading] = useState(true)
  const [operadorSelecionado, setOperadorSelecionado] = useState<OperadorComEquipe | null>(null)
  const [sideoverAberto, setSideoverAberto] = useState(false)

  useEffect(() => {
    carregarOperadores()
  }, [])

  const carregarOperadores = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('operadores')
        .select(`
          *,
          equipes:nome
        `)
        .order('nome')
      
      if (error) throw error
      
      // Processar dados para incluir nome da equipe de forma mais eficiente
      if (data) {
        // Buscar todos os IDs de equipe únicos
        const equipeIds = [...new Set(data.filter(op => op.equipe_id).map(op => op.equipe_id))]
        
        // Buscar todas as equipes de uma vez
        const { data: equipesData } = await supabase
          .from('equipes')
          .select('id, nome')
          .in('id', equipeIds)
        
        // Criar mapa de equipes
        const equipesMap = new Map(equipesData?.map(eq => [eq.id, eq]) || [])
        
        // Mapear operadores com suas equipes
        const operadoresComEquipe = data.map(op => ({
          ...op,
          equipe: op.equipe_id ? equipesMap.get(op.equipe_id) : undefined
        }))
        
        setOperadores(operadoresComEquipe)
      }
    } catch (error: any) {
      console.error('Erro ao carregar operadores:', error.message)
      alert('Erro ao carregar operadores: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const calcularIdade = (nascimento: string) => {
    if (!nascimento) return '-'
    const hoje = new Date()
    const nasc = new Date(nascimento)
    let idade = hoje.getFullYear() - nasc.getFullYear()
    const mes = hoje.getMonth() - nasc.getMonth()
    if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
      idade--
    }
    return idade
  }

  const abrirSideover = (operador: OperadorComEquipe) => {
    setOperadorSelecionado(operador)
    setSideoverAberto(true)
  }

  const formatarData = (data: string) => {
    if (!data) return '-'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fta-dark text-white p-8 flex items-center justify-center">
        <div className="text-xl">Carregando operadores...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fta-dark text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Operadores Cadastrados</h1>
        </div>

        {operadores.length === 0 ? (
          <div className="bg-fta-gray/50 p-12 rounded-xl border border-white/10 text-center">
            <p className="text-white/60 text-lg mb-2">Nenhum operador cadastrado ainda.</p>
            <p className="text-white/40 text-sm">Os operadores são cadastrados através de links enviados pelo administrador.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableHeaderCell>Nome</TableHeaderCell>
              <TableHeaderCell>Codinome</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Telefone</TableHeaderCell>
              <TableHeaderCell>Cidade / Estado</TableHeaderCell>
              <TableHeaderCell>Idade</TableHeaderCell>
              <TableHeaderCell>LAB FTA</TableHeaderCell>
              <TableHeaderCell>Equipe</TableHeaderCell>
              {isAdmin && <TableHeaderCell>Ações</TableHeaderCell>}
            </TableHeader>
            <TableBody>
              {operadores.map((operador) => (
                <TableRow key={operador.id}>
                  <TableCell className="font-medium">{operador.nome}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-fta-green/20 text-fta-green rounded text-xs font-medium">
                      {operador.codinome}
                    </span>
                  </TableCell>
                  <TableCell>{operador.email}</TableCell>
                  <TableCell>{operador.telefone}</TableCell>
                  <TableCell>{operador.cidade} / {operador.estado}</TableCell>
                  <TableCell>{calcularIdade(operador.nascimento)} anos</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-fta-green/20 text-fta-green rounded text-xs font-medium">
                      {operador.lab_fta || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    {operador.equipe ? (
                      <span className="px-2 py-1 bg-white/10 rounded text-xs">
                        {operador.equipe.nome}
                      </span>
                    ) : (
                      <span className="text-white/40 text-xs">Sem equipe</span>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <button
                        onClick={() => abrirSideover(operador)}
                        className="text-fta-green hover:text-fta-green/80 transition-colors p-2"
                        title="Ver detalhes e anotações"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="mt-4 text-white/60 text-sm">
          Total: {operadores.length} operador{operadores.length !== 1 ? 'es' : ''}
        </div>
      </div>

      {/* Sideover para ver operador e anotações */}
      <Sideover
        isOpen={sideoverAberto}
        onClose={() => {
          setSideoverAberto(false)
          setOperadorSelecionado(null)
        }}
        title={operadorSelecionado ? `Operador: ${operadorSelecionado.nome}` : 'Detalhes do Operador'}
      >
        {operadorSelecionado && (
          <div className="space-y-6">
            {/* Detalhes do Operador */}
            <div className="bg-fta-gray p-4 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold mb-4 text-fta-green">Informações do Operador</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Codinome:</span>
                  <p className="text-white font-medium">{operadorSelecionado.codinome}</p>
                </div>
                <div>
                  <span className="text-white/60">Email:</span>
                  <p className="text-white font-medium">{operadorSelecionado.email}</p>
                </div>
                <div>
                  <span className="text-white/60">Telefone:</span>
                  <p className="text-white font-medium">{operadorSelecionado.telefone}</p>
                </div>
                <div>
                  <span className="text-white/60">Cidade/Estado:</span>
                  <p className="text-white font-medium">{operadorSelecionado.cidade} / {operadorSelecionado.estado}</p>
                </div>
                <div>
                  <span className="text-white/60">Idade:</span>
                  <p className="text-white font-medium">{calcularIdade(operadorSelecionado.nascimento)} anos</p>
                </div>
                <div>
                  <span className="text-white/60">LAB FTA:</span>
                  <p className="text-white font-medium">{operadorSelecionado.lab_fta || 0}</p>
                </div>
                <div>
                  <span className="text-white/60">Equipe:</span>
                  <p className="text-white font-medium">
                    {operadorSelecionado.equipe?.nome || 'Sem equipe'}
                  </p>
                </div>
                <div>
                  <span className="text-white/60">Data de Nascimento:</span>
                  <p className="text-white font-medium">{formatarData(operadorSelecionado.nascimento)}</p>
                </div>
              </div>
            </div>

            {/* Anotações do Operador */}
            {isAdmin && (
              <div className="bg-fta-gray p-4 rounded-lg border border-white/10">
                <ListaAnotacoes
                  tipo="operador"
                  operadorId={operadorSelecionado.id}
                  operadorEquipeId={operadorSelecionado.equipe_id}
                />
              </div>
            )}
          </div>
        )}
      </Sideover>
    </div>
  )
}

