// Serviço para integração com Banco Cora
// As chamadas são feitas via Backend Node.js intermediário (backend-cora)
// O backend faz as requisições com certificado TLS que o Supabase não suporta

import { CoraTokenResponse, CoraBoletoRequest, CoraBoletoResponse, CoraPixRequest } from './types'

/**
 * Serviço para comunicação com a API Cora
 * Todas as chamadas são feitas via backend Node.js intermediário
 * que suporta certificados TLS client (backend-cora/server.js)
 */
export const coraService = {
  /**
   * Gerar token de acesso na API Cora
   * Usa backend intermediário (já que Supabase Edge Functions não suporta TLS client certificates)
   */
  async getAccessToken(): Promise<CoraTokenResponse> {
    // Normalizar URL (remover barra final se existir)
    const backendUrlRaw = import.meta.env.VITE_CORA_BACKEND_URL
    const backendUrl = backendUrlRaw 
      ? backendUrlRaw.replace(/\/+$/, '')
      : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3001'
        : null
    
    if (!backendUrl) {
      throw new Error(
        'URL do backend Cora não configurada. ' +
        'Configure a variável de ambiente VITE_CORA_BACKEND_URL no Render. ' +
        'Exemplo: https://backend-cora.onrender.com'
      )
    }
    
    const clientId = import.meta.env.VITE_CORA_CLIENT_ID || 'int-1ZVwf7iYC106q3iRWEmyJP'
    const env = import.meta.env.VITE_CORA_ENV || 'stage'

    const response = await fetch(`${backendUrl}/api/cora/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId,
        env
      })
    })

    const result = await response.json()

    if (!response.ok || result.error) {
      throw new Error(result.error || 'Erro ao obter token da API Cora')
    }

    return result.data || result
  },

  /**
   * Gerar boleto via API Cora
   * Usa backend intermediário (já que Supabase Edge Functions não suporta TLS client certificates)
   */
  async criarBoleto(boletoData: CoraBoletoRequest): Promise<CoraBoletoResponse> {
    // Primeiro obter o token
    const tokenData = await this.getAccessToken()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      throw new Error('Token de acesso não retornado')
    }

    // Gerar Idempotency-Key único
    const idempotencyKey = crypto.randomUUID()
    const backendUrlRaw = import.meta.env.VITE_CORA_BACKEND_URL
    const backendUrl = backendUrlRaw 
      ? backendUrlRaw.replace(/\/+$/, '')
      : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3001'
        : null
    
    if (!backendUrl) {
      throw new Error('URL do backend Cora não configurada. Configure VITE_CORA_BACKEND_URL no Render.')
    }
    
    const env = import.meta.env.VITE_CORA_ENV || 'stage'

    const response = await fetch(`${backendUrl}/api/cora/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        invoiceData: boletoData,
        env,
        idempotencyKey
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.message || 'Erro ao criar boleto na API Cora')
    }

    const result = await response.json()
    return result.data || result
  },

  /**
   * Consultar boleto/QR Code na API Cora
   * Usa backend intermediário
   */
  async consultarBoleto(invoiceId: string): Promise<CoraBoletoResponse> {
    const tokenData = await this.getAccessToken()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      throw new Error('Token de acesso não retornado')
    }

    const backendUrlRaw = import.meta.env.VITE_CORA_BACKEND_URL
    const backendUrl = backendUrlRaw 
      ? backendUrlRaw.replace(/\/+$/, '')
      : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3001'
        : null
    
    if (!backendUrl) {
      throw new Error('URL do backend Cora não configurada. Configure VITE_CORA_BACKEND_URL no Render.')
    }
    
    const env = import.meta.env.VITE_CORA_ENV || 'production'

    const response = await fetch(`${backendUrl}/api/cora/invoices/${invoiceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      let errorMessage = 'Erro ao consultar boleto na API Cora'
      try {
        const error = await response.json()
        errorMessage = error.error || error.message || errorMessage
      } catch (e) {
        // Se não conseguir parsear JSON, usar status text
        errorMessage = `Erro ${response.status}: ${response.statusText}`
      }
      throw new Error(errorMessage)
    }

    const result = await response.json()
    return result.data || result
  },

  /**
   * Criar QR Code Pix via API Cora
   * Usa backend intermediário
   */
  async criarQRCodePix(pixData: CoraPixRequest): Promise<CoraBoletoResponse> {
    // Primeiro obter o token
    const tokenData = await this.getAccessToken()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      throw new Error('Token de acesso não retornado')
    }

    // Gerar Idempotency-Key único
    const idempotencyKey = crypto.randomUUID()
    const backendUrlRaw = import.meta.env.VITE_CORA_BACKEND_URL
    const backendUrl = backendUrlRaw 
      ? backendUrlRaw.replace(/\/+$/, '')
      : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3001'
        : null
    
    if (!backendUrl) {
      throw new Error('URL do backend Cora não configurada. Configure VITE_CORA_BACKEND_URL no Render.')
    }
    
    const env = import.meta.env.VITE_CORA_ENV || 'production'

    // Garantir que payment_forms seja ['PIX']
    const pixRequest = {
      ...pixData,
      payment_forms: ['PIX']
    }

    const response = await fetch(`${backendUrl}/api/cora/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        invoiceData: pixRequest,
        env,
        idempotencyKey
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.message || 'Erro ao criar QR Code Pix na API Cora')
    }

    const result = await response.json()
    return result.data || result
  },

  /**
   * Cancelar boleto/QR Code na API Cora
   * Usa backend intermediário
   */
  async cancelarBoleto(invoiceId: string): Promise<void> {
    const tokenData = await this.getAccessToken()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      throw new Error('Token de acesso não retornado')
    }

    const backendUrlRaw = import.meta.env.VITE_CORA_BACKEND_URL
    const backendUrl = backendUrlRaw 
      ? backendUrlRaw.replace(/\/+$/, '')
      : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3001'
        : null
    
    if (!backendUrl) {
      throw new Error('URL do backend Cora não configurada. Configure VITE_CORA_BACKEND_URL no Render.')
    }
    
    const env = import.meta.env.VITE_CORA_ENV || 'production'

    const response = await fetch(`${backendUrl}/api/cora/invoices/${invoiceId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.message || 'Erro ao cancelar boleto na API Cora')
    }
  },

  /**
   * Pagar boleto (apenas em ambiente Stage para testes)
   */
  async pagarBoletoStage(invoiceId: string): Promise<CoraBoletoResponse> {
    const env = import.meta.env.VITE_CORA_ENV || 'stage'
    if (env === 'production') {
      throw new Error('Pagamento de boleto em Stage só é permitido em ambiente de desenvolvimento')
    }

    const idempotencyKey = crypto.randomUUID()

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cora-invoices/${invoiceId}/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Idempotency-Key': idempotencyKey
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || error.error || 'Erro ao pagar boleto na API Cora')
    }

    const result = await response.json()
    return result.data || result
  }
}

/**
 * Funções auxiliares para formatação de dados
 */
export const coraHelpers = {
  /**
   * Converter valor em reais para centavos (formato da API Cora)
   */
  valorParaCentavos(valor: number): number {
    return Math.round(valor * 100)
  },

  /**
   * Converter centavos para valor em reais
   */
  centavosParaValor(centavos: number): number {
    return centavos / 100
  },

  /**
   * Formatar data para formato da API Cora (YYYY-MM-DD)
   */
  formatarData(data: Date | string): string {
    const date = typeof data === 'string' ? new Date(data) : data
    return date.toISOString().split('T')[0]
  },

  /**
   * Gerar código único para o boleto
   */
  gerarCodigoBoleto(equipeId: string, mesReferencia?: string): string {
    const timestamp = Date.now()
    const prefix = mesReferencia ? `REC-${mesReferencia}-` : 'UNI-'
    return `${prefix}${equipeId.substring(0, 8)}-${timestamp}`
  },

  /**
   * Validar CPF/CNPJ
   */
  validarDocumento(documento: string): 'CPF' | 'CNPJ' {
    const cleanDoc = documento.replace(/\D/g, '')
    if (cleanDoc.length === 11) return 'CPF'
    if (cleanDoc.length === 14) return 'CNPJ'
    throw new Error('Documento inválido. Deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)')
  },

  /**
   * Formatar CEP (remover caracteres especiais)
   */
  formatarCEP(cep: string): string {
    return cep.replace(/\D/g, '')
  }
}

