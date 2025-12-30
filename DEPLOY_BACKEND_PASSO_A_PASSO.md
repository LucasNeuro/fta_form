# 🔧 Deploy do Backend no Render - Passo a Passo Detalhado

## 📋 O que vamos fazer

Vamos fazer o deploy do **backend-cora** (servidor Node.js/Express para integração com API Cora).

---

## ✅ Pré-requisitos

Antes de começar, tenha em mãos:

1. ✅ **Conta no Render** - [render.com](https://render.com) (crie se não tiver)
2. ✅ **Repositório Git** - Seu código no GitHub/GitLab/Bitbucket
3. ✅ **Certificado Cora** - Arquivo `certificate.pem` aberto
4. ✅ **Chave Privada Cora** - Arquivo `private-key.pem` aberto

---

## 🚀 PASSO 1: Acessar o Render

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Faça login (ou crie uma conta se necessário)
3. Você verá o dashboard principal

---

## 🚀 PASSO 2: Criar Novo Serviço

1. No canto superior direito, clique em **"New +"**
2. No menu que aparece, clique em **"Web Service"**
3. Você será redirecionado para a página de criação

---

## 🚀 PASSO 3: Conectar Repositório Git

### 3.1. Primeira vez (se ainda não conectou):

1. Você verá opções para conectar:
   - **GitHub** (recomendado)
   - **GitLab**
   - **Bitbucket**
2. Clique em **"Connect GitHub"** (ou sua plataforma)
3. Autorize o Render a acessar seus repositórios
4. Selecione o repositório (ex: `LucasNeuro/fta_form`)
5. Clique em **"Connect"**

### 3.2. Se já conectou antes:

1. Selecione seu repositório na lista
2. Clique em **"Connect"**

---

## 🚀 PASSO 4: Configurar o Backend

Agora você verá um formulário. Preencha assim:

### **Informações Básicas:**

- **Name**: 
  ```
  backend-cora
  ```
  ⚠️ Este será o nome do seu serviço

- **Region**: 
  ```
  Oregon (US West)
  ```
  Ou escolha a região mais próxima de você

- **Branch**: 
  ```
  main
  ```
  (ou sua branch principal)

### **Configurações de Build e Deploy:**

- **Root Directory**: 
  ```
  backend-cora
  ```
  ⚠️ **MUITO IMPORTANTE**: Deve ser `backend-cora` (não `.`)

- **Environment**: 
  ```
  Node
  ```
  (já deve estar selecionado)

- **Build Command**: 
  ```
  npm install
  ```
  (instala as dependências)

- **Start Command**: 
  ```
  npm start
  ```
  (inicia o servidor)

### **Plano:**

- **Plan**: 
  ```
  Free
  ```
  (ou `Starter` se quiser melhor performance)

---

## 🚀 PASSO 5: Configurar Variáveis de Ambiente

Esta é a parte mais importante! Clique em **"Advanced"** para expandir as opções avançadas.

### 5.1. Adicionar Variáveis

Clique em **"Add Environment Variable"** para cada variável abaixo:

#### **Variável 1: NODE_ENV**
- **Key**: `NODE_ENV`
- **Value**: `production`
- Clique em **"Add"**

#### **Variável 2: PORT**
- **Key**: `PORT`
- **Value**: `3001`
- Clique em **"Add"**

#### **Variável 3: ALLOWED_ORIGIN**
- **Key**: `ALLOWED_ORIGIN`
- **Value**: `https://form-fta-frontend.onrender.com`
- ⚠️ **Nota**: Você vai atualizar isso depois com a URL real do frontend
- Clique em **"Add"**

#### **Variável 4: CORA_CERT** ⚠️ IMPORTANTE
- **Key**: `CORA_CERT`
- **Value**: 
  ```
  [COLE AQUI O CONTEÚDO COMPLETO DO certificate.pem]
  ```
  
  **Como copiar corretamente:**
  1. Abra o arquivo `certificate.pem` no seu computador
  2. Selecione **TODO o conteúdo** (Ctrl+A)
  3. Copie (Ctrl+C)
  4. Cole no campo Value
  5. Deve incluir as linhas:
     ```
     -----BEGIN CERTIFICATE-----
     ...conteúdo...
     -----END CERTIFICATE-----
     ```
  
  ⚠️ **IMPORTANTE**: 
  - Copie exatamente como está
  - Não adicione espaços extras
  - Não remova as linhas BEGIN/END
  - O valor pode ter várias linhas (isso é normal)
  
- Clique em **"Add"**

#### **Variável 5: CORA_KEY** ⚠️ IMPORTANTE
- **Key**: `CORA_KEY`
- **Value**: 
  ```
  [COLE AQUI O CONTEÚDO COMPLETO DO private-key.pem]
  ```
  
  **Como copiar corretamente:**
  1. Abra o arquivo `private-key.pem` no seu computador
  2. Selecione **TODO o conteúdo** (Ctrl+A)
  3. Copie (Ctrl+C)
  4. Cole no campo Value
  5. Deve incluir as linhas:
     ```
     -----BEGIN RSA PRIVATE KEY-----
     ...conteúdo...
     -----END RSA PRIVATE KEY-----
     ```
  
  ⚠️ **IMPORTANTE**: 
  - Copie exatamente como está
  - Não adicione espaços extras
  - Não remova as linhas BEGIN/END
  - O valor pode ter várias linhas (isso é normal)
  
- Clique em **"Add"**

### 5.2. Verificar Variáveis

Você deve ter 5 variáveis configuradas:
- ✅ `NODE_ENV = production`
- ✅ `PORT = 3001`
- ✅ `ALLOWED_ORIGIN = https://form-fta-frontend.onrender.com`
- ✅ `CORA_CERT = [seu certificado]`
- ✅ `CORA_KEY = [sua chave]`

---

## 🚀 PASSO 6: Criar o Serviço

1. Revise todas as configurações
2. Verifique se o **Root Directory** está como `backend-cora`
3. Verifique se todas as variáveis foram adicionadas
4. Clique em **"Create Web Service"** no final da página

---

## ⏳ PASSO 7: Aguardar o Deploy

1. Você será redirecionado para a página do serviço
2. Você verá o progresso do deploy em tempo real
3. O processo leva aproximadamente **2-5 minutos**

**O que acontece:**
- ✅ Clona o repositório
- ✅ Instala dependências (`npm install`)
- ✅ Inicia o servidor (`npm start`)
- ✅ Verifica se está rodando

---

## ✅ PASSO 8: Verificar se Funcionou

### 8.1. Verificar Status

Quando o deploy terminar, você verá:
- ✅ **"Your service is live"** (verde)
- ✅ Status: **"Live"**
- ✅ URL do serviço no topo

### 8.2. Copiar a URL

**IMPORTANTE**: Copie a URL do backend! Você vai precisar dela para o frontend.

A URL será algo como:
```
https://backend-cora-xxxx.onrender.com
```

⚠️ **Anote essa URL!** Você vai usar ela no frontend.

### 8.3. Testar o Backend

1. **Teste a documentação Swagger:**
   - Acesse: `https://backend-cora-xxxx.onrender.com/api-docs`
   - Deve abrir a interface Swagger com a documentação da API
   - ✅ Se abrir, o backend está funcionando!

2. **Teste o endpoint de token (opcional):**
   - Na interface Swagger, teste o endpoint `POST /api/cora/token`
   - Deve retornar um token de acesso
   - ✅ Se funcionar, está tudo certo!

### 8.4. Verificar Logs

1. Na página do serviço, clique na aba **"Logs"**
2. Você deve ver mensagens como:
   ```
   ✅ Certificado e chave carregados de variáveis de ambiente
   Servidor rodando na porta 3001
   ```
3. Se houver erros, eles aparecerão aqui

---

## ❌ Se Algo Der Errado

### Erro: "Certificate not found"

**Causa**: Certificado não foi copiado corretamente

**Solução**:
1. Vá em **Environment** → Edite `CORA_CERT`
2. Certifique-se de copiar **TODO o conteúdo** do arquivo
3. Inclua as linhas `-----BEGIN CERTIFICATE-----` e `-----END CERTIFICATE-----`
4. Salve e aguarde o redeploy

### Erro: "Key not found"

**Causa**: Chave privada não foi copiada corretamente

**Solução**:
1. Vá em **Environment** → Edite `CORA_KEY`
2. Certifique-se de copiar **TODO o conteúdo** do arquivo
3. Inclua as linhas `-----BEGIN RSA PRIVATE KEY-----` e `-----END RSA PRIVATE KEY-----`
4. Salve e aguarde o redeploy

### Erro: "Root Directory not found"

**Causa**: Root Directory está incorreto

**Solução**:
1. Vá em **Settings** → **Build & Deploy**
2. Altere **Root Directory** para: `backend-cora`
3. Salve e faça um novo deploy

### Erro no Build

**Causa**: Dependências ou código com erro

**Solução**:
1. Veja os logs completos
2. Verifique se `npm install` funciona localmente
3. Corrija os erros no código
4. Faça commit e push
5. O Render fará redeploy automaticamente

---

## ✅ Checklist do Backend

Antes de prosseguir para o frontend, verifique:

- [ ] Backend deployado com sucesso
- [ ] Status mostra "Live" (verde)
- [ ] URL do backend copiada e anotada
- [ ] Swagger UI acessível (`/api-docs`)
- [ ] Logs mostram "Certificado e chave carregados"
- [ ] Logs mostram "Servidor rodando na porta 3001"
- [ ] Sem erros nos logs

---

## 🎉 Próximo Passo

Agora que o backend está funcionando, você pode:

1. **Fazer deploy do frontend** (próximo passo)
2. **Atualizar `ALLOWED_ORIGIN`** depois que o frontend estiver no ar

---

## 📝 Resumo das Configurações

| Campo | Valor |
|-------|-------|
| Name | `backend-cora` |
| Root Directory | `backend-cora` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| NODE_ENV | `production` |
| PORT | `3001` |
| ALLOWED_ORIGIN | `https://form-fta-frontend.onrender.com` (atualizar depois) |
| CORA_CERT | [conteúdo completo do certificate.pem] |
| CORA_KEY | [conteúdo completo do private-key.pem] |

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas:
1. Verifique os logs na aba **"Logs"**
2. Verifique se todas as variáveis estão configuradas
3. Teste localmente primeiro (`npm install` e `npm start` no diretório `backend-cora`)
4. Verifique se os certificados foram copiados completamente

**Boa sorte com o deploy! 🚀**
