-- Adicionar coluna PAT SAR na tabela operadores
-- Este campo indica se o operador possui PAT SAR (Sim/Não)

ALTER TABLE public.operadores
ADD COLUMN IF NOT EXISTS pat_sar BOOLEAN DEFAULT false;

-- Comentário na coluna
COMMENT ON COLUMN public.operadores.pat_sar IS 'Indica se o operador possui PAT SAR (true = Sim, false = Não)';

-- Criar índice para melhorar performance em consultas filtradas por PAT SAR
CREATE INDEX IF NOT EXISTS idx_operadores_pat_sar 
ON public.operadores (pat_sar) 
WHERE pat_sar IS NOT NULL;

-- Atualizar operadores existentes para ter valor padrão (false = Não)
UPDATE public.operadores
SET pat_sar = false
WHERE pat_sar IS NULL;
