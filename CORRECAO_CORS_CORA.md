# 🔧 Correção de CORS - Integração Cora API

## ❌ Problema Identificado

A integração com a API Cora estava falhando com dois problemas:

1. **Erro de CORS**: O backend não estava permitindo requisições do frontend
2. **URL com barra dupla**: A URL estava sendo construída como `https://backend-cora.onrender.com//api/cora/token` (com `//`)

## ✅ Correções Aplicadas

### 1. Normalização de URL

Todas as URLs do backend agora são normalizadas para remover barras finais:

```typescript
const backendUrl = (import.meta.env.VITE_CORA_BACKEND_URL || 'http://localhost:3001').replace(/\/+$/, '')
```

Isso garante que mesmo se a variável de ambiente terminar com `/`, a URL será construída corretamente.

### 2. Melhoria na Configuração de CORS

O backend agora tem uma configuração mais robusta de CORS:

- ✅ Suporta múltiplas origins (separadas por vírgula)
- ✅ Permite requisições sem origin (mobile apps, Postman)
- ✅ Métodos permitidos: GET, POST, PUT, DELETE, OPTIONS
- ✅ Headers permitidos: Content-Type, Authorization, Idempotency-Key
- ✅ Credentials habilitado

## 🔧 Configuração no Render

### Backend (backend-cora)

No Render, configure a variável de ambiente:

**ALLOWED_ORIGIN:**
```
https://form-fta-frontend.onrender.com
```

**OU para múltiplas origins:**
```
https://form-fta-frontend.onrender.com,https://outro-dominio.com
```

**OU para permitir tudo (desenvolvimento):**
```
*
```

### Frontend (form-fta-frontend)

Certifique-se de que a variável está configurada:

**VITE_CORA_BACKEND_URL:**
```
https://backend-cora.onrender.com
```

**IMPORTANTE:** Não coloque barra (`/`) no final da URL!

## 📝 Passos para Corrigir

### 1. Atualizar Código

As correções já foram aplicadas nos arquivos:
- ✅ `src/lib/cora.ts` - Normalização de URLs
- ✅ `backend-cora/server.js` - Melhor configuração de CORS

### 2. Configurar Variáveis no Render

#### Backend (backend-cora):
1. Acesse o serviço no Render
2. Vá em **"Environment"**
3. Adicione/Atualize:
   - `ALLOWED_ORIGIN` = `https://form-fta-frontend.onrender.com`
4. Salve e aguarde o deploy

#### Frontend (form-fta-frontend):
1. Acesse o serviço no Render
2. Vá em **"Environment"**
3. Verifique/Adicione:
   - `VITE_CORA_BACKEND_URL` = `https://backend-cora.onrender.com` (sem barra no final!)
4. Salve e aguarde o deploy

### 3. Fazer Deploy

Após configurar as variáveis:

1. **Backend:**
   ```bash
   git add backend-cora/server.js
   git commit -m "Corrigir CORS e melhorar configuração"
   git push origin main
   ```

2. **Frontend:**
   ```bash
   git add src/lib/cora.ts
   git commit -m "Corrigir construção de URL do backend Cora"
   git push origin main
   ```

## ✅ Verificação

Após o deploy, teste:

1. Acesse o frontend
2. Vá em **Financeiro** → **Gerar Novo Boleto**
3. Preencha os dados
4. Clique em **Gerar Boleto**

**Deve funcionar sem erros de CORS!** 🎉

## 🔍 Troubleshooting

### Se ainda houver erro de CORS:

1. **Verifique os logs do backend no Render:**
   - Procure por mensagens de CORS
   - Veja se a origin está sendo bloqueada

2. **Verifique a variável ALLOWED_ORIGIN:**
   - Deve ser exatamente a URL do frontend
   - Sem barra no final
   - Sem `http://` ou `https://` duplicado

3. **Teste o backend diretamente:**
   ```bash
   curl -X POST https://backend-cora.onrender.com/api/cora/token \
     -H "Content-Type: application/json" \
     -d '{"clientId":"int-1ZVwf7iYC106q3iRWEmyJP","env":"production"}'
   ```

4. **Verifique o console do navegador:**
   - Veja se a URL está correta (sem `//`)
   - Veja se o erro de CORS persiste

## 📚 Arquivos Modificados

- `src/lib/cora.ts` - Normalização de URLs em todas as funções
- `backend-cora/server.js` - Melhor configuração de CORS

---

**Após configurar as variáveis no Render, a integração deve funcionar!** 🚀
