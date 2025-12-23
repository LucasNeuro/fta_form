# 🔬 Adicionar Campo LAB FTA no Cadastro de Operador

## ✅ O que foi feito:

1. ✅ Adicionado campo `lab_fta` (numérico) na interface TypeScript `Operador`
2. ✅ Atualizado formulário de cadastro de operador (`CadastroComLink.tsx`)
3. ✅ Atualizada tabela de listagem de operadores (`ListaOperadores.tsx`)
4. ✅ Campo numérico - quantidade de laboratórios FTA realizados

## 🔧 Atualização do Banco de Dados

**IMPORTANTE**: Execute o SQL abaixo no Supabase para adicionar a coluna `lab_fta`:

### 1. Acesse o Supabase Dashboard

1. Vá para: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor**

### 2. Execute o SQL:

```sql
-- Adicionar coluna 'lab_fta' na tabela operadores
ALTER TABLE public.operadores
  ADD COLUMN IF NOT EXISTS lab_fta integer DEFAULT 0;

-- Criar índice para facilitar buscas (opcional)
CREATE INDEX IF NOT EXISTS idx_operadores_lab_fta ON public.operadores(lab_fta) WHERE lab_fta IS NOT NULL;

-- Comentário na coluna
COMMENT ON COLUMN public.operadores.lab_fta IS 'Quantidade de laboratórios FTA realizados pelo operador (numérico)';
```

**OU** execute o arquivo `schema-add-lab-fta-operador.sql` que já está no repositório.

### 3. Verificar

Após executar, verifique se a coluna foi adicionada:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'operadores' AND column_name = 'lab_fta';
```

Deve retornar: `lab_fta | integer | 0`

## 🎯 Como Usar:

### No Cadastro de Operador:

1. Ao cadastrar um operador através de um link de cadastro
2. Preencha o campo **"LAB FTA (numérico)"**
3. Informe a quantidade de laboratórios FTA realizados (ex: 0, 1, 2, 5, etc.)
4. Campo obrigatório - deve preencher com um número

### Visualização:

1. Vá em **Operadores**
2. Na tabela, você verá uma coluna **"LAB FTA"** com a quantidade informada
3. O valor é exibido com destaque em verde

## 💡 Exemplos:

- `0` - Operador que ainda não realizou laboratórios
- `1` - Operador que realizou 1 laboratório
- `5` - Operador que realizou 5 laboratórios
- `10` - Operador com 10 laboratórios realizados

## ✅ Benefícios:

1. ✅ **Rastreamento**: Controla quantos laboratórios FTA cada operador realizou
2. ✅ **Visibilidade**: Campo visível na lista de operadores
3. ✅ **Obrigatório**: Garante que o campo seja preenchido
4. ✅ **Numérico**: Validação automática de números

## 🚀 Pronto!

Após executar o SQL, a funcionalidade estará completa e você poderá cadastrar a quantidade de laboratórios FTA para cada operador!

