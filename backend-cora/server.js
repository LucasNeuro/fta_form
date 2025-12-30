// Backend intermediário para integração Cora
// Este servidor faz as requisições com certificado TLS que o Supabase não suporta
// Execute: node server.js

import express from 'express'
import https from 'https'
import http from 'http'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  credentials: true
}))

app.use(express.json())

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Backend Cora - Integração',
      version: '1.0.0',
      description: 'API intermediária para integração com Banco Cora usando certificado TLS client',
      contact: {
        name: 'FTA Brasil',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de desenvolvimento',
      },
    ],
    components: {
      schemas: {
        TokenRequest: {
          type: 'object',
          required: ['clientId'],
          properties: {
            clientId: {
              type: 'string',
              description: 'Client ID da API Cora',
              example: 'int-1ZVwf7iYC106q3iRWEmyJP',
            },
            env: {
              type: 'string',
              enum: ['stage', 'production'],
              default: 'production',
              description: 'Ambiente da API Cora',
            },
          },
        },
        TokenResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                access_token: {
                  type: 'string',
                  description: 'Token de acesso JWT',
                },
                expires_in: {
                  type: 'integer',
                  description: 'Tempo de expiração em segundos',
                },
                token_type: {
                  type: 'string',
                  example: 'Bearer',
                },
              },
            },
          },
        },
        InvoiceRequest: {
          type: 'object',
          required: ['accessToken', 'invoiceData'],
          properties: {
            accessToken: {
              type: 'string',
              description: 'Token de acesso obtido do endpoint /api/cora/token',
            },
            invoiceData: {
              type: 'object',
              description: 'Dados do boleto a ser criado',
            },
            env: {
              type: 'string',
              enum: ['stage', 'production'],
              default: 'production',
            },
            idempotencyKey: {
              type: 'string',
              description: 'Chave de idempotência (UUID)',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro',
            },
          },
        },
      },
    },
  },
  apis: ['./server.js'], // Caminho para os arquivos com anotações JSDoc
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Carregar certificado e chave privada
// Suporta duas formas:
// 1. Variáveis de ambiente (recomendado para Render/produção)
// 2. Arquivos locais (desenvolvimento)

let cert, key

// Primeiro, tentar ler de variáveis de ambiente (para Render/produção)
if (process.env.CORA_CERT && process.env.CORA_KEY) {
  cert = process.env.CORA_CERT
  key = process.env.CORA_KEY
  
  // Validar formato dos arquivos
  if (!cert.includes('BEGIN CERTIFICATE') || !cert.includes('END CERTIFICATE')) {
    console.warn('⚠️  AVISO: O certificado pode não estar no formato PEM correto')
    console.warn('   Deve começar com: -----BEGIN CERTIFICATE-----')
    console.warn('   Deve terminar com: -----END CERTIFICATE-----')
  }
  
  if (!key.includes('BEGIN') || !key.includes('END')) {
    console.warn('⚠️  AVISO: A chave privada pode não estar no formato correto')
  }
  
  console.log('✅ Certificado e chave carregados de variáveis de ambiente')
  console.log('   Certificado:', `(${cert.length} caracteres)`)
  console.log('   Chave:', `(${key.length} caracteres)`)
} else {
  // Fallback: ler de arquivos (desenvolvimento local)
  const certPath = process.env.CORA_CERT_PATH || join(__dirname, 'certificate.pem')
  const keyPath = process.env.CORA_KEY_PATH || join(__dirname, 'private-key.pem')
  
  try {
    cert = fs.readFileSync(certPath, 'utf8')
    key = fs.readFileSync(keyPath, 'utf8')
    
    // Validar formato dos arquivos
    if (!cert.includes('BEGIN CERTIFICATE') || !cert.includes('END CERTIFICATE')) {
      console.warn('⚠️  AVISO: O certificado pode não estar no formato PEM correto')
      console.warn('   Deve começar com: -----BEGIN CERTIFICATE-----')
      console.warn('   Deve terminar com: -----END CERTIFICATE-----')
    }
    
    if (!key.includes('BEGIN') || !key.includes('END')) {
      console.warn('⚠️  AVISO: A chave privada pode não estar no formato correto')
    }
    
    console.log('✅ Certificado e chave carregados de arquivos')
    console.log('   Certificado:', certPath, `(${cert.length} caracteres)`)
    console.log('   Chave:', keyPath, `(${key.length} caracteres)`)
  } catch (error) {
    console.error('❌ Erro ao carregar certificado/chave:', error.message)
    console.error('   Certificado deve estar em:', certPath)
    console.error('   Chave deve estar em:', keyPath)
    console.error('   OU configure as variáveis de ambiente CORA_CERT e CORA_KEY')
    process.exit(1)
  }
}


