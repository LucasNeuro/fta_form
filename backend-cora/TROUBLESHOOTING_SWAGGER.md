# 🔧 Troubleshooting - Swagger não aparece

## ❌ Problema: 404 Not Found em `/api-docs`

Se você está recebendo erro 404 ao acessar o Swagger, siga estes passos:

---

## ✅ Passo 1: Verificar se o Serviço está Rodando

### No Render Dashboard:

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique no serviço **"backend-cora"**
3. Verifique o status:
   - ✅ **"Live"** = Serviço rodando
   - ⚠️ **"Sleeping"** = Serviço dormindo (plano free)
   - ❌ **"Build Failed"** = Erro no build

### Se estiver "Sleeping":
- Aguarde ~50 segundos após a primeira requisição
- O serviço vai "acordar" automaticamente

---

## ✅ Passo 2: Testar se o Backend está Respondendo

### Teste 1: Health Check
```
https://backend-cora.onrender.com/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "service": "Backend Cora API",
  "swagger": "/api-docs",
  "timestamp": "...",
  "swaggerConfigured": true
}
```

### Teste 2: Rota de Teste
```
https://backend-cora.onrender.com/test
```

**Resposta esperada:**
```json
{
  "message": "Backend está funcionando!",
  "timestamp": "..."
}
```

### Se esses testes falharem:
- ❌ O servidor não está rodando
- ❌ Verifique os logs no Render
- ❌ Pode haver erro no código

---

## ✅ Passo 3: Verificar Logs no Render

1. No Render, vá em **"Logs"** do serviço backend
2. Procure por:
   - ✅ `✅ Swagger configurado com sucesso`
   - ✅ `✅ Swagger UI configurado em /api-docs`
   - ✅ `🚀 Servidor Cora rodando na porta 3001`
   - ❌ Qualquer erro em vermelho

### Erros comuns:

**Erro: "Cannot find module 'swagger-ui-express'"**
```bash
# Solução: Reinstalar dependências
cd backend-cora
npm install
```

**Erro: "swaggerJsdoc is not a function"**
```bash
# Solução: Verificar versão do swagger-jsdoc
npm list swagger-jsdoc
```

---

## ✅ Passo 4: Verificar se as Mudanças foram Deployadas

### Verificar último commit:
1. No Render, veja a aba **"Events"**
2. Verifique se o último deploy inclui as mudanças do Swagger
3. Se não, faça um novo deploy:
   ```bash
   git add backend-cora/server.js
   git commit -m "Corrigir configuração do Swagger"
   git push origin main
   ```

---

## ✅ Passo 5: Testar Localmente

Para garantir que funciona localmente:

```bash
cd backend-cora
npm install
npm start
```

Depois acesse:
- `http://localhost:3001/health`
- `http://localhost:3001/test`
- `http://localhost:3001/api-docs`

Se funcionar localmente mas não no Render:
- ⚠️ Problema de deploy ou variáveis de ambiente

---

## ✅ Passo 6: Verificar Variáveis de Ambiente

No Render, verifique se estas variáveis estão configuradas:

- ✅ `NODE_ENV` = `production`
- ✅ `PORT` = `3001`
- ✅ `ALLOWED_ORIGIN` = URL do frontend (ou `*`)

---

## ✅ Passo 7: Rebuild Manual

Se nada funcionar, tente um rebuild manual:

1. No Render, vá em **"Settings"**
2. Clique em **"Manual Deploy"**
3. Selecione **"Clear build cache & deploy"**
4. Aguarde o deploy completar

---

## 🔍 Diagnóstico Rápido

Execute estes testes na ordem:

1. ✅ `https://backend-cora.onrender.com/health` → Deve retornar JSON
2. ✅ `https://backend-cora.onrender.com/test` → Deve retornar JSON
3. ✅ `https://backend-cora.onrender.com/` → Deve redirecionar para `/api-docs`
4. ✅ `https://backend-cora.onrender.com/api-docs` → Deve mostrar Swagger UI

Se o passo 1 ou 2 falhar:
- ❌ Servidor não está rodando
- ❌ Verifique logs no Render

Se o passo 3 ou 4 falhar:
- ❌ Swagger não está configurado
- ❌ Verifique logs para erros do Swagger

---

## 🆘 Se Nada Funcionar

1. **Verifique os logs completos** no Render
2. **Teste localmente** para isolar o problema
3. **Verifique se todas as dependências** estão no `package.json`
4. **Tente acessar a rota raiz** `/` para ver se redireciona

---

## 📝 Checklist Final

- [ ] Serviço está "Live" no Render
- [ ] `/health` retorna JSON
- [ ] `/test` retorna JSON
- [ ] Logs mostram "Swagger configurado"
- [ ] Último deploy inclui mudanças do Swagger
- [ ] Dependências instaladas corretamente
- [ ] Nenhum erro nos logs

Se todos os itens estão ✅, o Swagger deve funcionar! 🎉
