-- Adicionar coluna 'nome' na tabela cadastro_links
-- Para identificar facilmente os links ao enviar para os líderes

ALTER TABLE public.cadastro_links
  ADD COLUMN IF NOT EXISTS nome text;

-- Criar índice para facilitar buscas por nome
CREATE INDEX IF NOT EXISTS idx_cadastro_links_nome ON public.cadastro_links(nome);

-- Comentário na coluna
COMMENT ON COLUMN public.cadastro_links.nome IS 'Nome ou descrição do link para identificação (ex: "Link para Equipe Alpha", "Cadastro Operadores SP")';

