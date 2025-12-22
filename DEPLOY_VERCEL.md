# 🚀 Deploy no Vercel - FTA Brasil

## 📋 Pré-requisitos

1. Conta no [Vercel](https://vercel.com) (free tier funciona perfeitamente)
2. Repositório no GitHub conectado

## 🔧 Passo a Passo

### 1. Acessar Vercel

1. Vá para [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub

### 2. Importar Projeto

1. Clique em **"Add New..."** → **"Project"**
2. Selecione o repositório `LucasNeuro/fta_form`
3. Clique em **"Import"**

### 3. Configurações do Projeto

O Vercel detecta automaticamente que é um projeto Vite, mas verifique:

- **Framework Preset**: Vite (deve detectar automaticamente)
- **Root Directory**: `.` (deixar em branco)
- **Build Command**: `npm run build` (já está configurado)
- **Output Directory**: `dist` (já está configurado)
- **Install Command**: `npm install` (padrão)

### 4. Variáveis de Ambiente

**IMPORTANTE**: Adicione as variáveis de ambiente:

1. Clique em **"Environment Variables"**
2. Adicione:
   ```
   VITE_SUPABASE_URL = https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY = sua-chave-anon-aqui
   ```
3. Marque para **Production**, **Preview** e **Development**
4. Clique em **"Save"**

### 5. Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (2-5 minutos)
3. Seu app estará em: `https://fta-form-xxx.vercel.app`

## ✅ Verificação Pós-Deploy

1. **Acesse a URL fornecida pelo Vercel**
2. **Teste o Login**
   - Email: `renatoadm@teste.com`
   - Senha: `@123456`

3. **Teste os Links**
   - Crie um link de equipe ou operador
   - Verifique se o link funciona corretamente

## 🔗 Links Funcionando

Os links são gerados automaticamente usando `window.location.origin`, então funcionarão perfeitamente no Vercel!

**Exemplo:**
```
https://fta-form-xxx.vercel.app/cadastro/operador/80ec2db0-1763-46db-b233-e1c877225937
```

## 🐛 Troubleshooting

### Build Falha

**Erro comum**: "Cannot find module" ou erros de TypeScript

**Solução**:
1. Verifique se `node_modules` está no `.gitignore` ✅ (já está)
2. Verifique os logs de build no Vercel
3. Teste localmente: `npm run build`

### Erro 404 nas Rotas

**Solução**: O arquivo `vercel.json` já está configurado com rewrites para SPA ✅

### Variáveis de Ambiente

**Erro**: "Variáveis de ambiente do Supabase não configuradas"

**Solução**:
1. Vá em Project Settings → Environment Variables
2. Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. Faça um novo deploy

### Erro de CORS no Supabase

1. No Supabase Dashboard → Settings → API
2. Adicione o domínio do Vercel:
   - `https://fta-form-xxx.vercel.app`
   - `https://*.vercel.app` (para previews)
3. Salve e aguarde alguns minutos

### Build lento

- Normal na primeira vez (instala dependências)
- Builds subsequentes são mais rápidos (usam cache)

## 🔒 Segurança

1. ✅ Variáveis de ambiente no Vercel (não no código)
2. ✅ `.gitignore` protege arquivos sensíveis
3. ✅ HTTPS automático no Vercel
4. ✅ Headers de segurança configurados no `vercel.json`

## 📊 Vantagens do Vercel

- ✅ Deploy automático a cada push
- ✅ Preview deployments para PRs
- ✅ HTTPS automático
- ✅ CDN global
- ✅ Builds rápidos
- ✅ Sempre online (não "dorme")
- ✅ Plano free generoso

## 🚀 Deploy Automático

O Vercel faz deploy automático quando você faz push:

```bash
git add .
git commit -m "Nova feature"
git push origin main
```

O Vercel detecta automaticamente e faz deploy!

## 💰 Plano Free

- ✅ Builds ilimitados
- ✅ 100GB bandwidth/mês
- ✅ Domínio `.vercel.app` grátis
- ✅ HTTPS automático
- ✅ Sempre online (não dorme)
- ✅ Preview deployments

## 📁 Arquivos de Configuração

- ✅ `vercel.json` - Configuração do Vercel (SPA routing)
- ✅ `package.json` - Scripts de build
- ✅ `.gitignore` - Arquivos ignorados

## ✅ Checklist

- [ ] Conta Vercel criada
- [ ] Repositório importado
- [ ] Variáveis de ambiente configuradas
- [ ] Build executado com sucesso
- [ ] URL acessível
- [ ] Login funcionando
- [ ] Links sendo gerados
- [ ] Links funcionando ao acessar
- [ ] CORS configurado no Supabase

## 🎉 Pronto!

Após seguir estes passos, sua aplicação estará no ar no Vercel!

**URL**: `https://fta-form-xxx.vercel.app` (ou domínio customizado)

---

### 💡 Dica

Se você já tentou fazer deploy e deu erro, tente:
1. Verificar os logs completos de build no Vercel
2. Testar build local: `npm run build`
3. Verificar se as variáveis de ambiente estão configuradas
4. Fazer deploy novamente


