import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Operador, Equipe } from '../lib/types'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/UI/Table'
import { Sideover } from '../components/UI/Sideover'
import { ListaAnotacoes } from '../components/Anotacoes/ListaAnotacoes'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/UI/Button'
import { MdPictureAsPdf, MdFilterList, MdSearch } from 'react-icons/md'
import jsPDF from 'jspdf'

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

interface OperadorComEquipe extends Operador {
  equipe?: {
    nome: string
  }
}

export const ListaOperadores: React.FC = () => {
  const { isAdmin } = useAuth()
  const [operadores, setOperadores] = useState<OperadorComEquipe[]>([])
  const [operadoresFiltrados, setOperadoresFiltrados] = useState<OperadorComEquipe[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [loading, setLoading] = useState(true)
  const [operadorSelecionado, setOperadorSelecionado] = useState<OperadorComEquipe | null>(null)
  const [sideoverAberto, setSideoverAberto] = useState(false)
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [filtroEquipe, setFiltroEquipe] = useState<string>('')
  const [filtroCidade, setFiltroCidade] = useState<string>('')
  const [filtroNome, setFiltroNome] = useState<string>('')

  useEffect(() => {
    carregarOperadores()
    carregarEquipes()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [operadores, filtroEstado, filtroEquipe, filtroCidade, filtroNome])

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

  const carregarEquipes = async () => {
    try {
      const { data, error } = await supabase
        .from('equipes')
        .select('id, nome')
        .order('nome')
      
      if (error) throw error
      if (data) {
        // Converter para o formato esperado
        setEquipes(data as Equipe[])
      }
    } catch (error: any) {
      console.error('Erro ao carregar equipes:', error.message)
    }
  }

  const aplicarFiltros = () => {
    let filtrados = [...operadores]

    // Filtro por estado
    if (filtroEstado) {
      filtrados = filtrados.filter(op => op.estado === filtroEstado)
    }

    // Filtro por equipe
    if (filtroEquipe) {
      filtrados = filtrados.filter(op => op.equipe_id === filtroEquipe)
    }

    // Filtro por cidade
    if (filtroCidade.trim()) {
      filtrados = filtrados.filter(op => 
        op.cidade?.toLowerCase().includes(filtroCidade.toLowerCase().trim())
      )
    }

    // Filtro por nome
    if (filtroNome.trim()) {
      filtrados = filtrados.filter(op => 
        op.nome?.toLowerCase().includes(filtroNome.toLowerCase().trim()) ||
        op.codinome?.toLowerCase().includes(filtroNome.toLowerCase().trim())
      )
    }

    setOperadoresFiltrados(filtrados)
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

  const gerarPDF = () => {
    if (operadoresFiltrados.length === 0) {
      alert('Não há operadores para gerar o relatório!')
      return
    }

    const doc = new jsPDF('landscape', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 10
    let yPos = margin

    // Cores
    const corVerde = [34, 197, 94]
    const corCinza = [240, 240, 240]
    const corTextoEscuro = [0, 0, 0]
    const corTextoClaro = [255, 255, 255]

    // Título
    doc.setFontSize(22)
    doc.setTextColor(corVerde[0], corVerde[1], corVerde[2])
    doc.setFont('helvetica', 'bold')
    doc.text('Relatório de Operadores', margin, yPos)
    yPos += 8

    // Filtros aplicados
    doc.setFontSize(10)
    doc.setTextColor(corTextoEscuro[0], corTextoEscuro[1], corTextoEscuro[2])
    doc.setFont('helvetica', 'normal')
    if (filtroEstado || filtroEquipe || filtroCidade || filtroNome) {
      doc.text('Filtros aplicados:', margin, yPos)
      yPos += 5
      if (filtroEstado) {
        doc.text(`Estado: ${filtroEstado}`, margin + 5, yPos)
        yPos += 5
      }
      if (filtroEquipe) {
        const equipeNome = equipes.find(e => e.id === filtroEquipe)?.nome || filtroEquipe
        doc.text(`Equipe: ${equipeNome}`, margin + 5, yPos)
        yPos += 5
      }
      if (filtroCidade) {
        doc.text(`Cidade: ${filtroCidade}`, margin + 5, yPos)
        yPos += 5
      }
      if (filtroNome) {
        doc.text(`Nome/Codinome: ${filtroNome}`, margin + 5, yPos)
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
      minute: '2-digit'
    })
    doc.text(`Gerado em: ${dataFormatada}`, margin, yPos)
    yPos += 8

    // Cabeçalho da tabela
    const linhaAltura = 8
    const colunas = [
      { label: 'Nome', width: 35 },
      { label: 'Codinome', width: 30 },
      { label: 'Email', width: 45 },
      { label: 'Telefone', width: 30 },
      { label: 'Cidade', width: 30 },
      { label: 'Estado', width: 20 },
      { label: 'Idade', width: 15 },
      { label: 'LAB FTA', width: 20 },
      { label: 'Equipe', width: 30 }
    ]

    // Função para desenhar cabeçalho
    const desenharCabecalho = () => {
      doc.setFillColor(corVerde[0], corVerde[1], corVerde[2])
      doc.rect(margin, yPos, pageWidth - 2 * margin, linhaAltura, 'F')
      doc.setTextColor(corTextoClaro[0], corTextoClaro[1], corTextoClaro[2])
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      let xPos = margin + 2
      colunas.forEach((col) => {
        doc.text(col.label, xPos, yPos + 5)
        xPos += col.width
      })
      yPos += linhaAltura + 2
    }

    desenharCabecalho()

    // Dados dos operadores
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const alturaLinha = 7

    operadoresFiltrados.forEach((operador, index) => {
      // Verifica se precisa de nova página
      if (yPos + alturaLinha > pageHeight - margin) {
        doc.addPage()
        yPos = margin
        desenharCabecalho()
      }

      // Fundo alternado para linhas
      if (index % 2 === 0) {
        doc.setFillColor(corCinza[0], corCinza[1], corCinza[2])
        doc.rect(margin, yPos - 1, pageWidth - 2 * margin, alturaLinha, 'F')
      }

      // Texto preto para legibilidade
      doc.setTextColor(corTextoEscuro[0], corTextoEscuro[1], corTextoEscuro[2])
      
      let xPos = margin + 2
      
      // Nome
      doc.text((operador.nome || '-').substring(0, 25), xPos, yPos + 4)
      xPos += colunas[0].width

      // Codinome
      doc.text((operador.codinome || '-').substring(0, 20), xPos, yPos + 4)
      xPos += colunas[1].width

      // Email
      doc.text((operador.email || '-').substring(0, 35), xPos, yPos + 4)
      xPos += colunas[2].width

      // Telefone
      doc.text((operador.telefone || '-').substring(0, 20), xPos, yPos + 4)
      xPos += colunas[3].width

      // Cidade
      doc.text((operador.cidade || '-').substring(0, 20), xPos, yPos + 4)
      xPos += colunas[4].width

      // Estado
      doc.text(operador.estado || '-', xPos, yPos + 4)
      xPos += colunas[5].width

      // Idade
      doc.text(`${calcularIdade(operador.nascimento)}`, xPos, yPos + 4)
      xPos += colunas[6].width

      // LAB FTA
      doc.text(String(operador.lab_fta || 0), xPos, yPos + 4)
      xPos += colunas[7].width

      // Equipe
      doc.text((operador.equipe?.nome || 'Sem equipe').substring(0, 20), xPos, yPos + 4)
      
      yPos += alturaLinha
    })

    // Rodapé com total
    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(corVerde[0], corVerde[1], corVerde[2])
    doc.text(`Total: ${operadoresFiltrados.length} operador(es)`, margin, yPos)

    // Salvar PDF
    const nomeArquivo = `relatorio-operadores-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(nomeArquivo)
  }

  const limparFiltros = () => {
    setFiltroEstado('')
    setFiltroEquipe('')
    setFiltroCidade('')
    setFiltroNome('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fta-dark text-white p-8 flex items-center justify-center">
        <div className="text-xl">Carregando operadores...</div>
      </div>
    )
  }

  return (
    <div className="bg-fta-dark text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Operadores Cadastrados</h1>
            <p className="text-white/60 mt-2">Gere relatórios com filtros e exporte para PDF</p>
          </div>
          {operadores.length > 0 && (
            <Button
              onClick={gerarPDF}
              className="flex items-center gap-2"
              disabled={operadoresFiltrados.length === 0}
            >
              <MdPictureAsPdf className="w-5 h-5" />
              Gerar PDF
            </Button>
          )}
        </div>

        {/* Filtros */}
        {operadores.length > 0 && (
          <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <MdFilterList className="w-5 h-5 text-fta-green" />
              <h2 className="text-2xl font-semibold text-fta-green">Filtros</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro por Nome/Codinome */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Buscar por Nome/Codinome
                </label>
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                  <input
                    type="text"
                    value={filtroNome}
                    onChange={(e) => setFiltroNome(e.target.value)}
                    placeholder="Digite nome ou codinome..."
                    className="w-full pl-10 pr-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-fta-green"
                  />
                </div>
              </div>

              {/* Filtro por Estado */}
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

              {/* Filtro por Equipe */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Equipe
                </label>
                <select
                  value={filtroEquipe}
                  onChange={(e) => setFiltroEquipe(e.target.value)}
                  className="w-full px-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
                >
                  <option value="">Todas as equipes</option>
                  {equipes.map(equipe => (
                    <option key={equipe.id} value={equipe.id}>{equipe.nome}</option>
                  ))}
                  <option value="sem-equipe">Sem equipe</option>
                </select>
              </div>

              {/* Filtro por Cidade */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Cidade
                </label>
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                  <input
                    type="text"
                    value={filtroCidade}
                    onChange={(e) => setFiltroCidade(e.target.value)}
                    placeholder="Digite a cidade..."
                    className="w-full pl-10 pr-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-fta-green"
                  />
                </div>
              </div>
            </div>

            {/* Botão Limpar Filtros */}
            {(filtroEstado || filtroEquipe || filtroCidade || filtroNome) && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={limparFiltros}
                  className="text-sm"
                >
                  Limpar Filtros
                </Button>
              </div>
            )}

            {/* Contador */}
            <div className="mt-4 text-white/60 text-sm">
              Mostrando: {operadoresFiltrados.length} de {operadores.length} operador{operadores.length !== 1 ? 'es' : ''}
            </div>
          </div>
        )}

        {operadores.length === 0 ? (
          <div className="bg-fta-gray/50 p-12 rounded-xl border border-white/10 text-center">
            <p className="text-white/60 text-lg mb-2">Nenhum operador cadastrado ainda.</p>
            <p className="text-white/40 text-sm">Os operadores são cadastrados através de links enviados pelo administrador.</p>
          </div>
        ) : operadoresFiltrados.length === 0 ? (
          <div className="bg-fta-gray/50 p-12 rounded-xl border border-white/10 text-center">
            <p className="text-white/60 text-lg mb-4">Nenhum operador encontrado com os filtros aplicados.</p>
            <Button variant="outline" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
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
                  {operadoresFiltrados.map((operador) => (
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
            </div>
            <div className="mt-4 text-white/60 text-sm">
              Total: {operadores.length} operador{operadores.length !== 1 ? 'es' : ''} | 
              Mostrando: {operadoresFiltrados.length} operador{operadoresFiltrados.length !== 1 ? 'es' : ''}
            </div>
          </>
        )}
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

