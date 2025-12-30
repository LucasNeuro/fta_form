import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Equipe, Plano, Boleto } from '../lib/types'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/UI/Table'
import { Button } from '../components/UI/Button'
import { Input } from '../components/UI/Input'
import { Sideover } from '../components/UI/Sideover'
import { ToastContainer } from '../components/UI/Toast'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../hooks/useAuth'
import { coraService, coraHelpers } from '../lib/cora'
import jsPDF from 'jspdf'
import { 
  MdCheckCircle, 
  MdPending, 
  MdAttachMoney, 
  MdGroups, 
  MdStar,
  MdEdit,
  MdDelete,
  MdSave,
  MdCancel,
  MdAdd,
  MdRefresh,
  MdPictureAsPdf,
  MdReceipt,
  MdQrCode,
  MdDownload,
  MdEmail,
  MdCalendarToday,
  MdFilterList
} from 'react-icons/md'

const VALOR_COBRANCA_PADRAO = 65.00 // Valor padrão (será substituído pelo valor do plano)

type TabType = 'pagamentos' | 'planos'

export const Financeiro: React.FC = () => {
  const toast = useToast()
  const { user } = useAuth()
  
  // Estados para abas
  const [abaAtiva, setAbaAtiva] = useState<TabType>('pagamentos')
  
  // Estados para Pagamentos
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pago' | 'pendente'>('todos')
  
  // Estados para Planos
  const [loadingPlanos, setLoadingPlanos] = useState(false)
  const [editandoPlano, setEditandoPlano] = useState<string | null>(null)
  const [novoPlano, setNovoPlano] = useState<Partial<Plano>>({ nome: '', descricao: '', valor: 0, ativo: true })
  const [mostrarFormNovoPlano, setMostrarFormNovoPlano] = useState(false)
  const [formPlanoEdit, setFormPlanoEdit] = useState<Partial<Plano>>({})

  // Estados para Boletos
  const [boletos, setBoletos] = useState<Boleto[]>([])
  const [boletosFiltrados, setBoletosFiltrados] = useState<Boleto[]>([])
  const [loadingBoletos, setLoadingBoletos] = useState(false)
  const [mostrarFormBoleto, setMostrarFormBoleto] = useState(false)
  const [boletoSelecionado, setBoletoSelecionado] = useState<Boleto | null>(null)
  const [mostrarDetalhesBoleto, setMostrarDetalhesBoleto] = useState(false)
  const [gerandoBoleto, setGerandoBoleto] = useState(false)
  
  // Filtros de boletos
  const [filtroBoletoStatus, setFiltroBoletoStatus] = useState<string>('todos')
  const [filtroBoletoEquipe, setFiltroBoletoEquipe] = useState<string>('todos')
  const [filtroBoletoDataInicio, setFiltroBoletoDataInicio] = useState('')
  const [filtroBoletoDataFim, setFiltroBoletoDataFim] = useState('')
  
  // Formulário de novo boleto
  const [formBoleto, setFormBoleto] = useState({
    equipe_id: '',
    plano_id: '',
    valor: 0,
    vencimento: '',
    tipo: 'unico' as 'unico' | 'recorrente',
    forma_pagamento: 'boleto' as 'boleto' | 'pix', // Tipo de pagamento
    observacoes: '',
    // Dados de cobrança (preenchidos no formulário)
    nome_responsavel: '',
    documento: '',
    tipo_documento: 'CPF' as 'CPF' | 'CNPJ',
    email_cobranca: '',
    endereco_rua: '',
    endereco_numero: '',
    endereco_bairro: '',
    endereco_complemento: '',
    endereco_cep: '',
    cidade: '',
    estado: ''
  })

  useEffect(() => {
    carregarDados()
    // Sempre carregar boletos para calcular métricas corretas
    carregarBoletos()
  }, [])

  useEffect(() => {
    if (abaAtiva === 'planos') {
      // Recarregar boletos quando mudar para aba de planos
      carregarBoletos()
    }
  }, [abaAtiva])

  useEffect(() => {
    if (abaAtiva === 'planos') {
      aplicarFiltrosBoletos()
    }
  }, [boletos, filtroBoletoStatus, filtroBoletoEquipe, filtroBoletoDataInicio, filtroBoletoDataFim])

  // Atualizar valor do boleto quando equipe ou plano mudar
  useEffect(() => {
    if (formBoleto.equipe_id) {
      const equipe = equipes.find(e => e.id === formBoleto.equipe_id)
      if (equipe) {
        if (formBoleto.plano_id) {
          const plano = planos.find(p => p.id === formBoleto.plano_id)
          if (plano) {
            setFormBoleto(prev => ({ ...prev, valor: plano.valor }))
          }
        } else {
          setFormBoleto(prev => ({ 
            ...prev, 
            valor: equipe.plano?.valor || equipe.valor_cobrado || VALOR_COBRANCA_PADRAO 
          }))
        }
      }
    }
  }, [formBoleto.equipe_id, formBoleto.plano_id, equipes, planos])

  const carregarDados = async () => {
    await Promise.all([carregarEquipes(), carregarPlanos()])
  }

  const carregarEquipes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('equipes')
        .select(`
          *,
          planos(*)
        `)
        .order('nome')

      if (error) throw error
      if (data) {
        // Mapear plano para o formato correto
        const equipesMapeadas = data.map((eq: any) => ({
          ...eq,
          plano: Array.isArray(eq.planos) && eq.planos.length > 0 ? eq.planos[0] : null
        }))
        setEquipes(equipesMapeadas)
      }
    } catch (error: any) {
      toast.error('Erro ao carregar equipes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const carregarPlanos = async () => {
    try {
      setLoadingPlanos(true)
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .order('valor', { ascending: true })

      if (error) throw error
      if (data) setPlanos(data)
    } catch (error: any) {
      toast.error('Erro ao carregar planos: ' + error.message)
    } finally {
      setLoadingPlanos(false)
    }
  }

  // Funções para Boletos
  const carregarBoletos = async () => {
    try {
      setLoadingBoletos(true)
      const { data, error } = await supabase
        .from('boletos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        // Buscar informações relacionadas
        const equipeIds = [...new Set(data.map(b => b.equipe_id))]
        const planoIds = [...new Set(data.filter(b => b.plano_id).map(b => b.plano_id))]
        const userIds = [...new Set(data.map(b => b.criado_por))]

        const [equipesRes, planosRes, usersRes] = await Promise.all([
          supabase.from('equipes').select('id, nome').in('id', equipeIds),
          planoIds.length > 0
            ? supabase.from('planos').select('id, nome').in('id', planoIds)
            : Promise.resolve({ data: [], error: null }),
          supabase.from('users').select('id, email').in('id', userIds)
        ])

        const equipesMap = new Map(equipesRes.data?.map(e => [e.id, e.nome]) || [])
        const planosMap = new Map(planosRes.data?.map(p => [p.id, p.nome]) || [])
        const usersMap = new Map(usersRes.data?.map(u => [u.id, u.email]) || [])

        const boletosComDados = data.map(boleto => ({
          ...boleto,
          equipe_nome: equipesMap.get(boleto.equipe_id) || 'Desconhecida',
          plano_nome: boleto.plano_id ? planosMap.get(boleto.plano_id) : undefined,
          criado_por_nome: usersMap.get(boleto.criado_por) || 'Desconhecido'
        }))

        setBoletos(boletosComDados)
      }
    } catch (error: any) {
      toast.error('Erro ao carregar boletos: ' + error.message)
    } finally {
      setLoadingBoletos(false)
    }
  }

  const aplicarFiltrosBoletos = () => {
    let filtrados = [...boletos]

    if (filtroBoletoStatus !== 'todos') {
      filtrados = filtrados.filter(b => b.status === filtroBoletoStatus)
    }

    if (filtroBoletoEquipe !== 'todos') {
      filtrados = filtrados.filter(b => b.equipe_id === filtroBoletoEquipe)
    }

    if (filtroBoletoDataInicio) {
      filtrados = filtrados.filter(b => b.vencimento >= filtroBoletoDataInicio)
    }

    if (filtroBoletoDataFim) {
      filtrados = filtrados.filter(b => b.vencimento <= filtroBoletoDataFim)
    }

    setBoletosFiltrados(filtrados)
  }

  const gerarBoleto = async () => {
    if (!formBoleto.equipe_id || !formBoleto.vencimento || formBoleto.valor <= 0 ||
        !formBoleto.nome_responsavel || !formBoleto.documento || !formBoleto.email_cobranca ||
        !formBoleto.endereco_rua || !formBoleto.endereco_numero || !formBoleto.endereco_bairro ||
        !formBoleto.endereco_cep || !formBoleto.cidade || !formBoleto.estado) {
      toast.warning('Preencha todos os campos obrigatórios!')
      return
    }

    if (!user) {
      toast.error('Você precisa estar logado!')
      return
    }

    try {
      setGerandoBoleto(true)

      const equipe = equipes.find(e => e.id === formBoleto.equipe_id)
      if (!equipe) {
        throw new Error('Equipe não encontrada')
      }

      // Validar dados de cobrança do formulário
      if (!formBoleto.nome_responsavel) {
        toast.error('Nome do responsável é obrigatório!')
        setGerandoBoleto(false)
        return
      }

      if (!formBoleto.documento) {
        toast.error('CPF/CNPJ é obrigatório!')
        setGerandoBoleto(false)
        return
      }

      if (!formBoleto.email_cobranca) {
        toast.error('Email de cobrança é obrigatório!')
        setGerandoBoleto(false)
        return
      }

      if (!formBoleto.endereco_rua || !formBoleto.endereco_numero || !formBoleto.endereco_bairro || !formBoleto.endereco_cep) {
        toast.error('Endereço completo é obrigatório!')
        setGerandoBoleto(false)
        return
      }

      if (!formBoleto.cidade || !formBoleto.estado) {
        toast.error('Cidade e Estado são obrigatórios!')
        setGerandoBoleto(false)
        return
      }

      // Preparar dados para API Cora
      const codigoBoleto = coraHelpers.gerarCodigoBoleto(
        formBoleto.equipe_id,
        formBoleto.tipo === 'recorrente' ? new Date().toISOString().substring(0, 7) : undefined
      )

      // Limpar documento (remover formatação: pontos, barras, hífens)
      const documentoLimpo = formBoleto.documento.replace(/\D/g, '')
      
      // Detectar tipo de documento automaticamente se necessário
      let tipoDocumento: 'CPF' | 'CNPJ' = formBoleto.tipo_documento
      if (!tipoDocumento || (documentoLimpo.length !== 11 && documentoLimpo.length !== 14)) {
        // Detectar automaticamente pelo tamanho
        tipoDocumento = documentoLimpo.length === 11 ? 'CPF' : documentoLimpo.length === 14 ? 'CNPJ' : 'CPF'
      }
      
      // Validar tamanho do documento
      if (tipoDocumento === 'CPF' && documentoLimpo.length !== 11) {
        toast.error('CPF deve ter 11 dígitos!')
        setGerandoBoleto(false)
        return
      }
      if (tipoDocumento === 'CNPJ' && documentoLimpo.length !== 14) {
        toast.error('CNPJ deve ter 14 dígitos!')
        setGerandoBoleto(false)
        return
      }
      
      // Limpar CEP (remover hífen)
      const cepLimpo = formBoleto.endereco_cep.replace(/\D/g, '')
      
      if (cepLimpo.length !== 8) {
        toast.error('CEP deve ter 8 dígitos!')
        setGerandoBoleto(false)
        return
      }

      // Configuração de notificações (comum para boleto e PIX)
      const notificationConfig = {
        name: formBoleto.nome_responsavel,
        channels: [{
          contact: formBoleto.email_cobranca,
          channel: 'EMAIL' as const,
          rules: [
            'NOTIFY_SEVEN_DAYS_BEFORE_DUE_DATE', // 7 dias antes
            'NOTIFY_TWO_DAYS_BEFORE_DUE_DATE',  // 2 dias antes
            'NOTIFY_ON_DUE_DATE',                // No vencimento
            'NOTIFY_WHEN_PAID'                   // Quando pago
          ]
        }]
      }

      const baseRequest = {
        code: codigoBoleto,
        customer: {
          name: formBoleto.nome_responsavel,
          email: formBoleto.email_cobranca,
          document: {
            identity: documentoLimpo,
            type: tipoDocumento
          },
          address: {
            street: formBoleto.endereco_rua,
            number: formBoleto.endereco_numero,
            district: formBoleto.endereco_bairro,
            city: formBoleto.cidade,
            state: formBoleto.estado,
            complement: formBoleto.endereco_complemento || 'N/A',
            zip_code: cepLimpo
          }
        },
        services: [{
          name: formBoleto.plano_id 
            ? planos.find(p => p.id === formBoleto.plano_id)?.nome || 'Serviço FTA'
            : 'Serviço FTA',
          description: formBoleto.observacoes || 'Pagamento de mensalidade FTA Brasil', // Obrigatório, máximo 100 caracteres
          amount: coraHelpers.valorParaCentavos(formBoleto.valor)
        }],
        payment_terms: {
          due_date: coraHelpers.formatarData(formBoleto.vencimento),
          fine: {
            amount: coraHelpers.valorParaCentavos(formBoleto.valor * 0.02) // 2% de multa
          },
          interest: {
            rate: 0.033 // 0,033% ao dia
          }
        },
        // Adicionar notificações para ambos (boleto e PIX)
        notification: notificationConfig
      }

      // Chamar API Cora via backend intermediário
      let coraResponse: any
      if (formBoleto.forma_pagamento === 'pix') {
        // Criar QR Code Pix
        const pixRequest = {
          ...baseRequest,
          payment_forms: ['PIX']
        }
        coraResponse = await coraService.criarQRCodePix(pixRequest)
      } else {
        // Criar boleto tradicional (também com notificações)
        coraResponse = await coraService.criarBoleto(baseRequest)
      }

      // Determinar status inicial baseado na resposta
      const statusInicial = coraResponse.status === 'PAID' ? 'pago' : 'pendente'
      const dataPagamento = coraResponse.status === 'PAID' && coraResponse.occurrence_date 
        ? coraResponse.occurrence_date 
        : null

      // Salvar boleto no banco
      const { data: boletoData, error: dbError } = await supabase
        .from('boletos')
        .insert([{
          equipe_id: formBoleto.equipe_id,
          plano_id: formBoleto.plano_id || null,
          cora_invoice_id: coraResponse.id,
          valor: formBoleto.valor,
          vencimento: formBoleto.vencimento,
          status: statusInicial,
          tipo: formBoleto.tipo,
          forma_pagamento: formBoleto.forma_pagamento,
          mes_referencia: formBoleto.tipo === 'recorrente' 
            ? new Date().toISOString().substring(0, 7) 
            : null,
          pdf_url: coraResponse.documentUrl || null,
          // QR Code: payment_options.bank_slip.url é a URL da imagem PNG do QR Code
          pix_qr_code: formBoleto.forma_pagamento === 'pix' 
            ? (coraResponse.payment_options?.bank_slip?.url || coraResponse.pix?.qrCode || null)
            : null,
          pix_copy_paste: coraResponse.pix?.emv || coraResponse.pix?.copyPaste || null,
          // URL completa para pagamento Pix (link direto da Cora)
          // A Cora fornece uma URL no payment_options.bank_slip.url para QR Code Pix
          pix_payment_url: formBoleto.forma_pagamento === 'pix' && coraResponse.id
            ? (coraResponse.payment_options?.bank_slip?.url 
                || `https://cora.com.br/pagar/${coraResponse.id}` 
                || coraResponse.pix?.qrCode) // Fallback para URL do QR Code
            : null,
          data_pagamento: dataPagamento,
          observacoes: formBoleto.observacoes || null,
          criado_por: user.id
        }])
        .select()
        .single()

      if (dbError) throw dbError

      toast.success(
        formBoleto.forma_pagamento === 'pix' 
          ? 'QR Code Pix gerado com sucesso!'
          : 'Boleto gerado com sucesso!'
      )
      setMostrarFormBoleto(false)
      setFormBoleto({
        equipe_id: '',
        plano_id: '',
        valor: 0,
        vencimento: '',
        tipo: 'unico',
        forma_pagamento: 'boleto',
        observacoes: '',
        nome_responsavel: '',
        documento: '',
        tipo_documento: 'CPF',
        email_cobranca: '',
        endereco_rua: '',
        endereco_numero: '',
        endereco_bairro: '',
        endereco_complemento: '',
        endereco_cep: '',
        cidade: '',
        estado: ''
      })
      await carregarBoletos()
    } catch (error: any) {
      console.error('Erro ao gerar boleto:', error)
      toast.error('Erro ao gerar boleto: ' + error.message)
    } finally {
      setGerandoBoleto(false)
    }
  }

  const cancelarBoleto = async (boletoId: string, coraInvoiceId?: string) => {
    if (!confirm('Tem certeza que deseja cancelar este boleto?')) {
      return
    }

    try {
      // Cancelar na API Cora se tiver ID
      if (coraInvoiceId) {
        await coraService.cancelarBoleto(coraInvoiceId)
      }

      // Atualizar status no banco
      const { error } = await supabase
        .from('boletos')
        .update({ status: 'cancelado' })
        .eq('id', boletoId)

      if (error) throw error

      toast.success('Boleto cancelado com sucesso!')
      await carregarBoletos()
    } catch (error: any) {
      toast.error('Erro ao cancelar boleto: ' + error.message)
    }
  }

  // Verificar validade de pagamentos (38 dias)
  const verificarValidadePagamentos = async () => {
    try {
      const DIAS_VALIDADE = 38
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      // Buscar todos os boletos pagos que têm data_pagamento
      const { data: boletosPagos, error: fetchError } = await supabase
        .from('boletos')
        .select('id, data_pagamento, status')
        .eq('status', 'pago')
        .not('data_pagamento', 'is', null)

      if (fetchError) throw fetchError

      if (!boletosPagos || boletosPagos.length === 0) {
        return { atualizados: 0 }
      }

      let atualizados = 0

      for (const boleto of boletosPagos) {
        if (!boleto.data_pagamento) continue

        // Calcular data de validade (data_pagamento + 38 dias)
        const dataPagamento = new Date(boleto.data_pagamento)
        dataPagamento.setHours(0, 0, 0, 0)
        
        const dataValidade = new Date(dataPagamento)
        dataValidade.setDate(dataValidade.getDate() + DIAS_VALIDADE)

        // Se passou da validade, mudar para pendente
        if (hoje > dataValidade) {
          const { error: updateError } = await supabase
            .from('boletos')
            .update({ status: 'pendente' })
            .eq('id', boleto.id)

          if (!updateError) {
            atualizados++
            console.log(`Boleto ${boleto.id} expirou (pagamento de ${boleto.data_pagamento} + ${DIAS_VALIDADE} dias)`)
          }
        }
      }

      return { atualizados }
    } catch (error: any) {
      console.error('Erro ao verificar validade de pagamentos:', error)
      return { atualizados: 0, erro: error.message }
    }
  }

  // Verificar status de pagamento automaticamente
  const verificarPagamentos = async () => {
    try {
      // PRIMEIRO: Verificar validade de pagamentos (38 dias)
      const validadeResult = await verificarValidadePagamentos()
      if (validadeResult.atualizados > 0) {
        console.log(`${validadeResult.atualizados} boleto(s) expirado(s) após 38 dias`)
      }

      // SEGUNDO: Buscar todos os boletos pendentes que têm cora_invoice_id
      const { data: boletosPendentes, error: fetchError } = await supabase
        .from('boletos')
        .select('id, cora_invoice_id, status')
        .in('status', ['pendente', 'vencido'])
        .not('cora_invoice_id', 'is', null)

      if (fetchError) throw fetchError

      if (!boletosPendentes || boletosPendentes.length === 0) {
        toast.info('Nenhum boleto pendente para verificar.')
        return
      }

      let atualizados = 0
      let erros = 0

      // Verificar cada boleto na API Cora
      for (const boleto of boletosPendentes) {
        try {
          if (!boleto.cora_invoice_id) continue

          const statusCora = await coraService.consultarBoleto(boleto.cora_invoice_id)
          
          console.log(`Status do boleto ${boleto.id} na Cora:`, statusCora.status)
          
          // Mapear status da Cora para nosso status
          let novoStatus = boleto.status
          let dataPagamento = null

          // Status possíveis da Cora:
          // - OPEN: Registrado, mas ainda não pago
          // - IN_PAYMENT: Em processo de pagamento (Pix pode levar alguns minutos)
          // - PAID: Pago com sucesso
          // - LATE: Pagamento em atraso
          // - CANCELLED: Cancelado
          // - DRAFT: Em rascunho

          if (statusCora.status === 'PAID') {
            novoStatus = 'pago'
            // Usar occurrence_date se disponível, senão usar a data atual
            dataPagamento = statusCora.occurrence_date 
              ? statusCora.occurrence_date.split('T')[0] // Formato YYYY-MM-DD
              : new Date().toISOString().split('T')[0]
          } else if (statusCora.status === 'IN_PAYMENT') {
            // Pix em processamento - manter como pendente mas logar
            console.log(`⚠️ Boleto ${boleto.id} está em processamento (IN_PAYMENT)`)
            // Não mudar status ainda, mas pode mostrar uma mensagem
          } else if (statusCora.status === 'LATE') {
            novoStatus = 'vencido'
          } else if (statusCora.status === 'CANCELLED') {
            novoStatus = 'cancelado'
          }

          // Atualizar apenas se o status mudou
          if (novoStatus !== boleto.status) {
            const updateData: any = { status: novoStatus }
            if (dataPagamento) {
              updateData.data_pagamento = dataPagamento
            }

            const { error: updateError } = await supabase
              .from('boletos')
              .update(updateData)
              .eq('id', boleto.id)

            if (!updateError) {
              atualizados++
            } else {
              console.error('Erro ao atualizar boleto:', updateError)
              erros++
            }
          }
        } catch (error: any) {
          console.error(`Erro ao verificar boleto ${boleto.id}:`, error.message)
          // Não incrementar erros para 404 (boleto não encontrado na Cora)
          // Isso pode acontecer se o boleto foi criado mas não existe mais na API
          if (!error.message.includes('404') && !error.message.includes('não encontrado')) {
            erros++
          }
        }
      }

      // Recarregar lista de boletos
      await carregarBoletos()

      // Mensagem combinada (validade + API Cora)
      const mensagens: string[] = []
      if (validadeResult.atualizados > 0) {
        mensagens.push(`${validadeResult.atualizados} expirado(s) após 38 dias`)
      }
      if (atualizados > 0) {
        mensagens.push(`${atualizados} atualizado(s) da API Cora`)
      }
      if (erros > 0) {
        mensagens.push(`${erros} erro(s)`)
      }

      if (mensagens.length > 0) {
        toast.success(mensagens.join(' | '))
      } else if (validadeResult.atualizados === 0 && atualizados === 0 && erros === 0) {
        // Verificar se há boletos em processamento
        const { data: emProcessamento } = await supabase
          .from('boletos')
          .select('id, cora_invoice_id')
          .in('status', ['pendente'])
          .not('cora_invoice_id', 'is', null)
          .limit(1)
        
        if (emProcessamento && emProcessamento.length > 0) {
          toast.info('Nenhum pagamento novo detectado. Alguns pagamentos podem estar em processamento (Pix pode levar até 5 minutos para confirmar).')
        } else {
          toast.info('Nenhum pagamento novo detectado.')
        }
      }
    } catch (error: any) {
      console.error('Erro ao verificar pagamentos:', error)
      toast.error('Erro ao verificar pagamentos: ' + error.message)
    }
  }

  const abrirDetalhesBoleto = (boleto: Boleto) => {
    setBoletoSelecionado(boleto)
    setMostrarDetalhesBoleto(true)
  }

  const formatarDataBoleto = (data: string) => {
    if (!data) return '-'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const getStatusBoletoColor = (status: string) => {
    switch (status) {
      case 'pago': return 'bg-fta-green/20 text-fta-green border-fta-green/30'
      case 'pendente': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
      case 'vencido': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'cancelado': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-white/10 text-white/60 border-white/20'
    }
  }

  const toggleStatusPagamento = async (equipeId: string, statusAtual: boolean) => {
    try {
      const novoStatus = !statusAtual
      const equipe = equipes.find(e => e.id === equipeId)
      const valorCobrado = equipe?.plano?.valor || equipe?.valor_cobrado || VALOR_COBRANCA_PADRAO
      
      // Preparar dados para atualização
      const dadosAtualizacao: any = {
        pagamento_efetuado: novoStatus,
        valor_cobrado: valorCobrado
      }

      // Se está marcando como pago, definir a data de pagamento como hoje
      // Se está marcando como pendente, limpar a data de pagamento
      if (novoStatus === true) {
        dadosAtualizacao.data_pagamento = new Date().toISOString().split('T')[0]
      } else {
        dadosAtualizacao.data_pagamento = null
      }

      const { error } = await supabase
        .from('equipes')
        .update(dadosAtualizacao)
        .eq('id', equipeId)

      if (error) throw error

      // Atualizar estado localmente sem recarregar
      setEquipes(prevEquipes => 
        prevEquipes.map(eq => 
          eq.id === equipeId 
            ? { 
                ...eq, 
                pagamento_efetuado: novoStatus,
                data_pagamento: novoStatus ? new Date().toISOString().split('T')[0] : undefined,
                valor_cobrado: valorCobrado
              }
            : eq
        )
      )

      toast.success(novoStatus ? 'Pagamento marcado como pago!' : 'Pagamento marcado como pendente!')
    } catch (error: any) {
      toast.error('Erro ao atualizar status: ' + error.message)
    }
  }

  const atualizarPlanoEquipe = async (equipeId: string, planoId: string | null) => {
    try {
      const plano = planos.find(p => p.id === planoId)
      
      const dadosAtualizacao: any = {
        plano_id: planoId,
        valor_cobrado: plano?.valor || null
      }

      const { error } = await supabase
        .from('equipes')
        .update(dadosAtualizacao)
        .eq('id', equipeId)

      if (error) throw error

      // Atualizar estado localmente sem recarregar
      setEquipes(prevEquipes => 
        prevEquipes.map(eq => 
          eq.id === equipeId 
            ? { 
                ...eq, 
                plano_id: planoId || undefined,
                plano: plano || undefined,
                valor_cobrado: plano?.valor || undefined
              }
            : eq
        )
      )

      const planoNome = plano ? plano.nome : 'Sem Plano'
      toast.success(`Plano da equipe atualizado para: ${planoNome}`)
    } catch (error: any) {
      toast.error('Erro ao atualizar plano: ' + error.message)
    }
  }

  // Funções para gerenciar planos
  const criarPlano = async () => {
    try {
      if (!novoPlano.nome || !novoPlano.valor) {
        toast.warning('Preencha nome e valor do plano')
        return
      }

      const { data, error } = await supabase
        .from('planos')
        .insert([{
          nome: novoPlano.nome,
          descricao: novoPlano.descricao || '',
          valor: novoPlano.valor,
          ativo: novoPlano.ativo !== false
        }])
        .select()
        .single()

      if (error) throw error

      // Atualizar estado localmente
      if (data) {
        setPlanos(prev => [...prev, data].sort((a, b) => a.valor - b.valor))
      }

      setNovoPlano({ nome: '', descricao: '', valor: 0, ativo: true })
      setMostrarFormNovoPlano(false)
      toast.success('Plano criado com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao criar plano: ' + error.message)
    }
  }

  const iniciarEdicaoPlano = (plano: Plano) => {
    setEditandoPlano(plano.id!)
    setFormPlanoEdit({ ...plano })
  }

  const cancelarEdicaoPlano = () => {
    setEditandoPlano(null)
    setFormPlanoEdit({})
  }

  const salvarEdicaoPlano = async (planoId: string) => {
    try {
      if (!formPlanoEdit.nome || !formPlanoEdit.valor) {
        toast.warning('Preencha nome e valor do plano')
        return
      }

      const { error } = await supabase
        .from('planos')
        .update({
          nome: formPlanoEdit.nome,
          descricao: formPlanoEdit.descricao || '',
          valor: formPlanoEdit.valor,
          ativo: formPlanoEdit.ativo !== false
        })
        .eq('id', planoId)

      if (error) throw error

      // Atualizar estado localmente
      setPlanos(prev => 
        prev.map(p => 
          p.id === planoId 
            ? { ...p, ...formPlanoEdit }
            : p
        ).sort((a, b) => a.valor - b.valor)
      )

      setEditandoPlano(null)
      setFormPlanoEdit({})
      toast.success('Plano atualizado com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao atualizar plano: ' + error.message)
    }
  }

  const deletarPlano = async (planoId: string) => {
    try {
      const plano = planos.find(p => p.id === planoId)
      const confirmacao = window.confirm(`Tem certeza que deseja deletar o plano "${plano?.nome}"? Equipes com este plano terão o plano removido.`)
      
      if (!confirmacao) {
        return
      }

      // Primeiro, remover plano das equipes
      await supabase
        .from('equipes')
        .update({ plano_id: null })
        .eq('plano_id', planoId)

      // Depois, deletar o plano
      const { error } = await supabase
        .from('planos')
        .delete()
        .eq('id', planoId)

      if (error) throw error

      // Atualizar estados localmente
      setPlanos(prev => prev.filter(p => p.id !== planoId))
      setEquipes(prevEquipes => 
        prevEquipes.map(eq => 
          eq.plano_id === planoId 
            ? { ...eq, plano_id: undefined, plano: undefined, valor_cobrado: undefined }
            : eq
        )
      )

      toast.success('Plano deletado com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao deletar plano: ' + error.message)
    }
  }

  const toggleStatusPlano = async (planoId: string, statusAtual: boolean) => {
    try {
      const novoStatus = !statusAtual
      const { error } = await supabase
        .from('planos')
        .update({ ativo: novoStatus })
        .eq('id', planoId)

      if (error) throw error

      // Atualizar estado localmente
      setPlanos(prev => 
        prev.map(p => 
          p.id === planoId ? { ...p, ativo: novoStatus } : p
        )
      )

      toast.success(`Plano ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`)
    } catch (error: any) {
      toast.error('Erro ao atualizar status: ' + error.message)
    }
  }

  // Função para atualizar valores das equipes quando os planos forem alterados
  const atualizarValoresEquipes = async () => {
    try {
      let atualizadas = 0
      let erroAoAtualizar = false

      // Para cada equipe, atualizar o valor_cobrado com base no plano atual
      for (const equipe of equipes) {
        if (equipe.plano_id) {
          const planoAtual = planos.find(p => p.id === equipe.plano_id && p.ativo)
          if (planoAtual && equipe.valor_cobrado !== planoAtual.valor) {
            const { error } = await supabase
              .from('equipes')
              .update({ valor_cobrado: planoAtual.valor })
              .eq('id', equipe.id)

            if (error) {
              erroAoAtualizar = true
              console.error(`Erro ao atualizar equipe ${equipe.nome}:`, error)
            } else {
              atualizadas++
            }
          }
        }
      }

      if (erroAoAtualizar) {
        toast.warning('Alguns valores foram atualizados, mas ocorreram erros em algumas equipes.')
      } else if (atualizadas > 0) {
        toast.success(`${atualizadas} equipe(s) tiveram seus valores atualizados!`)
      } else {
        toast.info('Nenhuma equipe precisou ser atualizada. Todos os valores já estão corretos.')
      }

      // Recarregar equipes para refletir as mudanças
      await carregarEquipes()
    } catch (error: any) {
      toast.error('Erro ao atualizar valores: ' + error.message)
    }
  }

  // Função para gerar PDF do relatório financeiro
  const gerarPDFRelatorioFinanceiro = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    let yPos = margin

    // Cores
    const corVerde = [34, 197, 94]
    const corCinza = [240, 240, 240]
    const corTextoEscuro = [0, 0, 0]
    const corTextoClaro = [255, 255, 255]
    const corAmarelo = [234, 179, 8]
    const corAzul = [59, 130, 246]

    // Título
    doc.setFontSize(22)
    doc.setTextColor(corVerde[0], corVerde[1], corVerde[2])
    doc.setFont('helvetica', 'bold')
    doc.text('Relatório Financeiro - FTA Brasil', margin, yPos)
    yPos += 10

    // Métricas no topo
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(corTextoEscuro[0], corTextoEscuro[1], corTextoEscuro[2])
    
    doc.text('Resumo Financeiro', margin, yPos)
    yPos += 7

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(corVerde[0], corVerde[1], corVerde[2])
    doc.text(`Total Arrecadado: ${formatarMoeda(totalArrecadado)}`, margin, yPos)
    yPos += 6

    doc.setTextColor(corAmarelo[0], corAmarelo[1], corAmarelo[2])
    doc.text(`Total Pendente: ${formatarMoeda(totalPendente)}`, margin, yPos)
    yPos += 6

    doc.setTextColor(corAzul[0], corAzul[1], corAzul[2])
    doc.text(`Total Previsto: ${formatarMoeda(totalPrevisto)}`, margin, yPos)
    yPos += 6

    doc.setTextColor(corTextoEscuro[0], corTextoEscuro[1], corTextoEscuro[2])
    doc.text(`Equipes Pagas: ${equipesPagas} / ${totalEquipes} (${totalEquipes > 0 ? ((equipesPagas / totalEquipes) * 100).toFixed(1) : 0}%)`, margin, yPos)
    yPos += 8

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

    // Filtro aplicado
    if (filtroStatus !== 'todos') {
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.text(`Filtro: ${filtroStatus === 'pago' ? 'Pagas' : 'Pendentes'}`, margin, yPos)
      yPos += 6
    }

    // Cabeçalho da tabela
    const linhaAltura = 8
    const colunas = [
      { label: 'Equipe', width: 45 },
      { label: 'Capitão', width: 40 },
      { label: 'Cidade/Estado', width: 35 },
      { label: 'Plano', width: 30 },
      { label: 'Valor', width: 25 },
      { label: 'Status', width: 25 },
      { label: 'Data Pag.', width: 28 }
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
      
      // Equipe
      doc.text((equipe.nome || '-').substring(0, 25), xPos, yPos + 4)
      xPos += colunas[0].width

      // Capitão
      doc.text((equipe.capitao || '-').substring(0, 22), xPos, yPos + 4)
      xPos += colunas[1].width

      // Cidade/Estado
      doc.text(`${equipe.cidade || '-'}/${equipe.estado || '-'}`, xPos, yPos + 4)
      xPos += colunas[2].width

      // Plano
      const planoNome = equipe.plano?.nome || 'Sem Plano'
      doc.text(planoNome.substring(0, 15), xPos, yPos + 4)
      xPos += colunas[3].width

      // Valor
      const valor = equipe.plano?.valor || equipe.valor_cobrado || VALOR_COBRANCA_PADRAO
      doc.text(formatarMoeda(valor), xPos, yPos + 4)
      xPos += colunas[4].width

      // Status
      if (equipe.pagamento_efetuado === true) {
        doc.setTextColor(corVerde[0], corVerde[1], corVerde[2])
        doc.text('Pago', xPos, yPos + 4)
      } else {
        doc.setTextColor(corAmarelo[0], corAmarelo[1], corAmarelo[2])
        doc.text('Pendente', xPos, yPos + 4)
      }
      doc.setTextColor(corTextoEscuro[0], corTextoEscuro[1], corTextoEscuro[2])
      xPos += colunas[5].width

      // Data Pagamento
      doc.text(equipe.data_pagamento ? formatarData(equipe.data_pagamento) : '-', xPos, yPos + 4)
      
      yPos += alturaLinha
    })

    // Rodapé
    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(corVerde[0], corVerde[1], corVerde[2])
    doc.text(`Total: ${equipesFiltradas.length} equipe(s)`, margin, yPos)

    // Salvar PDF
    const nomeArquivo = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(nomeArquivo)
    toast.success('Relatório financeiro gerado com sucesso!')
  }

  const formatarData = (data: string) => {
    if (!data) return '-'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  // Função auxiliar para determinar status de pagamento baseado nos boletos
  const getStatusPagamentoEquipe = (equipeId: string): { status: 'pago' | 'pendente', ultimoBoletoPago: any | null, dataPagamento: string | null } => {
    const boletosEquipe = boletos.filter(b => b.equipe_id === equipeId && b.status !== 'cancelado')
    
    if (boletosEquipe.length === 0) {
      // Se não houver boletos, usar o status da equipe como fallback
      const equipe = equipes.find(e => e.id === equipeId)
      return {
        status: equipe?.pagamento_efetuado === true ? 'pago' : 'pendente',
        ultimoBoletoPago: null,
        dataPagamento: equipe?.data_pagamento || null
      }
    }
    
    // Verificar se há algum boleto pago
    const boletosPagos = boletosEquipe.filter(b => b.status === 'pago')
    if (boletosPagos.length > 0) {
      // Pegar o boleto pago mais recente
      const ultimoBoletoPago = boletosPagos.sort((a, b) => {
        const dataA = a.data_pagamento ? new Date(a.data_pagamento).getTime() : 0
        const dataB = b.data_pagamento ? new Date(b.data_pagamento).getTime() : 0
        return dataB - dataA
      })[0]
      
      return {
        status: 'pago',
        ultimoBoletoPago,
        dataPagamento: ultimoBoletoPago.data_pagamento || null
      }
    }
    
    // Se não há boletos pagos, está pendente
    return {
      status: 'pendente',
      ultimoBoletoPago: null,
      dataPagamento: null
    }
  }

  // Calcular métricas baseadas nos boletos reais
  // Total Arrecadado: soma dos boletos com status 'pago'
  const totalArrecadado = boletos
    .filter(b => b.status === 'pago')
    .reduce((sum, b) => sum + b.valor, 0)
  
  // Total Pendente: soma dos boletos com status 'pendente'
  const totalPendente = boletos
    .filter(b => b.status === 'pendente')
    .reduce((sum, b) => sum + b.valor, 0)
  
  // Total Previsto: soma de todos os boletos (pagos + pendentes + vencidos)
  const totalPrevisto = boletos
    .filter(b => b.status !== 'cancelado')
    .reduce((sum, b) => sum + b.valor, 0)
  
  // Equipes pagas: equipes que têm pelo menos um boleto pago
  const equipesComBoletoPago = new Set(
    boletos
      .filter(b => b.status === 'pago')
      .map(b => b.equipe_id)
  )
  const equipesPagas = equipesComBoletoPago.size
  
  // Equipes pendentes: equipes que têm boletos pendentes ou vencidos, mas não têm boleto pago
  const equipesComBoletoPendente = new Set(
    boletos
      .filter(b => (b.status === 'pendente' || b.status === 'vencido') && !equipesComBoletoPago.has(b.equipe_id))
      .map(b => b.equipe_id)
  )
  // Se não houver boletos, usar fallback baseado no status de pagamento das equipes
  const equipesPendentes = boletos.length > 0
    ? equipesComBoletoPendente.size
    : equipes.filter(e => e.pagamento_efetuado !== true).length
  
  const totalEquipes = equipes.length

  // Filtrar equipes baseado no status real dos boletos
  const equipesFiltradas = filtroStatus === 'todos'
    ? equipes
    : filtroStatus === 'pago'
    ? equipes.filter(e => getStatusPagamentoEquipe(e.id!).status === 'pago')
    : equipes.filter(e => getStatusPagamentoEquipe(e.id!).status === 'pendente')

  if (loading && abaAtiva === 'pagamentos') {
    return (
      <div className="min-h-screen bg-fta-dark text-white p-8 flex items-center justify-center">
        <div className="text-xl">Carregando dados financeiros...</div>
      </div>
    )
  }

  return (
    <div className="bg-fta-dark text-white p-8">
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Financeiro</h1>
          <p className="text-white/60">Controle de pagamentos, planos e receitas das equipes</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <button
            onClick={() => setAbaAtiva('pagamentos')}
            className={`px-6 py-3 font-medium transition-colors ${
              abaAtiva === 'pagamentos'
                ? 'text-fta-green border-b-2 border-fta-green'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Pagamentos
          </button>
          <button
            onClick={() => setAbaAtiva('planos')}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              abaAtiva === 'planos'
                ? 'text-fta-green border-b-2 border-fta-green'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <MdReceipt className="w-5 h-5" />
            Planos e Boletos
          </button>
        </div>

        {/* Conteúdo da Aba Pagamentos */}
        {abaAtiva === 'pagamentos' && (
          <>
            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Arrecadado */}
              <div className="bg-fta-gray/50 p-6 rounded-xl border border-fta-green/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-fta-green/20 rounded-lg">
                    <MdAttachMoney className="w-6 h-6 text-fta-green" />
                  </div>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Total Arrecadado</h3>
                <p className="text-3xl font-bold text-fta-green">{formatarMoeda(totalArrecadado)}</p>
                <p className="text-white/40 text-xs mt-2">{equipesPagas} equipe(s) pagas</p>
              </div>

              {/* Total Pendente */}
              <div className="bg-fta-gray/50 p-6 rounded-xl border border-yellow-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-500/20 rounded-lg">
                    <MdPending className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Total Pendente</h3>
                <p className="text-3xl font-bold text-yellow-500">{formatarMoeda(totalPendente)}</p>
                <p className="text-white/40 text-xs mt-2">{equipesPendentes} equipe(s) pendentes</p>
              </div>

              {/* Total Previsto */}
              <div className="bg-fta-gray/50 p-6 rounded-xl border border-blue-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <MdGroups className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Total Previsto</h3>
                <p className="text-3xl font-bold text-blue-400">{formatarMoeda(totalPrevisto)}</p>
                <p className="text-white/40 text-xs mt-2">{totalEquipes} equipe(s) cadastradas</p>
              </div>

              {/* Total de Planos */}
              <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-lg">
                    <MdStar className="w-6 h-6 text-white/60" />
                  </div>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Total de Planos</h3>
                <p className="text-3xl font-bold text-white">{planos.filter(p => p.ativo).length}</p>
                <p className="text-white/40 text-xs mt-2">planos ativos</p>
              </div>
            </div>

            {/* Filtros e Botão PDF */}
            <div className="bg-fta-gray/50 p-4 rounded-xl border border-white/10 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <label className="text-white/80 font-medium">Filtrar por Status:</label>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value as 'todos' | 'pago' | 'pendente')}
                    className="px-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
                  >
                    <option value="todos">Todas</option>
                    <option value="pago">Pagas</option>
                    <option value="pendente">Pendentes</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-white/60 text-sm">
                    Mostrando: {equipesFiltradas.length} de {totalEquipes} equipe(s)
                  </div>
                  <Button onClick={gerarPDFRelatorioFinanceiro} className="flex items-center gap-2">
                    <MdPictureAsPdf className="w-5 h-5" />
                    Gerar PDF
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabela de Equipes */}
            {equipesFiltradas.length === 0 ? (
              <div className="bg-fta-gray/50 p-12 rounded-xl border border-white/10 text-center">
                <p className="text-white/60 text-lg">
                  {equipes.length === 0 
                    ? 'Nenhuma equipe cadastrada ainda.'
                    : 'Nenhuma equipe encontrada com o filtro aplicado.'}
                </p>
              </div>
            ) : (
              <div className="bg-fta-gray/50 rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableHeaderCell>Equipe</TableHeaderCell>
                      <TableHeaderCell>Capitão</TableHeaderCell>
                      <TableHeaderCell>Cidade / Estado</TableHeaderCell>
                      <TableHeaderCell>Membro Desde</TableHeaderCell>
                      <TableHeaderCell>Plano</TableHeaderCell>
                      <TableHeaderCell>Valor</TableHeaderCell>
                      <TableHeaderCell>Status Pagamento</TableHeaderCell>
                      <TableHeaderCell>Data Pagamento</TableHeaderCell>
                      <TableHeaderCell>Ações</TableHeaderCell>
                    </TableHeader>
                    <TableBody>
                      {equipesFiltradas.map((equipe) => (
                        <TableRow key={equipe.id}>
                          <TableCell className="font-medium">{equipe.nome}</TableCell>
                          <TableCell>{equipe.capitao}</TableCell>
                          <TableCell>{equipe.cidade} / {equipe.estado}</TableCell>
                          <TableCell>{formatarData(equipe.membro_desde)}</TableCell>
                          <TableCell>
                            <select
                              value={equipe.plano_id || ''}
                              onChange={(e) => atualizarPlanoEquipe(equipe.id!, e.target.value || null)}
                              className="px-3 py-1.5 bg-fta-dark border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-fta-green"
                            >
                              <option value="">Sem Plano</option>
                              {planos.filter(p => p.ativo).map(plano => (
                                <option key={plano.id} value={plano.id}>
                                  {plano.nome} ({formatarMoeda(plano.valor)})
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell className="font-semibold text-fta-green">
                            {formatarMoeda(equipe.plano?.valor || equipe.valor_cobrado || VALOR_COBRANCA_PADRAO)}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const statusPagamento = getStatusPagamentoEquipe(equipe.id!)
                              return (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                                  statusPagamento.status === 'pago'
                                ? 'bg-fta-green/20 text-fta-green border border-fta-green/30'
                                : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                            }`}>
                                  {statusPagamento.status === 'pago' ? (
                                <>
                                  <MdCheckCircle className="w-4 h-4" />
                                  <span>Pago</span>
                                </>
                              ) : (
                                <>
                                  <MdPending className="w-4 h-4" />
                                  <span>Pendente</span>
                                </>
                              )}
                            </span>
                              )
                            })()}
                          </TableCell>
                          <TableCell className="text-white/60 text-xs">
                            {(() => {
                              const statusPagamento = getStatusPagamentoEquipe(equipe.id!)
                              return statusPagamento.dataPagamento ? formatarData(statusPagamento.dataPagamento) : '-'
                            })()}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const statusPagamento = getStatusPagamentoEquipe(equipe.id!)
                              return (
                            <Button
                              variant="outline"
                                  onClick={() => toggleStatusPagamento(equipe.id!, statusPagamento.status === 'pago')}
                              className={`text-xs px-3 py-1 ${
                                    statusPagamento.status === 'pago'
                                  ? 'text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10'
                                  : 'text-fta-green border-fta-green/50 hover:bg-fta-green/10'
                              }`}
                            >
                                  {statusPagamento.status === 'pago' ? 'Marcar Pendente' : 'Marcar Pago'}
                            </Button>
                              )
                            })()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Resumo */}
            <div className="mt-6 bg-fta-gray/50 p-6 rounded-xl border border-white/10">
              <h3 className="text-xl font-semibold mb-4 text-fta-green">Resumo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-white/60 text-sm">Equipes Pagas</p>
                  <p className="text-2xl font-bold text-fta-green">{equipesPagas}</p>
                  <p className="text-white/40 text-xs mt-1">{totalEquipes > 0 ? ((equipesPagas / totalEquipes) * 100).toFixed(1) : 0}% do total</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Equipes Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-500">{equipesPendentes}</p>
                  <p className="text-white/40 text-xs mt-1">{totalEquipes > 0 ? ((equipesPendentes / totalEquipes) * 100).toFixed(1) : 0}% do total</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Taxa de Pagamento</p>
                  <p className="text-2xl font-bold text-blue-400">{totalEquipes > 0 ? ((equipesPagas / totalEquipes) * 100).toFixed(1) : 0}%</p>
                  <p className="text-white/40 text-xs mt-1">do total de equipes</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Conteúdo da Aba Planos */}
        {abaAtiva === 'planos' && (
          <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-semibold">Gerenciar Planos</h2>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={atualizarValoresEquipes}
                  className="flex items-center gap-2"
                  title="Atualizar valores das equipes com base nos preços dos planos atuais"
                >
                  <MdRefresh className="w-5 h-5" />
                  Atualizar Valores nas Equipes
                </Button>
                <Button onClick={() => setMostrarFormNovoPlano(!mostrarFormNovoPlano)}>
                  <MdAdd className="w-5 h-5" /> Novo Plano
                </Button>
              </div>
            </div>

            {/* Formulário de Novo Plano */}
            {mostrarFormNovoPlano && (
              <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10 mb-6">
                <h3 className="text-xl font-semibold mb-4 text-fta-green">Criar Novo Plano</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome do Plano"
                    value={novoPlano.nome || ''}
                    onChange={(e) => setNovoPlano({ ...novoPlano, nome: e.target.value })}
                    placeholder="Ex: Básico, Plus, Premium"
                    required
                  />
                  <Input
                    label="Valor (R$)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoPlano.valor || ''}
                    onChange={(e) => setNovoPlano({ ...novoPlano, valor: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex: 50.90"
                    required
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Descrição"
                      value={novoPlano.descricao || ''}
                      onChange={(e) => setNovoPlano({ ...novoPlano, descricao: e.target.value })}
                      placeholder="Descrição do plano (opcional)"
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-4">
                    <Button onClick={criarPlano}>
                      <MdSave className="w-5 h-5" /> Salvar Plano
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setMostrarFormNovoPlano(false)
                      setNovoPlano({ nome: '', descricao: '', valor: 0, ativo: true })
                    }}>
                      <MdCancel className="w-5 h-5" /> Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Cards de Planos */}
            {loadingPlanos ? (
              <div className="text-center py-12">
                <p className="text-white/60">Carregando planos...</p>
              </div>
            ) : planos.length === 0 ? (
              <div className="bg-fta-gray/50 p-12 rounded-xl border border-white/10 text-center">
                <p className="text-white/60 text-lg">Nenhum plano cadastrado ainda.</p>
                <p className="text-white/40 text-sm mt-2">Clique em "Novo Plano" para criar o primeiro plano.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {planos.map((plano) => (
                  <div
                    key={plano.id}
                    className={`bg-fta-gray/50 p-6 rounded-xl border ${
                      plano.ativo 
                        ? 'border-fta-green/30' 
                        : 'border-white/10 opacity-60'
                    }`}
                  >
                    {editandoPlano === plano.id ? (
                      <div className="space-y-4">
                        <Input
                          label="Nome"
                          value={formPlanoEdit.nome || ''}
                          onChange={(e) => setFormPlanoEdit({ ...formPlanoEdit, nome: e.target.value })}
                          required
                        />
                        <Input
                          label="Valor (R$)"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formPlanoEdit.valor || ''}
                          onChange={(e) => setFormPlanoEdit({ ...formPlanoEdit, valor: parseFloat(e.target.value) || 0 })}
                          required
                        />
                        <Input
                          label="Descrição"
                          value={formPlanoEdit.descricao || ''}
                          onChange={(e) => setFormPlanoEdit({ ...formPlanoEdit, descricao: e.target.value })}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`ativo-${plano.id}`}
                            checked={formPlanoEdit.ativo !== false}
                            onChange={(e) => setFormPlanoEdit({ ...formPlanoEdit, ativo: e.target.checked })}
                            className="w-4 h-4 rounded border-white/20 bg-fta-dark text-fta-green focus:ring-fta-green"
                          />
                          <label htmlFor={`ativo-${plano.id}`} className="text-sm text-white/80">
                            Ativo
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => salvarEdicaoPlano(plano.id!)} className="flex-1">
                            <MdSave className="w-4 h-4" /> Salvar
                          </Button>
                          <Button variant="outline" onClick={cancelarEdicaoPlano} className="flex-1">
                            <MdCancel className="w-4 h-4" /> Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-fta-green mb-1">{plano.nome}</h3>
                            <p className="text-3xl font-bold text-white mb-2">{formatarMoeda(plano.valor)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            plano.ativo
                              ? 'bg-fta-green/20 text-fta-green'
                              : 'bg-white/10 text-white/60'
                          }`}>
                            {plano.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        {plano.descricao && (
                          <p className="text-white/60 text-sm mb-4">{plano.descricao}</p>
                        )}
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            onClick={() => iniciarEdicaoPlano(plano)}
                            className="flex-1"
                          >
                            <MdEdit className="w-4 h-4" /> Editar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => toggleStatusPlano(plano.id!, plano.ativo)}
                            className="flex-1"
                          >
                            {plano.ativo ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => deletarPlano(plano.id!)}
                            className="text-red-400 border-red-400/50 hover:bg-red-400/10"
                          >
                            <MdDelete className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Seção de Boletos dentro da aba Planos */}
            <div className="mt-12">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-2xl font-semibold">Boletos e Pagamentos</h2>
          </div>
              
              {/* Cards de Métricas de Boletos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-fta-gray/50 p-6 rounded-xl border border-yellow-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-500/20 rounded-lg">
                    <MdPending className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Pendentes</h3>
                <p className="text-3xl font-bold text-yellow-500">
                  {boletos.filter(b => b.status === 'pendente').length}
                </p>
                <p className="text-white/40 text-xs mt-2">
                  {formatarMoeda(boletos.filter(b => b.status === 'pendente').reduce((sum, b) => sum + b.valor, 0))}
                </p>
              </div>

              <div className="bg-fta-gray/50 p-6 rounded-xl border border-fta-green/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-fta-green/20 rounded-lg">
                    <MdCheckCircle className="w-6 h-6 text-fta-green" />
                  </div>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Pagos</h3>
                <p className="text-3xl font-bold text-fta-green">
                  {boletos.filter(b => b.status === 'pago').length}
                </p>
                <p className="text-white/40 text-xs mt-2">
                  {formatarMoeda(boletos.filter(b => b.status === 'pago').reduce((sum, b) => sum + b.valor, 0))}
                </p>
              </div>

              <div className="bg-fta-gray/50 p-6 rounded-xl border border-red-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-500/20 rounded-lg">
                    <MdPending className="w-6 h-6 text-red-400" />
                  </div>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Vencidos</h3>
                <p className="text-3xl font-bold text-red-400">
                  {boletos.filter(b => b.status === 'vencido').length}
                </p>
                <p className="text-white/40 text-xs mt-2">
                  {formatarMoeda(boletos.filter(b => b.status === 'vencido').reduce((sum, b) => sum + b.valor, 0))}
                </p>
              </div>

              <div className="bg-fta-gray/50 p-6 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-lg">
                    <MdReceipt className="w-6 h-6 text-white/60" />
                  </div>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Total</h3>
                <p className="text-3xl font-bold text-white">{boletos.length}</p>
                <p className="text-white/40 text-xs mt-2">
                  {formatarMoeda(boletos.reduce((sum, b) => sum + b.valor, 0))}
                </p>
              </div>
            </div>

            {/* Filtros e Botão Novo Boleto */}
            <div className="bg-fta-gray/50 p-4 rounded-xl border border-white/10 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <MdFilterList className="w-5 h-5 text-fta-green" />
                    <span className="text-white/80 font-medium">Filtros:</span>
                  </div>
                  <select
                    value={filtroBoletoStatus}
                    onChange={(e) => setFiltroBoletoStatus(e.target.value)}
                    className="px-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
                  >
                    <option value="todos">Todos os status</option>
                    <option value="pendente">Pendentes</option>
                    <option value="pago">Pagos</option>
                    <option value="vencido">Vencidos</option>
                    <option value="cancelado">Cancelados</option>
                  </select>
                  <select
                    value={filtroBoletoEquipe}
                    onChange={(e) => setFiltroBoletoEquipe(e.target.value)}
                    className="px-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
                  >
                    <option value="todos">Todas as equipes</option>
                    {equipes.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.nome}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={filtroBoletoDataInicio}
                    onChange={(e) => setFiltroBoletoDataInicio(e.target.value)}
                    placeholder="Data início"
                    className="px-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
                  />
                  <input
                    type="date"
                    value={filtroBoletoDataFim}
                    onChange={(e) => setFiltroBoletoDataFim(e.target.value)}
                    placeholder="Data fim"
                    className="px-4 py-2 bg-fta-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={verificarPagamentos}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={loadingBoletos}
                  >
                    <MdRefresh className={`w-5 h-5 ${loadingBoletos ? 'animate-spin' : ''}`} />
                    Verificar Pagamentos
                  </Button>
                  <Button onClick={() => setMostrarFormBoleto(true)} className="flex items-center gap-2">
                    <MdAdd className="w-5 h-5" />
                    Gerar Novo Boleto
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabela de Boletos */}
            {loadingBoletos ? (
              <div className="bg-fta-gray/50 p-12 rounded-xl border border-white/10 text-center">
                <p className="text-white/60 text-lg">Carregando boletos...</p>
              </div>
            ) : boletosFiltrados.length === 0 ? (
              <div className="bg-fta-gray/50 p-12 rounded-xl border border-white/10 text-center">
                <p className="text-white/60 text-lg">
                  {boletos.length === 0 
                    ? 'Nenhum boleto gerado ainda.'
                    : 'Nenhum boleto encontrado com os filtros aplicados.'}
                </p>
              </div>
            ) : (
              <div className="bg-fta-gray/50 rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableHeaderCell>Equipe</TableHeaderCell>
                      <TableHeaderCell>Valor</TableHeaderCell>
                      <TableHeaderCell>Vencimento</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>Forma</TableHeaderCell>
                      <TableHeaderCell>Tipo</TableHeaderCell>
                      <TableHeaderCell>Ações</TableHeaderCell>
                    </TableHeader>
                    <TableBody>
                      {boletosFiltrados.map((boleto) => (
                        <TableRow key={boleto.id}>
                          <TableCell className="font-medium">{boleto.equipe_nome}</TableCell>
                          <TableCell className="font-semibold text-fta-green">
                            {formatarMoeda(boleto.valor)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MdCalendarToday className="w-4 h-4 text-white/60" />
                              {formatarDataBoleto(boleto.vencimento)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${getStatusBoletoColor(boleto.status)}`}>
                              {boleto.status === 'pago' && <MdCheckCircle className="w-4 h-4" />}
                              {boleto.status === 'pendente' && <MdPending className="w-4 h-4" />}
                              {boleto.status.toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              boleto.forma_pagamento === 'pix' 
                                ? 'bg-purple-500/20 text-purple-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {boleto.forma_pagamento === 'pix' ? 'PIX' : 'Boleto'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                              {boleto.tipo === 'recorrente' ? 'Recorrente' : 'Único'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => abrirDetalhesBoleto(boleto)}
                                className="p-2 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                                title="Ver detalhes"
                              >
                                <MdReceipt className="w-5 h-5" />
                              </button>
                              {boleto.pdf_url && (
                                <a
                                  href={boleto.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-fta-green hover:bg-fta-green/10 rounded transition-colors"
                                  title="Download PDF"
                                >
                                  <MdDownload className="w-5 h-5" />
                                </a>
                              )}
                              {boleto.status === 'pendente' && boleto.cora_invoice_id && (
                                <button
                                  onClick={() => cancelarBoleto(boleto.id!, boleto.cora_invoice_id)}
                                  className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                  title="Cancelar boleto"
                                >
                                  <MdCancel className="w-5 h-5" />
                                </button>
        )}
      </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
    </div>
              </div>
            )}

            {/* Formulário de Novo Boleto */}
            {mostrarFormBoleto && (
              <Sideover
                isOpen={mostrarFormBoleto}
                onClose={() => {
                  setMostrarFormBoleto(false)
                  setFormBoleto({
                    equipe_id: '',
                    plano_id: '',
                    valor: 0,
                    vencimento: '',
                    tipo: 'unico',
                    observacoes: ''
                  })
                }}
                title="Gerar Novo Boleto"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Equipe *
                    </label>
                    <select
                      value={formBoleto.equipe_id}
                      onChange={(e) => {
                        const equipeSelecionada = equipes.find(eq => eq.id === e.target.value)
                        setFormBoleto({
                          ...formBoleto,
                          equipe_id: e.target.value,
                          valor: equipeSelecionada?.plano?.valor || equipeSelecionada?.valor_cobrado || 0,
                          // Preencher automaticamente cidade e estado da equipe (mas pode ser editado)
                          cidade: equipeSelecionada?.cidade || '',
                          estado: equipeSelecionada?.estado || ''
                        })
                      }}
                      className="w-full px-4 py-2 bg-fta-gray border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
                      required
                    >
                      <option value="">Selecione uma equipe</option>
                      {equipes.map(equipe => (
                        <option key={equipe.id} value={equipe.id}>
                          {equipe.nome} - {equipe.cidade}/{equipe.estado}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dados de Cobrança */}
                  <div className="border-t border-white/10 pt-4 mt-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Dados de Cobrança</h3>
                    
                    <div className="space-y-4">
                      <Input
                        label="Nome do Responsável *"
                        type="text"
                        value={formBoleto.nome_responsavel}
                        onChange={(e) => setFormBoleto({ ...formBoleto, nome_responsavel: e.target.value })}
                        placeholder="Nome completo do responsável"
                        required
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <Input
                            label="CPF/CNPJ *"
                            type="text"
                            value={formBoleto.documento}
                            onChange={(e) => {
                              const doc = e.target.value.replace(/\D/g, '')
                              setFormBoleto({ 
                                ...formBoleto, 
                                documento: doc,
                                // Detectar tipo automaticamente
                                tipo_documento: doc.length <= 11 ? 'CPF' : 'CNPJ'
                              })
                            }}
                            placeholder={formBoleto.tipo_documento === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">
                            Tipo *
                          </label>
                          <select
                            value={formBoleto.tipo_documento}
                            onChange={(e) => setFormBoleto({ ...formBoleto, tipo_documento: e.target.value as 'CPF' | 'CNPJ' })}
                            className="w-full px-4 py-2 bg-fta-gray border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
                            required
                          >
                            <option value="CPF">CPF</option>
                            <option value="CNPJ">CNPJ</option>
                          </select>
                        </div>
                      </div>

                      <Input
                        label="Email de Cobrança *"
                        type="email"
                        value={formBoleto.email_cobranca}
                        onChange={(e) => setFormBoleto({ ...formBoleto, email_cobranca: e.target.value })}
                        placeholder="email@exemplo.com"
                        required
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <Input
                          label="Rua *"
                          type="text"
                          value={formBoleto.endereco_rua}
                          onChange={(e) => setFormBoleto({ ...formBoleto, endereco_rua: e.target.value })}
                          placeholder="Nome da rua"
                          required
                        />
                        <Input
                          label="Número *"
                          type="text"
                          value={formBoleto.endereco_numero}
                          onChange={(e) => setFormBoleto({ ...formBoleto, endereco_numero: e.target.value })}
                          placeholder="123"
                          required
                        />
                        <Input
                          label="Bairro *"
                          type="text"
                          value={formBoleto.endereco_bairro}
                          onChange={(e) => setFormBoleto({ ...formBoleto, endereco_bairro: e.target.value })}
                          placeholder="Nome do bairro"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <Input
                          label="Cidade *"
                          type="text"
                          value={formBoleto.cidade}
                          onChange={(e) => setFormBoleto({ ...formBoleto, cidade: e.target.value })}
                          placeholder="Nome da cidade"
                          required
                        />
                        <Input
                          label="Estado *"
                          type="text"
                          value={formBoleto.estado}
                          onChange={(e) => setFormBoleto({ ...formBoleto, estado: e.target.value.toUpperCase() })}
                          placeholder="SP"
                          maxLength={2}
                          required
                        />
                        <Input
                          label="CEP *"
                          type="text"
                          value={formBoleto.endereco_cep}
                          onChange={(e) => {
                            const cep = e.target.value.replace(/\D/g, '')
                            setFormBoleto({ ...formBoleto, endereco_cep: cep })
                          }}
                          placeholder="00000-000"
                          maxLength={8}
                          required
                        />
                      </div>

                      <Input
                        label="Complemento (opcional)"
                        type="text"
                        value={formBoleto.endereco_complemento}
                        onChange={(e) => setFormBoleto({ ...formBoleto, endereco_complemento: e.target.value })}
                        placeholder="Apto, Sala, etc."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Plano (opcional)
                    </label>
                    <select
                      value={formBoleto.plano_id}
                      onChange={(e) => {
                        const planoSelecionado = planos.find(p => p.id === e.target.value)
                        setFormBoleto({
                          ...formBoleto,
                          plano_id: e.target.value,
                          valor: planoSelecionado?.valor || formBoleto.valor
                        })
                      }}
                      className="w-full px-4 py-2 bg-fta-gray border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
                    >
                      <option value="">Sem plano específico</option>
                      {planos.filter(p => p.ativo).map(plano => (
                        <option key={plano.id} value={plano.id}>
                          {plano.nome} - {formatarMoeda(plano.valor)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Valor (R$) *"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formBoleto.valor || ''}
                      onChange={(e) => setFormBoleto({ ...formBoleto, valor: parseFloat(e.target.value) || 0 })}
                      required
                    />
                    <Input
                      label="Data de Vencimento *"
                      type="date"
                      value={formBoleto.vencimento}
                      onChange={(e) => setFormBoleto({ ...formBoleto, vencimento: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Forma de Pagamento *
                      </label>
                      <select
                        value={formBoleto.forma_pagamento}
                        onChange={(e) => setFormBoleto({ ...formBoleto, forma_pagamento: e.target.value as 'boleto' | 'pix' })}
                        className="w-full px-4 py-2 bg-fta-gray border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
                        required
                      >
                        <option value="boleto">Boleto Registrado</option>
                        <option value="pix">QR Code Pix</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Tipo de Boleto
                      </label>
                      <select
                        value={formBoleto.tipo}
                        onChange={(e) => setFormBoleto({ ...formBoleto, tipo: e.target.value as 'unico' | 'recorrente' })}
                        className="w-full px-4 py-2 bg-fta-gray border border-white/20 rounded-lg text-white focus:outline-none focus:border-fta-green"
                      >
                        <option value="unico">Único</option>
                        <option value="recorrente">Recorrente (Mensal)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Observações (opcional)
                    </label>
                    <textarea
                      value={formBoleto.observacoes}
                      onChange={(e) => setFormBoleto({ ...formBoleto, observacoes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 bg-fta-gray border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-fta-green resize-none"
                      placeholder="Observações sobre o boleto..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={gerarBoleto}
                      disabled={gerandoBoleto}
                      className="flex-1"
                    >
                      {gerandoBoleto ? 'Gerando...' : 'Gerar Boleto'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMostrarFormBoleto(false)
                        setFormBoleto({
                          equipe_id: '',
                          plano_id: '',
                          valor: 0,
                          vencimento: '',
                          tipo: 'unico',
                          forma_pagamento: 'boleto',
                          observacoes: '',
                          nome_responsavel: '',
                          documento: '',
                          tipo_documento: 'CPF',
                          email_cobranca: '',
                          endereco_rua: '',
                          endereco_numero: '',
                          endereco_bairro: '',
                          endereco_complemento: '',
                          endereco_cep: '',
                          cidade: '',
                          estado: ''
                        })
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Sideover>
            )}

            {/* Sideover de Detalhes do Boleto */}
            {boletoSelecionado && (
              <Sideover
                isOpen={mostrarDetalhesBoleto}
                onClose={() => {
                  setMostrarDetalhesBoleto(false)
                  setBoletoSelecionado(null)
                }}
                title={`Boleto - ${boletoSelecionado.equipe_nome}`}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/60 text-sm mb-1">Valor</p>
                      <p className="text-2xl font-bold text-fta-green">
                        {formatarMoeda(boletoSelecionado.valor)}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">Status</p>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${getStatusBoletoColor(boletoSelecionado.status)}`}>
                        {boletoSelecionado.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-white/60 text-sm mb-1">Vencimento</p>
                    <p className="text-white">{formatarDataBoleto(boletoSelecionado.vencimento)}</p>
                  </div>

                  {boletoSelecionado.plano_nome && (
                    <div>
                      <p className="text-white/60 text-sm mb-1">Plano</p>
                      <p className="text-white">{boletoSelecionado.plano_nome}</p>
                    </div>
                  )}

                  {boletoSelecionado.data_pagamento && (
                    <div>
                      <p className="text-white/60 text-sm mb-1">Data de Pagamento</p>
                      <p className="text-white">{formatarDataBoleto(boletoSelecionado.data_pagamento)}</p>
                      {boletoSelecionado.status === 'pago' && (() => {
                        const dataPagamento = new Date(boletoSelecionado.data_pagamento)
                        const dataValidade = new Date(dataPagamento)
                        dataValidade.setDate(dataValidade.getDate() + 38)
                        return (
                          <p className="text-yellow-400 text-xs mt-1">
                            ⏰ Válido até: {formatarDataBoleto(dataValidade.toISOString().split('T')[0])} (38 dias)
                          </p>
                        )
                      })()}
                    </div>
                  )}

                  {boletoSelecionado.pdf_url && (
                    <div>
                      <a
                        href={boletoSelecionado.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-fta-green text-white rounded-lg hover:bg-fta-green-dark transition-colors"
                      >
                        <MdDownload className="w-5 h-5" />
                        Baixar PDF do Boleto
                      </a>
                    </div>
                  )}

                  {boletoSelecionado.forma_pagamento === 'pix' && (
                    <div className="bg-fta-gray/50 p-4 rounded-lg border border-white/10 space-y-4">
                      <p className="text-white/80 font-medium mb-2 flex items-center gap-2">
                        <MdQrCode className="w-5 h-5" />
                        Pagamento via Pix
                      </p>
                      
                      {/* Link completo para pagamento */}
                      {boletoSelecionado.pix_payment_url && (
                        <div>
                          <p className="text-white/60 text-xs mb-2">Link completo para pagamento:</p>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={boletoSelecionado.pix_payment_url}
                              readOnly
                              className="flex-1 px-3 py-2 bg-fta-dark border border-white/20 rounded text-white text-sm"
                            />
                            <Button
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(boletoSelecionado.pix_payment_url || '')
                                toast.success('Link copiado!')
                              }}
                              className="text-xs"
                            >
                              Copiar Link
                            </Button>
                            <a
                              href={boletoSelecionado.pix_payment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-fta-green text-white rounded text-xs font-medium hover:bg-fta-green/80 transition-colors"
                            >
                              Abrir Link
                            </a>
                          </div>
                          <p className="text-white/40 text-xs mt-1">Envie este link para o cliente pagar facilmente</p>
                        </div>
                      )}

                      {/* Código Pix Copia e Cola */}
                      {boletoSelecionado.pix_copy_paste && (
                        <div>
                          <p className="text-white/60 text-xs mb-1">Código Pix (Copiar e Colar):</p>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={boletoSelecionado.pix_copy_paste}
                              readOnly
                              className="flex-1 px-3 py-2 bg-fta-dark border border-white/20 rounded text-white text-sm"
                            />
                            <Button
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(boletoSelecionado.pix_copy_paste || '')
                                toast.success('Código Pix copiado!')
                              }}
                              className="text-xs"
                            >
                              Copiar
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Imagem do QR Code */}
                      {boletoSelecionado.pix_qr_code && (
                        <div>
                          <p className="text-white/60 text-xs mb-2">QR Code:</p>
                          <div className="flex flex-col items-center gap-3">
                            <img 
                              src={boletoSelecionado.pix_qr_code} 
                              alt="QR Code Pix" 
                              className="w-48 h-48 border border-white/20 rounded bg-white p-2"
                            />
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  // Baixar QR Code
                                  const link = document.createElement('a')
                                  link.href = boletoSelecionado.pix_qr_code || ''
                                  link.download = `QRCode-Pix-${boletoSelecionado.equipe_nome}-${boletoSelecionado.id}.png`
                                  link.click()
                                  toast.success('QR Code baixado!')
                                }}
                                className="text-xs flex items-center gap-2"
                              >
                                <MdDownload className="w-4 h-4" />
                                Baixar QR Code
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  // Compartilhar QR Code
                                  if (navigator.share && boletoSelecionado.pix_qr_code) {
                                    navigator.share({
                                      title: `QR Code Pix - ${boletoSelecionado.equipe_nome}`,
                                      text: `QR Code Pix para pagamento de R$ ${boletoSelecionado.valor.toFixed(2)}`,
                                      url: boletoSelecionado.pix_qr_code
                                    }).catch(() => {
                                      // Fallback: copiar link
                                      navigator.clipboard.writeText(boletoSelecionado.pix_qr_code || '')
                                      toast.success('Link do QR Code copiado!')
                                    })
                                  } else {
                                    // Fallback: copiar link
                                    navigator.clipboard.writeText(boletoSelecionado.pix_qr_code || '')
                                    toast.success('Link do QR Code copiado!')
                                  }
                                }}
                                className="text-xs flex items-center gap-2"
                              >
                                <MdEmail className="w-4 h-4" />
                                Compartilhar
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {boletoSelecionado.observacoes && (
                    <div>
                      <p className="text-white/60 text-sm mb-1">Observações</p>
                      <p className="text-white">{boletoSelecionado.observacoes}</p>
                    </div>
                  )}
                </div>
              </Sideover>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
