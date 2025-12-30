# ⚠️ Configurar Variável de Ambiente - Backend Cora

## ❌ Erro Atual

O erro `Failed to fetch` ou `ERR_CONNECTION_REFUSED` indica que a variável de ambiente `VITE_CORA_BACKEND_URL` **não está configurada** no Render.

## ✅ Solução

### Passo 1: Acessar Configurações do Frontend no Render

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique no serviço **"form-fta-frontend"**
3. Vá na aba **"Environment"**

### Passo 2: Adicionar Variável de Ambiente

1. Clique em **"Add Environment Variable"**
2. Configure:
   - **Key:** `VITE_CORA_BACKEND_URL`
   - **Value:** `https://backend-cora.onrender.com`
   - **IMPORTANTE:** Não coloque barra (`/`) no final!

3. Clique em **"Save Changes"**

### Passo 3: Aguardar Deploy

O Render vai fazer deploy automaticamente após salvar (2-5 minutos).

### Passo 4: Verificar

Após o deploy, teste novamente a geração de boleto.

---

## 🔍 Como Verificar se Está Configurado

### No Console do Navegador:

1. Abra o DevTools (F12)
2. Vá na aba **"Console"**
3. Digite:
   ```javascript
   console.log(import.meta.env.VITE_CORA_BACKEND_URL)
   ```
4. Deve aparecer: `https://backend-cora.onrender.com`

Se aparecer `undefined`, a variável não está configurada.

---

## 📝 Variáveis Necessárias no Frontend

Certifique-se de que estas variáveis estão configuradas:

- ✅ `VITE_SUPABASE_URL` - URL do Supabase
- ✅ `VITE_SUPABASE_ANON_KEY` - Chave anônima do Supabase
- ✅ `VITE_CORA_BACKEND_URL` - **URL do backend Cora** (esta é a que está faltando!)
- ⚙️ `VITE_CORA_CLIENT_ID` - Client ID da API Cora (opcional)
- ⚙️ `VITE_CORA_ENV` - Ambiente (production/stage) (opcional)

---

## 🆘 Se Ainda Não Funcionar

### 1. Verificar URL do Backend

Certifique-se de que o backend está rodando:
- Acesse: `https://backend-cora.onrender.com/health`
- Deve retornar JSON com status "ok"

### 2. Verificar CORS no Backend

No backend (`backend-cora`), verifique se `ALLOWED_ORIGIN` está configurado:
- Deve ser: `https://form-fta-frontend.onrender.com`

### 3. Verificar Logs

- Veja os logs do frontend no Render
- Veja os logs do backend no Render
- Procure por erros relacionados a CORS ou conexão

---

## ✅ Após Configurar

Após configurar `VITE_CORA_BACKEND_URL` e fazer o deploy:

1. ✅ Recarregue a página do frontend
2. ✅ Tente gerar um boleto novamente
3. ✅ O erro deve desaparecer

---

**A variável `VITE_CORA_BACKEND_URL` é obrigatória para a integração funcionar!** 🚀
