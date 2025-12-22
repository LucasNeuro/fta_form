# 🎯 FTA Brasil - Sistema de Cadastro

Sistema completo de cadastro de operadores e equipes da FTA Brasil, desenvolvido com React, TypeScript e Supabase.

## 🚀 Tecnologias

- **React 18** - Framework frontend
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Supabase** - Backend e banco de dados
- **Tailwind CSS** - Estilização
- **React Router** - Navegação SPA
- **Express** - Servidor para deploy

## 📋 Funcionalidades

### Para Administradores
- ✅ Login seguro
- ✅ Criar links de cadastro de equipes
- ✅ Gerenciar equipes (visualizar, desativar, excluir)
- ✅ Criar links de cadastro de operadores vinculados a equipes
- ✅ Ativar/desativar links de cadastro
- ✅ Dashboard com estatísticas

### Cadastro de Equipes
- Formulário completo com validação
- Campos: Nome, Capitão, Cidade, Estado, Membros, Graduação FTA, etc.
- Links únicos e descartáveis

### Cadastro de Operadores
- Formulário completo com validação
- Vinculação automática à equipe (via link)
- Campos: Nome, Codinome, Cidade, Estado, Nascimento, Email, Telefone

## 🔧 Instalação

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn
- Conta no Supabase

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/LucasNeuro/fta_form.git
cd fta_form
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env.local` na raiz do projeto:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

4. **Execute o banco de dados**
- Acesse o SQL Editor no Supabase
- Execute o script `schema-completo-final.sql` (se tiver)
- Execute o script para adicionar campos `ativo` (se necessário)

5. **Crie o usuário admin**
- Execute o script SQL para criar o admin: `renatoadm@teste.com` / `@123456`

6. **Execute o projeto**
```bash
npm run dev
```

Acesse: `http://localhost:5173`

## 🗄️ Estrutura do Banco de Dados

### Tabelas
- `users` - Usuários do sistema (admin, responsáveis, etc.)
- `equipes` - Equipes cadastradas
- `operadores` - Operadores cadastrados
- `cadastro_links` - Links de cadastro (equipes e operadores)

## 🚀 Deploy

### Deploy no Render

1. Conecte o repositório no Render
2. Configure as variáveis de ambiente
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`

Veja instruções completas em `DEPLOY_RENDER.md`

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview do build de produção
- `npm start` - Inicia servidor Express (produção)
- `npm run lint` - Executa linter

## 🔐 Credenciais Padrão

**Admin:**
- Email: `renatoadm@teste.com`
- Senha: `@123456`

⚠️ **IMPORTANTE**: Altere estas credenciais em produção!

## 📁 Estrutura do Projeto

```
form_fta/
├── src/
│   ├── components/      # Componentes React
│   │   ├── Layout/     # Header, etc.
│   │   └── UI/         # Componentes reutilizáveis
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilitários (Supabase, tipos)
│   ├── pages/          # Páginas da aplicação
│   └── styles/         # Estilos globais
├── public/             # Arquivos públicos
├── server.js           # Servidor Express (produção)
└── package.json        # Dependências e scripts
```

## 🎨 Tema

- **Tema**: Escuro (#1a1a1a)
- **Cor Principal**: Verde (#10b981)
- **Design**: Moderno e responsivo

## 📚 Documentação Adicional

- `DEPLOY_RENDER.md` - Instruções de deploy no Render
- `INSTRUCOES_CRUD.md` - Como usar funcionalidades de CRUD
- `schema-completo-final.sql` - Script SQL completo do banco

## 🤝 Contribuindo

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e pertence à FTA Brasil.

## 👥 Autores

- **LucasNeuro** - Desenvolvimento inicial

## 🙏 Agradecimentos

- FTA Brasil pela confiança
- Comunidade open source

---

⭐ Se este projeto foi útil, considere dar uma estrela!
