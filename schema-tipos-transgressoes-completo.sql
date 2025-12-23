-- =====================================================
-- SCRIPT COMPLETO: TIPOS DE TRANSGRESSÕES
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Criar tabela tipos_transgressoes
CREATE TABLE IF NOT EXISTS public.tipos_transgressoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  criado_por uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT tipos_transgressoes_pkey PRIMARY KEY (id),
  CONSTRAINT tipos_transgressoes_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.users(id)
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_tipos_transgressoes_ativo ON public.tipos_transgressoes(ativo);
CREATE INDEX IF NOT EXISTS idx_tipos_transgressoes_criado_por ON public.tipos_transgressoes(criado_por);

-- 3. Habilitar RLS
ALTER TABLE public.tipos_transgressoes ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS
-- Policy: Admins podem ver todos os tipos
-- NOTA: Como estamos usando autenticação customizada, vamos usar uma abordagem diferente
-- Permitir acesso direto via service_role ou verificar pelo usuário logado no localStorage
DROP POLICY IF EXISTS "Admins can view all transgression types" ON public.tipos_transgressoes;
CREATE POLICY "Admins can view all transgression types" ON public.tipos_transgressoes
  FOR SELECT USING (true); -- Permitir leitura para todos autenticados (será validado no frontend)

-- Policy: Admins podem inserir novos tipos
DROP POLICY IF EXISTS "Admins can insert transgression types" ON public.tipos_transgressoes;
CREATE POLICY "Admins can insert transgression types" ON public.tipos_transgressoes
  FOR INSERT WITH CHECK (true); -- Permitir inserção (validação no frontend)

-- Policy: Admins podem atualizar tipos
DROP POLICY IF EXISTS "Admins can update transgression types" ON public.tipos_transgressoes;
CREATE POLICY "Admins can update transgression types" ON public.tipos_transgressoes
  FOR UPDATE USING (true) WITH CHECK (true); -- Permitir atualização (validação no frontend)

-- Policy: Admins podem deletar tipos
DROP POLICY IF EXISTS "Admins can delete transgression types" ON public.tipos_transgressoes;
CREATE POLICY "Admins can delete transgression types" ON public.tipos_transgressoes
  FOR DELETE USING (true); -- Permitir deleção (validação no frontend)

-- 5. Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_tipos_transgressoes_updated_at ON public.tipos_transgressoes;
CREATE TRIGGER update_tipos_transgressoes_updated_at
  BEFORE UPDATE ON public.tipos_transgressoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Adicionar campos na tabela anotacoes (se ainda não existirem)
ALTER TABLE public.anotacoes 
  ADD COLUMN IF NOT EXISTS tipo_transgressao_id uuid,
  ADD COLUMN IF NOT EXISTS data_evento date,
  ADD COLUMN IF NOT EXISTS nome_evento text,
  ADD COLUMN IF NOT EXISTS local_evento text,
  ADD COLUMN IF NOT EXISTS e_transgressao boolean DEFAULT false;

-- 7. Adicionar foreign key (se ainda não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'anotacoes_tipo_transgressao_id_fkey'
    ) THEN
        ALTER TABLE public.anotacoes
        ADD CONSTRAINT anotacoes_tipo_transgressao_id_fkey 
        FOREIGN KEY (tipo_transgressao_id) REFERENCES public.tipos_transgressoes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 8. Criar índices para novos campos na tabela anotacoes
CREATE INDEX IF NOT EXISTS idx_anotacoes_tipo_transgressao_id ON public.anotacoes(tipo_transgressao_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_e_transgressao ON public.anotacoes(e_transgressao);
CREATE INDEX IF NOT EXISTS idx_anotacoes_data_evento ON public.anotacoes(data_evento);

-- 9. Inserir tipos padrão de transgressões
DO $$
DECLARE
    admin_id uuid;
BEGIN
    -- Buscar ID do primeiro admin
    SELECT id INTO admin_id FROM public.users WHERE role = 'admin' LIMIT 1;
    
    IF admin_id IS NULL THEN
        RAISE NOTICE 'AVISO: Nenhum usuário admin encontrado. Os tipos padrão não serão inseridos.';
        RETURN;
    END IF;

    -- Inserir tipos de transgressões padrão
    INSERT INTO public.tipos_transgressoes (nome, descricao, criado_por, ativo)
    SELECT 'Falta sem justificativa', 'Ausência em atividade sem justificativa válida', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.tipos_transgressoes WHERE nome = 'Falta sem justificativa');

    INSERT INTO public.tipos_transgressoes (nome, descricao, criado_por, ativo)
    SELECT 'Cronagem fora', 'Cronagem inadequada ou fora do padrão', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.tipos_transgressoes WHERE nome = 'Cronagem fora');

    INSERT INTO public.tipos_transgressoes (nome, descricao, criado_por, ativo)
    SELECT 'Kit SAR fora', 'Kit SAR inadequado ou ausente', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.tipos_transgressoes WHERE nome = 'Kit SAR fora');

    INSERT INTO public.tipos_transgressoes (nome, descricao, criado_por, ativo)
    SELECT 'Bebida/outros em campo', 'Consumo de bebida ou outros itens proibidos em campo', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.tipos_transgressoes WHERE nome = 'Bebida/outros em campo');

    INSERT INTO public.tipos_transgressoes (nome, descricao, criado_por, ativo)
    SELECT 'Hicap em campo', 'Uso inadequado de hicap em campo', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.tipos_transgressoes WHERE nome = 'Hicap em campo');

    INSERT INTO public.tipos_transgressoes (nome, descricao, criado_por, ativo)
    SELECT 'Munição fora', 'Munição inadequada ou fora do padrão', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.tipos_transgressoes WHERE nome = 'Munição fora');

    INSERT INTO public.tipos_transgressoes (nome, descricao, criado_por, ativo)
    SELECT 'Discussão', 'Envolvimento em discussões inadequadas', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.tipos_transgressoes WHERE nome = 'Discussão');

    INSERT INTO public.tipos_transgressoes (nome, descricao, criado_por, ativo)
    SELECT 'Agressão', 'Atos de agressão física ou verbal', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.tipos_transgressoes WHERE nome = 'Agressão');

    INSERT INTO public.tipos_transgressoes (nome, descricao, criado_por, ativo)
    SELECT 'Desrespeito', 'Atos de desrespeito a colegas ou superiores', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.tipos_transgressoes WHERE nome = 'Desrespeito');

    INSERT INTO public.tipos_transgressoes (nome, descricao, criado_por, ativo)
    SELECT 'Abandono sem justificativa', 'Abandono de atividade sem justificativa válida', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.tipos_transgressoes WHERE nome = 'Abandono sem justificativa');

    INSERT INTO public.tipos_transgressoes (nome, descricao, criado_por, ativo)
    SELECT 'Speedloader em campo', 'Uso inadequado de speedloader em campo', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.tipos_transgressoes WHERE nome = 'Speedloader em campo');

    INSERT INTO public.tipos_transgressoes (nome, descricao, criado_por, ativo)
    SELECT 'Sem ponta laranja', 'Equipamento sem ponta laranja obrigatória', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM public.tipos_transgressoes WHERE nome = 'Sem ponta laranja');

    RAISE NOTICE 'Tipos de transgressões padrão inseridos com sucesso!';
END $$;

-- FIM DO SCRIPT

