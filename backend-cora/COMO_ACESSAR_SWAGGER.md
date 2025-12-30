# 🔍 Como Acessar o Swagger no Render

## ⚠️ IMPORTANTE: URL Correta

O Swagger está no **BACKEND**, não no frontend!

### ❌ URL Errada (Frontend)
```
https://fta-form.onrender.com/docs  ❌
```

### ✅ URL Correta (Backend)
```
https://backend-cora.onrender.com/api-docs  ✅
```

**OU**

```
https://SEU-NOME-DO-SERVICO-BACKEND.onrender.com/api-docs
```

---

## 🔍 Como Descobrir a URL do Backend

### **Método 1: Dashboard do Render**

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Procure pelo serviço **"backend-cora"** (ou o nome que você deu)
3. Clique no serviço
4. Veja a **"Live URL"** na página
5. Adicione `/api-docs` no final

### **Método 2: Verificar Logs**

1. No Render, vá em **"Logs"** do serviço backend
2. Procure por uma linha que diz:
   ```
   📚 Swagger UI: https://SEU-BACKEND.onrender.com/api-docs
   ```

### **Método 3: Testar Health Check**

Tente acessar:
```
https://backend-cora.onrender.com/health
```

Se funcionar, você verá:
```json
{
  "status": "ok",
  "service": "Backend Cora API",
  "swagger": "/api-docs",
  "timestamp": "..."
}
```

Depois acesse `/api-docs` na mesma URL.

---

## 🚀 Rotas Disponíveis

### **1. Health Check**
```
GET /health
```
Retorna status do servidor e link para Swagger.

### **2. Swagger UI**
```
GET /api-docs
```
Interface interativa da documentação da API.

### **3. Redirecionamento**
```
GET /
```
Redireciona automaticamente para `/api-docs`.

---

## 🧪 Teste Rápido

1. **Teste o health check:**
   ```bash
   curl https://backend-cora.onrender.com/health
   ```

2. **Acesse o Swagger:**
   Abra no navegador:
   ```
   https://backend-cora.onrender.com/api-docs
   ```

---

## ❌ Se Não Funcionar

### **Problema 1: Serviço não está rodando**
- Verifique os logs no Render
- Veja se há erros de inicialização

### **Problema 2: URL diferente**
- O nome do serviço pode ser diferente
- Verifique no dashboard do Render qual é o nome exato

### **Problema 3: Serviço "dormindo" (plano free)**
- No plano free, o serviço "dorme" após inatividade
- A primeira requisição pode demorar ~50 segundos
- Aguarde e tente novamente

---

## 📝 Exemplo de URLs

Se o seu serviço se chama `backend-cora`:
- ✅ `https://backend-cora.onrender.com/api-docs`
- ✅ `https://backend-cora.onrender.com/health`
- ✅ `https://backend-cora.onrender.com/` (redireciona para /api-docs)

Se o seu serviço tem outro nome (ex: `cora-api`):
- ✅ `https://cora-api.onrender.com/api-docs`
- ✅ `https://cora-api.onrender.com/health`

---

## 🎯 Resumo

1. ✅ O Swagger está no **BACKEND** (não no frontend)
2. ✅ A rota é `/api-docs` (não `/docs`)
3. ✅ A URL base é a do serviço backend no Render
4. ✅ Use `/health` para testar se o servidor está funcionando

---

## 🆘 Ainda não funciona?

1. Verifique os logs do backend no Render
2. Confirme que o serviço está "Live" (não "Sleeping")
3. Verifique se as dependências foram instaladas corretamente
4. Veja se há erros no console do navegador ao acessar `/api-docs`
