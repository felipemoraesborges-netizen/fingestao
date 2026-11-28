ALTER TABLE public.progresso_usuario
  ADD COLUMN IF NOT EXISTS valor_casa numeric(14,2) NOT NULL DEFAULT 100 CHECK (valor_casa > 0),
  ADD COLUMN IF NOT EXISTS avatar_config jsonb,
  ADD COLUMN IF NOT EXISTS avatares_salvos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS preferencias_trilha jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS marco_maximo_trilha bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revisao_trilha uuid,
  ADD COLUMN IF NOT EXISTS promocao_trilha jsonb;

ALTER TABLE public.conquistas
  ADD COLUMN IF NOT EXISTS icone_nome text,
  ADD COLUMN IF NOT EXISTS comemorada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS chave_trilha uuid UNIQUE,
  ADD COLUMN IF NOT EXISTS produto_trilha jsonb,
  ADD COLUMN IF NOT EXISTS excluida boolean NOT NULL DEFAULT false;

ALTER TABLE public.patentes
  ADD COLUMN IF NOT EXISTS arquivada boolean NOT NULL DEFAULT false;

ALTER TABLE public.historico_patentes
  ADD COLUMN IF NOT EXISTS anterior_trilha_id uuid,
  ADD COLUMN IF NOT EXISTS comemorada_trilha boolean;

NOTIFY pgrst, 'reload schema';
