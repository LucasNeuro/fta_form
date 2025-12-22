import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Operador } from '../lib/types'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/UI/Table'
import { Button } from '../components/UI/Button'
import { Link } from 'react-router-dom'

interface OperadorComEquipe extends Operador {
  equipe?: {
    nome: string
  }
}

export const ListaOperadores: React.FC = () => {
  const [operadores, setOperadores] = useState<OperadorComEquipe[]>([])
  const [loading, setLoading] = useState(true)

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

  const formatarData = (data: string) => {
    if (!data) return '-'
    return new Date(data).toLocaleDateString('pt-BR')
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
              <TableHeaderCell>Equipe</TableHeaderCell>
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
                    {operador.equipe ? (
                      <span className="px-2 py-1 bg-white/10 rounded text-xs">
                        {operador.equipe.nome}
                      </span>
                    ) : (
                      <span className="text-white/40 text-xs">Sem equipe</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="mt-4 text-white/60 text-sm">
          Total: {operadores.length} operador{operadores.length !== 1 ? 'es' : ''}
        </div>
      </div>
    </div>
  )
}

