-- Script para adicionar campos financeiros na tabela equipes
-- Execute este script no SQL Editor do Supabase

-- Adicionar colunas financeiras
ALTER TABLE public.equipes 
  ADD COLUMN IF NOT EXISTS pagamento_efetuado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_pagamento date NULL,
  ADD COLUMN IF NOT EXISTS valor_cobrado numeric(10,2) DEFAULT 65.00;

-- Criar índices para melhor performance nas consultas financeiras
CREATE INDEX IF NOT EXISTS idx_equipes_pagamento_efetuado ON public.equipes(pagamento_efetuado) WHERE pagamento_efetuado = true;
CREATE INDEX IF NOT EXISTS idx_equipes_data_pagamento ON public.equipes(data_pagamento) WHERE data_pagamento IS NOT NULL;

-- Comentários nas colunas para documentação
COMMENT ON COLUMN public.equipes.pagamento_efetuado IS 'Indica se o pagamento da mensalidade foi efetuado';
COMMENT ON COLUMN public.equipes.data_pagamento IS 'Data em que o pagamento foi registrado';
COMMENT ON COLUMN public.equipes.valor_cobrado IS 'Valor cobrado da equipe (padrão: R$ 65,00)';

