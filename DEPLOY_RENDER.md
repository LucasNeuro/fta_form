# 🚀 Guia de Deploy no Render

## 📋 O que a aplicação contempla

### **Frontend (React + Vite)**
- **Dashboard** - Visão geral com estatísticas
- **Admin Panel** - Painel administrativo
- **Operadores** - Gestão de operadores
- **Equipes** - Gestão de equipes
- **Relatório Equipes** - Relatórios detalhados
- **Transgressões** - Gestão de anotações e transgressões
- **Tipos Transgressões** - Configuração de tipos
- **Financeiro** - Gestão de pagamentos, planos e boletos (integração Cora)
- **Acesso Equipe** - Link público para líderes de equipe

### **Backend (Node.js/Express)**
- **API Cora** - Integração com Banco Cora para emissão de boletos e PIX
- **TLS Client Certificate** - Autenticação com certificado
- **CORS** - Configurado para aceitar requisições do frontend
- **Swagger UI** - Documentação da API

### **Banco de Dados (Supabase)**
- Tabelas: `users`, `equipes`, `operadores`, `anotacoes`, `tipos_transgressoes`, `boletos`, `planos`, `links_acesso_equipes`, `cadastro_links`

---

## 🏗️ Estrutura da Aplicação

```
form_fta/
├── src/                    # Frontend React
│   ├── pages/              # Páginas da aplicação
│   ├── components/          # Componentes reutilizáveis
│   ├── lib/                 # Bibliotecas (Supabase, Cora, Auth)
│   └── hooks/               # React Hooks
├── backend-cora/            # Backend Node.js
│   ├── server.js            # Servidor Express
│   └── package.json
├── server.js                # Servidor Express para servir frontend estático
├── package.json             # Dependências do frontend
├── render.yaml              # Configuração Render (Blueprints)
└── dist/                    # Build do frontend (gerado)
```

---

## 📦 Pré-requisitos

