-- Adicionar coluna 'lab_fta' na tabela operadores
-- Para armazenar a quantidade de laboratórios FTA realizados pelo operador

ALTER TABLE public.operadores
  ADD COLUMN IF NOT EXISTS lab_fta integer DEFAULT 0;

-- Criar índice para facilitar buscas (opcional)
CREATE INDEX IF NOT EXISTS idx_operadores_lab_fta ON public.operadores(lab_fta) WHERE lab_fta IS NOT NULL;

-- Comentário na coluna
COMMENT ON COLUMN public.operadores.lab_fta IS 'Quantidade de laboratórios FTA realizados pelo operador (numérico)';

