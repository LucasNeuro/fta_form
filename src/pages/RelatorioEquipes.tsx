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
    const doc = new jsPDF('landscape', 'mm', 'a4') // Modo paisagem para mais espaço
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    let yPos = margin

    // Cores
    const corVerde = [34, 197, 94] // Verde FTA
    const corCinza = [240, 240, 240] // Cinza claro para linhas alternadas
    const corTextoEscuro = [0, 0, 0] // Preto para texto
    const corTextoClaro = [255, 255, 255] // Branco para texto no cabeçalho

    // Título
    doc.setFontSize(22)
    doc.setTextColor(corVerde[0], corVerde[1], corVerde[2])
    doc.setFont('helvetica', 'bold')
    doc.text('Relatório de Equipes', margin, yPos)
    yPos += 8

    // Filtros aplicados
    doc.setFontSize(10)
    doc.setTextColor(corTextoEscuro[0], corTextoEscuro[1], corTextoEscuro[2])
    doc.setFont('helvetica', 'normal')
    if (filtroEstado || filtroGraduacao) {
      doc.text('Filtros aplicados:', margin, yPos)
      yPos += 5
      if (filtroEstado) {
        doc.text(`Estado: ${filtroEstado}`, margin + 5, yPos)
        yPos += 5
      }
      if (filtroGraduacao) {
        doc.text(`Graduação FTA: ${filtroGraduacao}`, margin + 5, yPos)
        yPos += 5
      }
      yPos += 3
    }

    // Data do relatório
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    const dataFormatada = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    doc.text(`Gerado em: ${dataFormatada}`, margin, yPos)
    yPos += 8

    // Cabeçalho da tabela
    const linhaAltura = 8
    const colunas = [
      { label: 'Nome', width: 50 },
      { label: 'Capitão', width: 45 },
      { label: 'Cidade', width: 35 },
      { label: 'Estado', width: 20 },
      { label: 'Graduação FTA', width: 40 },
      { label: 'Total Membros', width: 35 },
      { label: 'Ativos', width: 25 },
      { label: 'Membro Desde', width: 30 }
    ]

    // Fundo verde do cabeçalho
    doc.setFillColor(corVerde[0], corVerde[1], corVerde[2])
    doc.rect(margin, yPos, pageWidth - 2 * margin, linhaAltura, 'F')
    
    // Texto do cabeçalho em branco
    doc.setTextColor(corTextoClaro[0], corTextoClaro[1], corTextoClaro[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    
    let xPos = margin + 3
    colunas.forEach((col) => {
      doc.text(col.label, xPos, yPos + 5)
      xPos += col.width
    })
    
    yPos += linhaAltura + 2

    // Dados das equipes
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const alturaLinha = 7

    equipesFiltradas.forEach((equipe, index) => {
      // Verifica se precisa de nova página
      if (yPos + alturaLinha > pageHeight - margin) {
        doc.addPage()
        yPos = margin

        // Redesenhar cabeçalho
        doc.setFillColor(corVerde[0], corVerde[1], corVerde[2])
        doc.rect(margin, yPos, pageWidth - 2 * margin, linhaAltura, 'F')
        doc.setTextColor(corTextoClaro[0], corTextoClaro[1], corTextoClaro[2])
        doc.setFont('helvetica', 'bold')
        xPos = margin + 3
        colunas.forEach((col) => {
          doc.text(col.label, xPos, yPos + 5)
          xPos += col.width
        })
        yPos += linhaAltura + 2
      }

      // Fundo alternado para linhas
      if (index % 2 === 0) {
        doc.setFillColor(corCinza[0], corCinza[1], corCinza[2])
        doc.rect(margin, yPos - 1, pageWidth - 2 * margin, alturaLinha, 'F')
      }

      // Texto preto para legibilidade
      doc.setTextColor(corTextoEscuro[0], corTextoEscuro[1], corTextoEscuro[2])
      
      xPos = margin + 3
      
      // Nome (truncar se muito longo)
      doc.text((equipe.nome || '-').substring(0, 30), xPos, yPos + 4)
      xPos += colunas[0].width

      // Capitão
      doc.text((equipe.capitao || '-').substring(0, 25), xPos, yPos + 4)
      xPos += colunas[1].width

      // Cidade
      doc.text((equipe.cidade || '-').substring(0, 20), xPos, yPos + 4)
      xPos += colunas[2].width

      // Estado
      doc.text(equipe.estado || '-', xPos, yPos + 4)
      xPos += colunas[3].width

      // Graduação FTA
      doc.text(equipe.graduacao_fta || '-', xPos, yPos + 4)
      xPos += colunas[4].width

      // Total Membros
      doc.text(String(equipe.total_membros || 0), xPos, yPos + 4)
      xPos += colunas[5].width

      // Ativos
      doc.text(String(equipe.ativos || 0), xPos, yPos + 4)
      xPos += colunas[6].width

      // Membro Desde
      doc.text(formatarData(equipe.membro_desde || ''), xPos, yPos + 4)
      
      yPos += alturaLinha
    })

    // Rodapé com total
    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(corVerde[0], corVerde[1], corVerde[2])
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
    <div className="bg-fta-dark text-white p-8">
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
              Gerar PDF
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