1. **Conta no Render** - [render.com](https://render.com)
2. **Conta no Supabase** - [supabase.com](https://supabase.com)
3. **Conta no Banco Cora** - Com certificado e chave privada
4. **Repositório Git** - GitHub, GitLab ou Bitbucket

---

## 🚀 Deploy Passo a Passo

### **Opção 1: Deploy Manual (Recomendado para primeira vez)**

#### **1. Preparar o Repositório**

Certifique-se de que seu código está no Git:

```bash
git add .
git commit -m "Preparar para deploy no Render"
git push origin main
```

#### **2. Deploy do Backend (backend-cora)**

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório Git
4. Configure o serviço:
   - **Name**: `backend-cora`
   - **Environment**: `Node`
   - **Region**: Escolha a mais próxima (ex: `Oregon (US West)`)
   - **Branch**: `main` (ou sua branch principal)
   - **Root Directory**: `backend-cora`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (ou `Starter` para melhor performance)

5. **Variáveis de Ambiente** (Environment Variables):
   ```
   NODE_ENV=production
   PORT=3001
   ALLOWED_ORIGIN=https://form-fta-frontend.onrender.com
   CORA_CERT=<cole aqui o conteúdo completo do certificate.pem>
   CORA_KEY=<cole aqui o conteúdo completo do private-key.pem>
   ```

   **⚠️ IMPORTANTE**: Para `CORA_CERT` e `CORA_KEY`:
   - Abra os arquivos `certificate.pem` e `private-key.pem`
   - Copie **TODO o conteúdo**, incluindo:
     ```
     -----BEGIN CERTIFICATE-----
     ...conteúdo...
     -----END CERTIFICATE-----
     ```
   - Cole exatamente como está no arquivo

6. Clique em **"Create Web Service"**
7. Aguarde o deploy finalizar e **copie a URL** (ex: `https://backend-cora-xxxx.onrender.com`)

#### **3. Deploy do Frontend (form-fta-frontend)**

1. No dashboard do Render, clique em **"New +"** → **"Web Service"**
2. Conecte o mesmo repositório Git
3. Configure o serviço:
   - **Name**: `form-fta-frontend`
   - **Environment**: `Node`
   - **Region**: Mesma região do backend
   - **Branch**: `main`
   - **Root Directory**: `.` (raiz do projeto)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (ou `Starter`)

4. **Variáveis de Ambiente**:
   ```
   NODE_ENV=production
   PORT=10000
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-do-supabase
   VITE_CORA_BACKEND_URL=https://backend-cora-xxxx.onrender.com
   VITE_CORA_CLIENT_ID=int-1ZVwf7iYC106q3iRWEmyJP
   VITE_CORA_ENV=production
   ```

   **⚠️ IMPORTANTE**: 
   - Substitua `VITE_CORA_BACKEND_URL` pela URL real do backend que você copiou
   - Substitua as credenciais do Supabase pelas suas

5. Clique em **"Create Web Service"**
6. Aguarde o deploy finalizar

#### **4. Atualizar ALLOWED_ORIGIN no Backend**

1. Volte para o serviço `backend-cora`
2. Vá em **"Environment"**
3. Atualize `ALLOWED_ORIGIN` com a URL do frontend:
   ```
   ALLOWED_ORIGIN=https://form-fta-frontend-xxxx.onrender.com
   ```
4. Clique em **"Save Changes"** (isso vai reiniciar o serviço)

---

### **Opção 2: Deploy via Blueprint (render.yaml)**

O arquivo `render.yaml` já está configurado! Você pode usar o deploy automático:

1. No dashboard do Render, clique em **"New +"** → **"Blueprint"**
2. Conecte seu repositório Git
3. O Render detectará automaticamente o `render.yaml`
4. **Configure as variáveis de ambiente** (elas não são sincronizadas automaticamente):
   - No serviço `backend-cora`: `CORA_CERT`, `CORA_KEY`, `ALLOWED_ORIGIN`
   - No serviço `form-fta-frontend`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CORA_BACKEND_URL`, `VITE_CORA_CLIENT_ID`
5. Clique em **"Apply"**

---

## 🔧 Configurações Importantes

### **Variáveis de Ambiente - Backend (backend-cora)**

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NODE_ENV` | Ambiente | `production` |
| `PORT` | Porta do servidor | `3001` |
| `ALLOWED_ORIGIN` | URL do frontend | `https://form-fta-frontend.onrender.com` |
| `CORA_CERT` | Certificado PEM completo | `-----BEGIN CERTIFICATE-----...` |
| `CORA_KEY` | Chave privada PEM completa | `-----BEGIN RSA PRIVATE KEY-----...` |

### **Variáveis de Ambiente - Frontend (form-fta-frontend)**

| Variável | Descrição | Onde Obter |
|----------|-----------|------------|
| `NODE_ENV` | Ambiente | `production` |
| `PORT` | Porta do servidor | `10000` |
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Dashboard Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima Supabase | Dashboard Supabase → Settings → API |
| `VITE_CORA_BACKEND_URL` | URL do backend no Render | Dashboard Render → backend-cora |
| `VITE_CORA_CLIENT_ID` | Client ID da Cora | `int-1ZVwf7iYC106q3iRWEmyJP` |
| `VITE_CORA_ENV` | Ambiente Cora | `production` ou `stage` |

---

## 🔍 Verificação Pós-Deploy

### **1. Testar Backend**

Acesse a documentação Swagger:
```
https://backend-cora-xxxx.onrender.com/api-docs
```

Teste o endpoint de token:
```bash
curl -X POST https://backend-cora-xxxx.onrender.com/api/cora/token \
  -H "Content-Type: application/json" \
  -d '{"clientId": "int-1ZVwf7iYC106q3iRWEmyJP", "env": "production"}'
```

### **2. Testar Frontend**

1. Acesse a URL do frontend
2. Faça login
3. Teste a geração de boleto no módulo Financeiro
4. Verifique se os logs do backend mostram as requisições

### **3. Verificar Logs**

No dashboard do Render:
- **Backend**: Verifique se não há erros de certificado
- **Frontend**: Verifique se o build foi bem-sucedido

---

## ⚠️ Problemas Comuns

### **Erro: "Certificate not found"**

**Solução**: Verifique se `CORA_CERT` e `CORA_KEY` foram copiados completamente, incluindo as linhas `-----BEGIN-----` e `-----END-----`.

### **Erro: CORS no frontend**

**Solução**: 
1. Verifique se `ALLOWED_ORIGIN` no backend está com a URL correta do frontend
2. Certifique-se de que não há `/` no final da URL
3. Reinicie o backend após alterar

### **Erro: "Failed to fetch" ao gerar boleto**

**Solução**:
1. Verifique se `VITE_CORA_BACKEND_URL` está correto
2. Verifique os logs do backend para ver o erro real
3. Teste o endpoint diretamente via Swagger

### **Frontend não carrega (página em branco)**

**Solução**:
1. Verifique se o build foi bem-sucedido (`npm run build`)
2. Verifique se o `server.js` está servindo os arquivos de `dist/`
3. Verifique os logs do frontend no Render

### **Serviço cai após inatividade (Free Plan)**

**Solução**: 
- No plano Free, serviços ficam "dormindo" após 15 minutos de inatividade
- A primeira requisição pode demorar ~30 segundos para "acordar"
- Considere upgrade para Starter ($7/mês) para evitar isso

---

## 📝 Checklist Final

- [ ] Backend deployado e acessível
- [ ] Frontend deployado e acessível
- [ ] Variáveis de ambiente configuradas
- [ ] `ALLOWED_ORIGIN` apontando para o frontend
- [ ] `VITE_CORA_BACKEND_URL` apontando para o backend
- [ ] Certificados Cora configurados corretamente
- [ ] Credenciais Supabase configuradas
- [ ] Teste de login funcionando
- [ ] Teste de geração de boleto funcionando
- [ ] Logs sem erros críticos

---

## 🔄 Atualizações Futuras

Para atualizar a aplicação:

1. Faça suas alterações no código
2. Commit e push para o repositório:
   ```bash
   git add .
   git commit -m "Descrição das mudanças"
   git push origin main
   ```
3. O Render detecta automaticamente e faz o redeploy
4. Aguarde o deploy finalizar (2-5 minutos)

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no dashboard do Render
2. Verifique a documentação do Render: [render.com/docs](https://render.com/docs)
3. Verifique os logs do backend via Swagger UI

---

## 🎉 Pronto!

Sua aplicação está no ar! 🚀

**URLs importantes:**
- Frontend: `https://form-fta-frontend-xxxx.onrender.com`
- Backend API: `https://backend-cora-xxxx.onrender.com`
- Swagger Docs: `https://backend-cora-xxxx.onrender.com/api-docs`
