-- ============================================
-- ADICIONAR CAMPOS ATIVO E ATUALIZAR RLS
-- ============================================
-- Execute este script completo no SQL Editor do Supabase
-- ============================================

-- 1. Adicionar campo ativo na tabela cadastro_links
ALTER TABLE public.cadastro_links
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

-- 2. Adicionar campo ativo na tabela equipes
ALTER TABLE public.equipes
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_cadastro_links_ativo ON public.cadastro_links(ativo);
CREATE INDEX IF NOT EXISTS idx_equipes_ativo ON public.equipes(ativo);

-- ============================================
-- ATUALIZAR POLÍTICAS RLS PARA PERMITIR DELETE E UPDATE
-- ============================================

-- Remover políticas antigas de equipes
DROP POLICY IF EXISTS "Todos podem ler equipes" ON public.equipes;
DROP POLICY IF EXISTS "Todos podem inserir equipes" ON public.equipes;
DROP POLICY IF EXISTS "Todos podem atualizar equipes" ON public.equipes;
DROP POLICY IF EXISTS "Admin pode deletar equipes" ON public.equipes;

-- Criar novas políticas para equipes
CREATE POLICY "Todos podem ler equipes" ON public.equipes 
  FOR SELECT 
  USING (true);

CREATE POLICY "Todos podem inserir equipes" ON public.equipes 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Todos podem atualizar equipes" ON public.equipes 
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Todos podem deletar equipes" ON public.equipes 
  FOR DELETE 
  USING (true);

-- Remover políticas antigas de cadastro_links
DROP POLICY IF EXISTS "Admin pode gerenciar links" ON public.cadastro_links;
DROP POLICY IF EXISTS "Links podem ser lidos por token" ON public.cadastro_links;

-- Criar novas políticas para cadastro_links
CREATE POLICY "Todos podem ler links" ON public.cadastro_links 
  FOR SELECT 
  USING (true);

CREATE POLICY "Todos podem inserir links" ON public.cadastro_links 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Todos podem atualizar links" ON public.cadastro_links 
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Todos podem deletar links" ON public.cadastro_links 
  FOR DELETE 
  USING (true);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Verificar se os campos foram adicionados
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('equipes', 'cadastro_links')
  AND column_name = 'ativo'
ORDER BY table_name, column_name;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('equipes', 'cadastro_links')
ORDER BY tablename, policyname;

