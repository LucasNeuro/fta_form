# 🔧 Corrigir CORS no Render - Passo a Passo

## ❌ Problema

Erro de CORS ao tentar gerar boleto:
```
Access to fetch at 'https://backend-cora.onrender.com/api/cora/token' 
from origin 'https://form-fta-frontend.onrender.com' 
has been blocked by CORS policy
```

## ✅ Solução

### Passo 1: Configurar ALLOWED_ORIGIN no Backend

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique no serviço **"backend-cora"**
3. Vá na aba **"Environment"**
4. Procure pela variável **`ALLOWED_ORIGIN`**
5. Se não existir, clique em **"Add Environment Variable"**
6. Configure:
   - **Key:** `ALLOWED_ORIGIN`
   - **Value:** `https://form-fta-frontend.onrender.com`
   - **IMPORTANTE:** Sem barra (`/`) no final!

7. Clique em **"Save Changes"**

### Passo 2: Verificar se o Backend Está Rodando

1. Acesse: `https://backend-cora.onrender.com/health`
2. Deve retornar JSON com status "ok"
3. Se não funcionar, o backend pode estar "dormindo" (plano free)
   - Aguarde ~50 segundos e tente novamente

### Passo 3: Verificar Logs do Backend

1. No Render, vá em **"Logs"** do serviço backend
2. Procure por mensagens de CORS:
   - `🔧 CORS Configurado:`
   - `✅ CORS: Origin permitida:`
   - `⚠️  CORS: Origin não está na lista`

### Passo 4: Fazer Deploy do Backend (se necessário)

Se você fez alterações no código:

```bash
git add backend-cora/server.js
git commit -m "Melhorar configuração de CORS com logs"
git push origin main
```

Aguarde o deploy completar (2-5 minutos).

### Passo 5: Testar Novamente

1. Recarregue a página do frontend
2. Tente gerar um boleto novamente
3. Verifique o console do navegador (F12)
4. Verifique os logs do backend no Render

---

## 🔍 Troubleshooting

### Se ainda não funcionar:

#### 1. Verificar se a variável está configurada corretamente

No Render, verifique:
- ✅ `ALLOWED_ORIGIN` = `https://form-fta-frontend.onrender.com`
- ❌ NÃO deve ter barra no final
- ❌ NÃO deve ter `http://` (deve ser `https://`)

#### 2. Verificar logs do backend

Procure por:
- `🔧 CORS Configurado:` - Deve aparecer ao iniciar
- `✅ CORS: Origin permitida:` - Deve aparecer nas requisições
- Se aparecer `⚠️`, verifique a URL exata

#### 3. Testar CORS manualmente

No console do navegador (F12), execute:

```javascript
fetch('https://backend-cora.onrender.com/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

Se funcionar, o CORS está OK. Se não, verifique a configuração.

#### 4. Verificar se o backend está "Live"

No Render:
- Status deve ser **"Live"** (não "Sleeping")
- Se estiver "Sleeping", aguarde ~50 segundos na primeira requisição

---

## 📝 Checklist

Antes de considerar resolvido:

- [ ] `ALLOWED_ORIGIN` configurado no backend
- [ ] Valor: `https://form-fta-frontend.onrender.com` (sem barra)
- [ ] Backend está "Live" no Render
- [ ] `/health` retorna JSON
- [ ] Logs do backend mostram mensagens de CORS
- [ ] Teste manual no console funciona
- [ ] Geração de boleto funciona

---

## 🆘 Se Nada Funcionar

Como último recurso, configure `ALLOWED_ORIGIN` como `*` (permitir tudo):

1. No Render, edite `ALLOWED_ORIGIN`
2. Mude o valor para: `*`
3. Salve e aguarde o deploy
4. Teste novamente

**⚠️ Nota:** Permitir `*` é menos seguro, mas funciona para desenvolvimento.

---

**Após configurar `ALLOWED_ORIGIN` corretamente, o CORS deve funcionar!** 🚀
