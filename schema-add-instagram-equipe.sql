-- Adicionar coluna 'instagram' na tabela equipes
-- Para armazenar o link do Instagram da equipe

ALTER TABLE public.equipes
  ADD COLUMN IF NOT EXISTS instagram text;

-- Criar índice para facilitar buscas (opcional)
CREATE INDEX IF NOT EXISTS idx_equipes_instagram ON public.equipes(instagram) WHERE instagram IS NOT NULL;

-- Comentário na coluna
COMMENT ON COLUMN public.equipes.instagram IS 'Link do Instagram da equipe (ex: https://instagram.com/equipe_nome)';

