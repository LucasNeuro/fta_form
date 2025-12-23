# 📸 Adicionar Campo Instagram no Cadastro de Equipe

## ✅ O que foi feito:

1. ✅ Adicionado campo `instagram` na interface TypeScript `Equipe`
2. ✅ Atualizado formulário de cadastro de equipe (`CadastroComLink.tsx`)
3. ✅ Atualizado exibição de detalhes da equipe no sideover (`ListaEquipes.tsx`)
4. ✅ Campo opcional - não é obrigatório preencher

## 🔧 Atualização do Banco de Dados

**IMPORTANTE**: Execute o SQL abaixo no Supabase para adicionar a coluna `instagram`:

### 1. Acesse o Supabase Dashboard

1. Vá para: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor**

### 2. Execute o SQL:

```sql
-- Adicionar coluna 'instagram' na tabela equipes
ALTER TABLE public.equipes
  ADD COLUMN IF NOT EXISTS instagram text;

-- Criar índice para facilitar buscas (opcional)
CREATE INDEX IF NOT EXISTS idx_equipes_instagram ON public.equipes(instagram) WHERE instagram IS NOT NULL;

-- Comentário na coluna
COMMENT ON COLUMN public.equipes.instagram IS 'Link do Instagram da equipe (ex: https://instagram.com/equipe_nome)';
```

**OU** execute o arquivo `schema-add-instagram-equipe.sql` que já está no repositório.

### 3. Verificar

Após executar, verifique se a coluna foi adicionada:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'equipes' AND column_name = 'instagram';
```

Deve retornar: `instagram | text`

## 🎯 Como Usar:

### No Cadastro de Equipe:

1. Ao cadastrar uma equipe através de um link de cadastro
2. Preencha o campo **"Link do Instagram"** (opcional)
3. Exemplo de valores:
   - `https://instagram.com/equipe_alpha`
   - `https://www.instagram.com/equipe_alpha/`
   - `@equipe_alpha` (será convertido para link completo)

### Visualização:

1. Vá em **Equipes**
2. Clique no ícone 👁️ ao lado de uma equipe
3. No painel lateral, você verá o link do Instagram (se preenchido)
4. O link é clicável e abre em uma nova aba

## 💡 Exemplos de Links:

- `https://instagram.com/equipe_alpha`
- `https://www.instagram.com/equipe_alpha/`
- `https://instagram.com/equipe_beta_brasil`

## ✅ Benefícios:

1. ✅ **Rede Social**: Fácil acesso ao Instagram da equipe
2. ✅ **Marketing**: Promove as equipes nas redes sociais
3. ✅ **Integração**: Conecta o sistema com as redes sociais
4. ✅ **Opcional**: Não obrigatório, pode ser preenchido depois

## 🚀 Pronto!

Após executar o SQL, a funcionalidade estará completa e você poderá adicionar links do Instagram nas equipes!

