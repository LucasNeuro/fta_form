# Backend Intermediário para Integração Cora

Este backend faz as requisições com certificado TLS que o Supabase Edge Functions não suporta.

## 🚀 Instalação

```bash
cd backend-cora
npm install
```

## 📋 Configuração

1. Coloque o certificado e chave privada na pasta `backend-cora`:
   - `certificate.pem` - Seu certificado da Cora
   - `private-key.pem` - Sua chave privada da Cora

2. Configure variáveis de ambiente (opcional):
   ```bash
   export PORT=3001
   export CORA_CERT_PATH=./certificate.pem
   export CORA_KEY_PATH=./private-key.pem
   export ALLOWED_ORIGIN=http://localhost:5173
   ```

## ▶️ Executar

```bash
npm start
```

O servidor rodará em `http://localhost:3001`

## 📚 Documentação Swagger

Após iniciar o servidor, acesse a documentação interativa:

**http://localhost:3001/api-docs**

A documentação Swagger permite:
- ✅ Ver todos os endpoints disponíveis
- ✅ Testar as APIs diretamente no navegador
- ✅ Ver exemplos de requisições e respostas
- ✅ Entender os schemas de dados

## 🔌 Endpoints

### POST /api/cora/token
Obtém token de acesso da API Cora

**Body:**
```json
{
  "clientId": "int-1ZVwf7iYC106q3iRWEmyJP",
  "env": "production"
}
```

**Resposta:**
```json
{
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "expires_in": 86400,
    "token_type": "Bearer"
  }
}
```

### POST /api/cora/invoices
Cria boleto na API Cora

**Body:**
```json
{
  "accessToken": "token_aqui",
  "invoiceData": {
    "code": "BOL-001",
    "customer": { ... },
    "services": [ ... ],
    "payment_terms": { ... }
  },
  "env": "production",
  "idempotencyKey": "uuid"
}
```

## 🚢 Deploy

Você pode fazer deploy deste backend em:
- Render
- Railway
- Heroku
- Vercel (com serverless functions)
- Qualquer servidor Node.js

### Variáveis de ambiente no deploy

- `PORT` (geralmente definido automaticamente)
- `CORA_CERT_PATH` (caminho do certificado no servidor)
- `CORA_KEY_PATH` (caminho da chave no servidor)
- `ALLOWED_ORIGIN` (URL do seu frontend em produção)

## 🐛 Troubleshooting

### Erro: "certificate.pem não encontrado"
- Verifique se o arquivo está na pasta `backend-cora`
- Verifique o caminho em `CORA_CERT_PATH`

### Erro: "CORS policy"
- Verifique se `ALLOWED_ORIGIN` está configurado corretamente
- No desenvolvimento, pode usar `*` para permitir todas as origens

### Erro: "Connection refused"
- Verifique se o backend está rodando na porta correta
- Verifique se `VITE_CORA_BACKEND_URL` no frontend está correto
