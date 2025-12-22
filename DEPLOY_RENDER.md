# 🚀 Deploy no Render - FTA Brasil

## 📋 Pré-requisitos

1. Conta no [Render.com](https://render.com) (free tier funciona)
2. Repositório Git (GitHub, GitLab ou Bitbucket)
3. Credenciais do Supabase configuradas

## 🔧 Passo a Passo

### 1. Preparar o Repositório

```bash
# Adicionar arquivos necessários
git add .
git commit -m "Preparar para deploy no Render"
git push
```

### 2. Configurar Render

1. **Acesse Render Dashboard**
   - Vá para [dashboard.render.com](https://dashboard.render.com)
   - Faça login ou crie uma conta

2. **Criar Novo Web Service**
   - Clique em "New +"
   - Selecione "Web Service"
   - Conecte seu repositório Git

3. **Configurações do Serviço**
   - **Name**: `form-fta` (ou o nome que preferir)
   - **Environment**: `Node`
   - **Region**: Escolha a mais próxima (ex: `Oregon`)
   - **Branch**: `main` (ou sua branch principal)
   - **Root Directory**: (deixe em branco)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (ou pago se preferir)

4. **Variáveis de Ambiente**
   - Clique em "Advanced"
   - Adicione as variáveis:
     ```
     VITE_SUPABASE_URL = https://seu-projeto.supabase.co
     VITE_SUPABASE_ANON_KEY = sua-chave-anon-aqui
     ```
   - ⚠️ **IMPORTANTE**: Use os valores exatos do seu Supabase

5. **Deploy**
   - Clique em "Create Web Service"
   - Aguarde o build (pode levar 5-10 minutos na primeira vez)
   - O Render fornecerá uma URL como: `https://form-fta.onrender.com`

## 🔗 Links Funcionando

Os links são gerados automaticamente usando `window.location.origin`, então funcionarão perfeitamente no Render!

**Exemplo de link gerado:**
```
https://form-fta.onrender.com/cadastro/operador/80ec2db0-1763-46db-b233-e1c877225937
```

## ✅ Verificação Pós-Deploy

1. **Acesse a URL fornecida pelo Render**
2. **Teste o Login**
   - Email: `renatoadm@teste.com`
   - Senha: `@123456`

3. **Teste Criar Links**
   - Vá em Admin → Criar link de equipe
   - Vá em Equipes → Clique no olho → Criar link de operador
   - Verifique se os links são gerados corretamente

4. **Teste Acessar Link**
   - Copie um link gerado
   - Abra em nova aba
   - Deve abrir o formulário de cadastro

## 🐛 Troubleshooting

### Build Falha
- Verifique se todas as dependências estão no `package.json`
- Veja os logs de build no Render Dashboard
- Certifique-se que o Node.js está na versão correta (16+)

### Links Não Funcionam
- ✅ Os links já estão configurados para usar `window.location.origin`
- Verifique se a URL do Render está correta
- Teste copiando um link e abrindo em nova aba

### Erro 404 nas Rotas
- O `server.js` já está configurado para servir `index.html` em todas as rotas
- Verifique se o build foi concluído com sucesso

### Variáveis de Ambiente
- Verifique se as variáveis estão configuradas no Render
- Reinicie o serviço após adicionar variáveis
- Use exatamente: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`

### Erro de CORS no Supabase
1. No Supabase Dashboard, vá em **Settings → API**
2. Em **CORS Configuration**, adicione:
   - `https://form-fta.onrender.com`
   - `https://seu-app.onrender.com` (use sua URL exata)
3. Salve e aguarde alguns minutos

### App "Sleep" (Free Plan)
- Na primeira requisição após inatividade, pode demorar ~30s
- É normal no plano free
- Considere upgrade para plano pago se necessário

## 🔒 Segurança

1. **Não commite `.env` no Git** ✅ (já está no .gitignore)
2. **Use variáveis de ambiente no Render** ✅
3. **Configure CORS no Supabase** ✅
4. **Use HTTPS** ✅ (Render fornece automaticamente)

## 📊 Monitoramento

- Render fornece logs em tempo real
- Acesse "Logs" no Dashboard para ver erros
- Configure alertas se necessário

## 🚀 Deploy Automático

O Render faz deploy automático quando você faz push no Git:
```bash
git push origin main
```

O Render detecta automaticamente e inicia um novo deploy!

## 💰 Plano Free

- 750 horas/mês grátis
- Sleep após 15 min de inatividade
- Primeira requisição pode demorar ~30s (cold start)
- Suporta HTTPS automático
- Sempre grátis (não expira)

## 📁 Arquivos de Deploy

- ✅ `render.yaml` - Configuração do Render (opcional)
- ✅ `server.js` - Servidor Express para servir SPA
- ✅ `package.json` - Scripts de build e start
- ✅ `vite.config.ts` - Configuração do Vite

## ✅ Checklist Final

- [ ] Repositório Git configurado e código commitado
- [ ] Render conectado ao repositório Git
- [ ] Variáveis de ambiente configuradas no Render
- [ ] Build executado com sucesso
- [ ] URL acessível
- [ ] Login funcionando
- [ ] Links sendo gerados corretamente
- [ ] Links funcionando ao acessar
- [ ] CORS configurado no Supabase

## 🎉 Pronto!

Após seguir estes passos, sua aplicação estará no ar no Render!

**URL do seu app**: `https://form-fta.onrender.com` (ou o nome que você escolheu)

---

### 💡 Dicas

1. **Primeiro deploy pode demorar** - Paciência na primeira vez!
2. **Cold start** - Primeira requisição após sleep demora ~30s
3. **Logs são seus amigos** - Sempre verifique os logs se algo não funcionar
4. **Teste os links** - Sempre teste criar e acessar links após deploy
