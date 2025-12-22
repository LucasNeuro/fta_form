# 📤 Comandos Git para Enviar para GitHub

Execute estes comandos na ordem para criar o repositório e enviar todos os arquivos:

## 🚀 Passo a Passo

### 1. Inicializar Git (se ainda não foi feito)
```bash
git init
```

### 2. Adicionar todos os arquivos
```bash
git add .
```

### 3. Fazer primeiro commit
```bash
git commit -m "Initial commit - Sistema FTA Brasil completo"
```

### 4. Renomear branch para main
```bash
git branch -M main
```

### 5. Adicionar remote do GitHub
```bash
git remote add origin https://github.com/LucasNeuro/fta_form.git
```

### 6. Fazer push para o GitHub
```bash
git push -u origin main
```

## 📋 Comandos Completos (copie e cole tudo)

```bash
cd c:\Users\anima\OneDrive\Desktop\form_fta

git init
git add .
git commit -m "Initial commit - Sistema FTA Brasil completo"
git branch -M main
git remote add origin https://github.com/LucasNeuro/fta_form.git
git push -u origin main
```

## ⚠️ Se o repositório já existir no GitHub

Se você já criou o repositório no GitHub com o README.md, use:

```bash
git init
git add .
git commit -m "Initial commit - Sistema FTA Brasil completo"
git branch -M main
git remote add origin https://github.com/LucasNeuro/fta_form.git
git pull origin main --allow-unrelated-histories
git push -u origin main
```

## ✅ Arquivos que SERÃO enviados

✅ Todo o código fonte
✅ `package.json` e `package-lock.json`
✅ Configurações (vite, tailwind, etc.)
✅ `README.md`
✅ `server.js` (para deploy)
✅ `render.yaml` (configuração Render)
✅ Documentação (.md files)

## ❌ Arquivos que NÃO serão enviados (estão no .gitignore)

❌ `node_modules/`
❌ `.env` e `.env.local`
❌ `dist/` (build)
❌ Logs
❌ Arquivos de editor (.vscode, .idea, etc.)

## 🔐 Importante

- ⚠️ **NUNCA** commite arquivos `.env` ou `.env.local`
- ⚠️ Configure as variáveis de ambiente no Render após deploy
- ✅ O `.gitignore` já está configurado corretamente

## 🐛 Se der erro de autenticação

Se pedir usuário e senha:
1. Use um **Personal Access Token** do GitHub (não sua senha)
2. Ou configure SSH:
```bash
git remote set-url origin git@github.com:LucasNeuro/fta_form.git
```

## ✨ Após o Push

1. Acesse: https://github.com/LucasNeuro/fta_form
2. Verifique se todos os arquivos foram enviados
3. Configure o deploy no Render seguindo `DEPLOY_RENDER.md`

