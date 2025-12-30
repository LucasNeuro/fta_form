export interface Operador {
  id?: string
  nome: string
  codinome: string
  cidade: string
  estado: string
  nascimento: string
  email: string
  telefone: string
  equipe_id?: string
  lab_fta?: number // Quantidade de laboratórios FTA realizados
  created_at?: string
  updated_at?: string
}

export interface Plano {
  id?: string
  nome: string
  descricao?: string
  valor: number
  ativo: boolean
  created_at?: string
  updated_at?: string
}

export interface Equipe {
  id?: string
  nome: string
  total_membros: number
  ativos: number
  capitao: string
  cidade: string
  estado: string
  membro_desde: string
  historico_transgressoes?: string
  graduacao_fta: 'Cadete' | 'Efetivo' | 'Graduado' | 'Estado Maior' | 'Conselheiro'
  instagram?: string // Link do Instagram da equipe
  ativo?: boolean
  created_at?: string
  updated_at?: string
  // Campos financeiros
  pagamento_efetuado?: boolean
  data_pagamento?: string
  valor_cobrado?: number
  plano_id?: string
  plano?: Plano // Para join
  // Campos para cobrança recorrente
  cobranca_recorrente?: boolean
  dia_vencimento?: number // Dia do mês para vencimento (1-28)
  ultimo_boleto_gerado?: string // Data do último boleto gerado
  // Campos para emissão de boletos (CPF ou CNPJ)
  documento?: string // CPF ou CNPJ (formato livre)
  tipo_documento?: 'CPF' | 'CNPJ' // Tipo do documento
  email?: string // Email para envio de boletos
  endereco_rua?: string
  endereco_numero?: string
  endereco_bairro?: string
  endereco_complemento?: string
  endereco_cep?: string
}

export type UserRole = 'admin' | 'responsavel_equipe' | 'user'

export interface UserWithRole {
  id: string
  email: string
  role: UserRole
  is_admin: boolean
  equipe_id?: string
}

export interface CadastroLink {
  id?: string
  token: string
  tipo: 'equipe' | 'operador'
  equipe_id?: string
  criado_por: string
  usado: boolean
  ativo?: boolean
  usado_em?: string
  usado_por?: string
  expires_at?: string
  created_at?: string
  nome?: string // Nome/descrição do link para identificação
}

export interface LinkAcessoEquipe {
  id?: string
  equipe_id: string
  token: string
  ativo: boolean
  criado_por: string
  created_at?: string
  updated_at?: string
  nome?: string // Nome/descrição do link
  usado_em?: string // Quando foi usado pela primeira vez
  ultimo_acesso?: string // Último acesso ao link
  equipe?: Equipe // Para join
}

export interface TipoTransgressao {
  id?: string
  nome: string
  descricao?: string
  ativo: boolean
  criado_por: string
  created_at?: string
  updated_at?: string
}

export interface Anotacao {
  id?: string
  tipo: 'equipe' | 'operador'
  equipe_id?: string
  operador_id?: string
  titulo?: string
  descricao: string
  criado_por: string
  created_at?: string
  updated_at?: string
  criado_por_nome?: string // Para exibir quem criou
  // Campos para transgressões
  e_transgressao?: boolean
  tipo_transgressao_id?: string
  tipo_transgressao?: TipoTransgressao // Para join
  data_evento?: string
  nome_evento?: string
  local_evento?: string
  // Informações do operador (quando a anotação é copiada de operador para equipe)
  operador_info?: {
    nome: string
    codinome: string
    display: string
  }
  // Informações adicionais para exibição
  equipe_nome?: string
  tipo_transgressao_nome?: string
}

// Integração com Banco Cora - Boletos
export interface Boleto {
  id?: string
  equipe_id: string
  plano_id?: string
  cora_invoice_id?: string // ID do boleto/QR Code na API Cora
  valor: number
  vencimento: string // Data de vencimento
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado'
  tipo: 'unico' | 'recorrente'
  forma_pagamento: 'boleto' | 'pix' // Tipo de pagamento gerado
  mes_referencia?: string // Para boletos recorrentes (ex: "2024-01")
  pdf_url?: string // URL do PDF do boleto
  pix_qr_code?: string // URL do QR Code Pix (PNG)
  pix_copy_paste?: string // Código Pix para copiar e colar (EMV)
  pix_payment_url?: string // URL completa para pagamento via Pix (link direto)
  data_pagamento?: string // Quando foi pago
  observacoes?: string
  criado_por: string
  created_at?: string
  updated_at?: string
  // Informações adicionais para exibição
  equipe_nome?: string
  plano_nome?: string
  criado_por_nome?: string
}

// Tipos para requisições da API Cora
export interface CoraTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
}

export interface CoraBoletoRequest {
  code?: string // ID único do boleto no nosso sistema (opcional)
  customer: {
    name: string
    email?: string // Email do cliente (opcional, mas recomendado para notificações)
    document: {
      identity: string
      type: 'CPF' | 'CNPJ'
    }
    address: {
      street: string
      number: string
      district: string
      city: string
      state: string
      complement?: string
      zip_code: string
    }
  }
  services: Array<{
    name: string
    description: string // Obrigatório, máximo 100 caracteres
    amount: number // Valor em centavos
  }>
  payment_terms: {
    due_date: string // YYYY-MM-DD
    fine?: {
      amount?: number // Multa em centavos
      rate?: number // Taxa percentual de multa
      date?: string // Data a partir da qual será aplicada
    }
    interest?: {
      rate: number // Taxa de juros
    }
    discount?: {
      type: 'PERCENT' | 'FIXED'
      value: number
    }
  }
  notification?: {
    name: string // Nome do contato para notificações
    channels: Array<{
      contact: string // Email ou telefone
      channel: 'EMAIL' | 'SMS'
      rules: string[] // Regras de notificação (ex: 'NOTIFY_ON_DUE_DATE', 'NOTIFY_WHEN_PAID')
    }>
  }
}

export interface CoraBoletoResponse {
  id: string
  amountTotal: number
  status: string
  documentUrl?: string
  buyer: {
    name: string
    document: string
    email: string
    type: string
    address: any
  }
  seller: {
    businessId: string
    name: string
    document: string
    type: string
  }
  bankslip?: {
    barcode: string
    digitableLine: string
  }
  pix?: {
    qrCode: string
    copyPaste: string
    emv?: string // Código Pix copia e cola
  }
  services: Array<any>
  paymentTerms: any
  payments: Array<any>
  paymentForms: string | string[]
  createdAt: string
  total_amount?: number // Para QR Code Pix
  total_paid?: number // Para QR Code Pix
  occurrence_date?: string // Data do pagamento
  code?: string // Código do pagamento
  payment_options?: {
    bank_slip?: {
      url?: string
    }
  }
}

// Tipo para requisição de QR Code Pix (similar ao boleto mas com payment_forms: ['PIX'])
export interface CoraPixRequest extends Omit<CoraBoletoRequest, 'payment_terms'> {
  payment_terms: CoraBoletoRequest['payment_terms']
  payment_forms?: string[] // ['PIX'] para QR Code Pix
  notification?: {
    name: string
    channels?: Array<{
      contact: string
      channel: 'EMAIL' | 'SMS'
      rules: string[]
    }>
  }
}

