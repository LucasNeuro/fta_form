-- Criação da tabela de anotações/observações
CREATE TABLE IF NOT EXISTS public.anotacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['equipe'::text, 'operador'::text])),
  equipe_id uuid,
  operador_id uuid,
  titulo text,
  descricao text NOT NULL,
  criado_por uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT anotacoes_pkey PRIMARY KEY (id),
  CONSTRAINT anotacoes_equipe_id_fkey FOREIGN KEY (equipe_id) REFERENCES public.equipes(id) ON DELETE CASCADE,
  CONSTRAINT anotacoes_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.operadores(id) ON DELETE CASCADE,
  CONSTRAINT anotacoes_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.users(id),
  CONSTRAINT anotacoes_check CHECK (
    (tipo = 'equipe' AND equipe_id IS NOT NULL AND operador_id IS NULL) OR
    (tipo = 'operador' AND operador_id IS NOT NULL)
  )
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_anotacoes_equipe_id ON public.anotacoes(equipe_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_operador_id ON public.anotacoes(operador_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_tipo ON public.anotacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_anotacoes_created_at ON public.anotacoes(created_at DESC);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_anotacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_anotacoes_updated_at ON public.anotacoes;
CREATE TRIGGER trigger_update_anotacoes_updated_at
  BEFORE UPDATE ON public.anotacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_anotacoes_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.anotacoes ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem fazer tudo
DROP POLICY IF EXISTS "Admins podem gerenciar todas as anotações" ON public.anotacoes;
CREATE POLICY "Admins podem gerenciar todas as anotações"
  ON public.anotacoes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Política: Responsáveis de equipe podem ver anotações da sua equipe
DROP POLICY IF EXISTS "Responsaveis podem ver anotacoes da sua equipe" ON public.anotacoes;
CREATE POLICY "Responsaveis podem ver anotacoes da sua equipe"
  ON public.anotacoes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.equipe_id = anotacoes.equipe_id
      AND users.role = 'responsavel_equipe'
    )
  );

-- Nota: Para operar com usuários customizados, vamos precisar ajustar as políticas RLS
-- Por enquanto, vamos permitir acesso total para admins através da função login_user
-- As políticas RLS serão ajustadas quando necessário

-- Para simplificar e permitir que o sistema customizado funcione, vamos desabilitar RLS temporariamente
-- e usar validações no código da aplicação
ALTER TABLE public.anotacoes DISABLE ROW LEVEL SECURITY;

