import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Equipe } from '../lib/types'
import { Button } from '../components/UI/Button'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/UI/Table'
import jsPDF from 'jspdf'

const GRADUACOES_FTA = ['Cadete', 'Efetivo', 'Graduado', 'Estado Maior', 'Conselheiro']
const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export const RelatorioEquipes: React.FC = () => {
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [equipesFiltradas, setEquipesFiltradas] = useState<Equipe[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [filtroGraduacao, setFiltroGraduacao] = useState<string>('')

  useEffect(() => {
    carregarEquipes()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [equipes, filtroEstado, filtroGraduacao])

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

  const aplicarFiltros = () => {
    let filtradas = [...equipes]

    if (filtroEstado) {
      filtradas = filtradas.filter(eq => eq.estado === filtroEstado)
    }

    if (filtroGraduacao) {
      filtradas = filtradas.filter(eq => eq.graduacao_fta === filtroGraduacao)
    }

    setEquipesFiltradas(filtradas)
  }

  const formatarData = (data: string) => {
    if (!data) return '-'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const gerarPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let yPos = margin

    // Título
    doc.setFontSize(20)
    doc.setTextColor(34, 197, 94) // Verde FTA
    doc.text('Relatório de Equipes', margin, yPos)
    yPos += 10

    // Filtros aplicados
    doc.setFontSize(12)
    doc.setTextColor(255, 255, 255)
    if (filtroEstado || filtroGraduacao) {
      doc.text('Filtros aplicados:', margin, yPos)
      yPos += 6
      if (filtroEstado) {
        doc.text(`Estado: ${filtroEstado}`, margin + 5, yPos)
        yPos += 6
      }
      if (filtroGraduacao) {
        doc.text(`Graduação FTA: ${filtroGraduacao}`, margin + 5, yPos)
        yPos += 6
      }
      yPos += 3
    }

    // Data do relatório
    doc.setFontSize(10)
    doc.setTextColor(200, 200, 200)
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, yPos)
    yPos += 10

    // Cabeçalho da tabela
    doc.setFontSize(11)
    doc.setTextColor(255, 255, 255)
    doc.setFillColor(34, 197, 94)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
    
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    let xPos = margin + 5
    doc.text('Nome', xPos, yPos + 5)
    xPos += 45
    doc.text('Capitão', xPos, yPos + 5)
    xPos += 35
    doc.text('Estado', xPos, yPos + 5)
    xPos += 25
    doc.text('Graduação', xPos, yPos + 5)
    xPos += 30
    doc.text('Membros', xPos, yPos + 5)
    
    yPos += 10

    // Dados das equipes
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    equipesFiltradas.forEach((equipe, index) => {
      // Verifica se precisa de nova página
      if (yPos > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage()
        yPos = margin
      }

      // Alterna cor de fundo
      if (index % 2 === 0) {
        doc.setFillColor(50, 50, 50)
        doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F')
      }

      doc.setTextColor(255, 255, 255)
      xPos = margin + 5
      doc.text(equipe.nome.substring(0, 25), xPos, yPos + 5)
      xPos += 45
      doc.text(equipe.capitao.substring(0, 20), xPos, yPos + 5)
      xPos += 35
      doc.text(equipe.estado, xPos, yPos + 5)
      xPos += 25
      doc.text(equipe.graduacao_fta, xPos, yPos + 5)
      xPos += 30
      doc.text(`${equipe.total_membros} (${equipe.ativos} ativos)`, xPos, yPos + 5)
      
      yPos += 7
    })

    // Rodapé com total
    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(34, 197, 94)
    doc.text(`Total: ${equipesFiltradas.length} equipe(s)`, margin, yPos)

    // Salvar PDF
    const nomeArquivo = `relatorio-equipes-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(nomeArquivo)
  }

  const limparFiltros = () => {
    setFiltroEstado('')
    setFiltroGraduacao('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fta-dark text-white p-8 flex items-center justify-center">
        <div className="text-xl">Carregando equipes...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fta-dark text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Relatório de Equipes</h1>
          <p className="text-white/60">Gere relatórios com filtros e exporte para PDF</p>
        </div>

        {/* Filtros */}
        <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-fta-green">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
              >
                <option value="">Todos os estados</option>
                {ESTADOS_BRASIL.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Graduação FTA
              </label>
              <select
                value={filtroGraduacao}
                onChange={(e) => setFiltroGraduacao(e.target.value)}
                className="w-full px-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
              >
                <option value="">Todas as graduações</option>
                {GRADUACOES_FTA.map(graduacao => (
                  <option key={graduacao} value={graduacao}>{graduacao}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={limparFiltros}
                className="flex-1"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-fta-gray/50 p-4 rounded-xl border border-white/10 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/60 text-sm">Total de equipes no relatório:</p>
              <p className="text-2xl font-bold text-fta-green">{equipesFiltradas.length}</p>
            </div>
            <Button onClick={gerarPDF}>
              📄 Gerar PDF
            </Button>
          </div>
        </div>

        {/* Tabela de resultados */}
        {equipesFiltradas.length === 0 ? (
          <div className="bg-fta-gray/50 p-12 rounded-xl border border-white/10 text-center">
            <p className="text-white/60 text-lg">Nenhuma equipe encontrada com os filtros aplicados.</p>
          </div>
        ) : (
          <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10">
            <Table>
              <TableHeader>
                <TableHeaderCell>Nome</TableHeaderCell>
                <TableHeaderCell>Capitão</TableHeaderCell>
                <TableHeaderCell>Cidade / Estado</TableHeaderCell>
                <TableHeaderCell>Graduação FTA</TableHeaderCell>
                <TableHeaderCell>Total Membros</TableHeaderCell>
                <TableHeaderCell>Ativos</TableHeaderCell>
                <TableHeaderCell>Membro Desde</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {equipesFiltradas.map((equipe) => (
                  <TableRow key={equipe.id}>
                    <TableCell className="font-medium">{equipe.nome}</TableCell>
                    <TableCell>{equipe.capitao}</TableCell>
                    <TableCell>{equipe.cidade} / {equipe.estado}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-white/10 rounded text-xs">
                        {equipe.graduacao_fta}
                      </span>
                    </TableCell>
                    <TableCell>{equipe.total_membros}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-fta-green/20 text-fta-green rounded text-xs font-medium">
                        {equipe.ativos}
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

