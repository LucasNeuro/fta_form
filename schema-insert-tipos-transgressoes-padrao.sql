-- Script para inserir tipos padrão de transgressões
-- Execute este script após criar a tabela tipos_transgressoes
-- IMPORTANTE: Certifique-se de ter pelo menos um usuário admin no sistema

-- Função auxiliar para inserir tipos apenas se não existirem
DO $$
DECLARE
    admin_id uuid;
BEGIN
    -- Buscar ID do primeiro admin
    SELECT id INTO admin_id FROM public.users WHERE role = 'admin' LIMIT 1;
    
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum usuário admin encontrado. Crie um admin primeiro.';
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