// Função auxiliar para fazer requisição HTTPS com certificado TLS
function httpsRequestWithCert(url, options, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      cert: cert,
      key: key,
      rejectUnauthorized: true
    }

    const req = https.request(requestOptions, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers })
          } catch {
            resolve({ status: res.statusCode, data: body, headers: res.headers })
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`))
        }
      })
    })

    req.on('error', reject)
    
    if (data) {
      req.write(data)
    }
    
    req.end()
  })
}

/**
 * @swagger
 * /api/cora/token:
 *   post:
 *     summary: Obter token de acesso da API Cora
 *     description: Autentica usando certificado TLS client e retorna token JWT para uso nas APIs da Cora
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TokenRequest'
 *     responses:
 *       200:
 *         description: Token obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/cora/token', async (req, res) => {
  try {
    const { clientId, env = 'production' } = req.body

    if (!clientId) {
      return res.status(400).json({ error: 'clientId é obrigatório' })
    }

    const tokenUrl = env === 'production'
      ? 'https://matls-clients.api.cora.com.br/token'
      : 'https://matls-clients.api.stage.cora.com.br/token'

    console.log('🔑 Tentando obter token...')
    console.log('   URL:', tokenUrl)
    console.log('   Client ID:', clientId)
    console.log('   Ambiente:', env)
    console.log('   Certificado carregado:', cert ? 'Sim (' + cert.length + ' chars)' : 'Não')
    console.log('   Chave carregada:', key ? 'Sim (' + key.length + ' chars)' : 'Não')

    const formData = new URLSearchParams()
    formData.append('grant_type', 'client_credentials')
    formData.append('client_id', clientId)

    const formDataString = formData.toString()
    console.log('   Body:', formDataString)

    const response = await httpsRequestWithCert(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    }, formDataString)

    console.log('✅ Token obtido com sucesso!')
    res.json({ data: response.data })
  } catch (error) {
    console.error('❌ Erro ao obter token:', error.message)
    console.error('   Stack:', error.stack)
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/cora/invoices:
 *   post:
 *     summary: Criar boleto na API Cora
 *     description: |
 *       Cria um boleto registrado na API Cora usando o token de acesso.
 *       
 *       **IMPORTANTE:** Você precisa obter um token válido primeiro chamando o endpoint `/api/cora/token`.
 *       O token expira após 24 horas. Use o token retornado no campo `access_token` da resposta.
 *     tags: [Boletos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceRequest'
 *           example:
 *             accessToken: "OBTENHA_UM_TOKEN_VALIDO_EM_/api/cora/token"
 *             invoiceData:
 *               code: "BOL-001"
 *               customer:
 *                 name: "Fulano da Silva"
 *                 email: "fulano@email.com"
 *                 document:
 *                   identity: "12345678909"
 *                   type: "CPF"
 *                 address:
 *                   street: "Rua Exemplo"
 *                   number: "123"
 *                   district: "Centro"
 *                   city: "São Paulo"
 *                   state: "SP"
 *                   complement: "Apto 101"
 *                   zip_code: "01234567"
 *               services:
 *                 - name: "Serviço de Assinatura"
 *                   description: "Descrição do serviço"
 *                   amount: 10000
 *               payment_terms:
 *                 due_date: "2025-12-31"
 *             env: "production"
 *             idempotencyKey: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Boleto criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   description: Dados do boleto criado
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token de acesso inválido ou expirado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Token de acesso inválido ou expirado. Obtenha um novo token em /api/cora/token"
 *                 details:
 *                   type: string
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/cora/invoices', async (req, res) => {
  try {
    const { accessToken, invoiceData, env = 'production', idempotencyKey } = req.body

    if (!accessToken || !invoiceData) {
      return res.status(400).json({ error: 'accessToken e invoiceData são obrigatórios' })
    }

    const apiBase = env === 'production'
      ? 'https://matls-clients.api.cora.com.br'
      : 'https://matls-clients.api.stage.cora.com.br'

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    }

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey
    }

    console.log('📝 Tentando criar boleto...')
    console.log('   URL:', `${apiBase}/v2/invoices`)
    console.log('   Ambiente:', env)
    console.log('   Token (primeiros 50 chars):', accessToken.substring(0, 50) + '...')
    console.log('   Idempotency Key:', idempotencyKey || 'não fornecido')

    const response = await httpsRequestWithCert(`${apiBase}/v2/invoices`, {
      method: 'POST',
      headers
    }, JSON.stringify(invoiceData))

    console.log('✅ Boleto criado com sucesso!')
    res.json({ data: response.data })
  } catch (error) {
    console.error('❌ Erro ao criar boleto:', error.message)
    
    // Tratar erros 400 (validação) da API Cora
    if (error.message.includes('400')) {
      try {
        // Tentar extrair o JSON do erro
        const errorMatch = error.message.match(/\{.*\}/s)
        if (errorMatch) {
          const errorData = JSON.parse(errorMatch[0])
          return res.status(400).json({
            error: 'Erro de validação na API Cora',
            details: errorData
          })
        }
      } catch (e) {
        // Se não conseguir parsear, retornar mensagem original
      }
      return res.status(400).json({ 
        error: 'Erro de validação na API Cora',
        details: error.message
      })
    }
    
    // Tratar erros 401 (autenticação)
    if (error.message.includes('401') || error.message.includes('access_denied')) {
      return res.status(401).json({ 
        error: 'Token de acesso inválido ou expirado. Obtenha um novo token em /api/cora/token',
        details: error.message
      })
    }
    
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/cora/invoices/{invoiceId}:
 *   get:
 *     summary: Consultar status de boleto/QR Code Pix na API Cora
 *     description: |
 *       Consulta o status atual de um boleto ou QR Code Pix usando o ID retornado na criação.
 *       Útil para verificar se o pagamento foi realizado.
 *     tags: [Boletos]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do boleto/QR Code retornado na criação
 *     responses:
 *       200:
 *         description: Status consultado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   description: Dados do boleto/QR Code
 *       401:
 *         description: Token de acesso inválido ou expirado
 *       404:
 *         description: Boleto/QR Code não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
app.get('/api/cora/invoices/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acesso não fornecido' })
    }

    const accessToken = authHeader.replace('Bearer ', '')
    const env = req.query.env || 'production'

    const apiBase = env === 'production'
      ? 'https://matls-clients.api.cora.com.br'
      : 'https://matls-clients.api.stage.cora.com.br'

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    }

    console.log('🔍 Consultando status do boleto/QR Code...')
    console.log('   URL:', `${apiBase}/v2/invoices/${invoiceId}`)
    console.log('   Ambiente:', env)
    console.log('   Invoice ID:', invoiceId)

    const response = await httpsRequestWithCert(`${apiBase}/v2/invoices/${invoiceId}`, {
      method: 'GET',
      headers
    })

    console.log('✅ Status consultado com sucesso!')
    console.log('   Status:', response.data?.status || 'N/A')
    res.json({ data: response.data })
  } catch (error) {
    console.error('❌ Erro ao consultar boleto:', error.message)
    
    // Tratar erros 401 (autenticação)
    if (error.message.includes('401') || error.message.includes('access_denied')) {
      return res.status(401).json({ 
        error: 'Token de acesso inválido ou expirado. Obtenha um novo token em /api/cora/token',
        details: error.message
      })
    }
    
    // Tratar erros 404 (não encontrado)
    if (error.message.includes('404')) {
      return res.status(404).json({ 
        error: 'Boleto/QR Code não encontrado',
        details: error.message
      })
    }
    
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/cora/invoices/{invoiceId}:
 *   delete:
 *     summary: Cancelar boleto/QR Code Pix na API Cora
 *     description: Cancela um boleto ou QR Code Pix que ainda não foi pago
 *     tags: [Boletos]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do boleto/QR Code a ser cancelado
 *     responses:
 *       200:
 *         description: Boleto/QR Code cancelado com sucesso
 *       401:
 *         description: Token de acesso inválido ou expirado
 *       500:
 *         description: Erro interno do servidor
 */
app.delete('/api/cora/invoices/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acesso não fornecido' })
    }

    const accessToken = authHeader.replace('Bearer ', '')
    const env = req.query.env || 'production'

    const apiBase = env === 'production'
      ? 'https://matls-clients.api.cora.com.br'
      : 'https://matls-clients.api.stage.cora.com.br'

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    }

    console.log('🗑️ Cancelando boleto/QR Code...')
    console.log('   URL:', `${apiBase}/v2/invoices/${invoiceId}`)
    console.log('   Ambiente:', env)
    console.log('   Invoice ID:', invoiceId)

    const response = await httpsRequestWithCert(`${apiBase}/v2/invoices/${invoiceId}`, {
      method: 'DELETE',
      headers
    })

    console.log('✅ Boleto/QR Code cancelado com sucesso!')
    res.json({ success: true, data: response.data })
  } catch (error) {
    console.error('❌ Erro ao cancelar boleto:', error.message)
    
    // Tratar erros 401 (autenticação)
    if (error.message.includes('401') || error.message.includes('access_denied')) {
      return res.status(401).json({ 
        error: 'Token de acesso inválido ou expirado. Obtenha um novo token em /api/cora/token',
        details: error.message
      })
    }
    
    res.status(500).json({ error: error.message })
  }
})

// Middleware para tratar rotas não encontradas (deve vir depois de todas as rotas)
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method
  })
})

http.createServer(app).listen(PORT, () => {
  console.log(`🚀 Servidor Cora rodando na porta ${PORT}`)
  console.log(`📄 Certificado: ${certPath}`)
  console.log(`🔑 Chave: ${keyPath}`)
  console.log(`🌐 API: http://localhost:${PORT}`)
  console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`)
})

