# SQL — Trilha de Conquistas (Gamificação)
> Referência do esquema original. A [migração aditiva](src/database/trilha-conquistas.sql) corresponde à versão anterior da Trilha. Consulte a [documentação da atualização](TRILHA-CONQUISTAS.md) para conhecer o contrato do saldo próprio e o roteiro de teste.

```sql
-- ============================================================
-- GAMIFICAÇÃO — Trilha de Conquistas (Tabelas com tipos UUID)
-- ============================================================

-- 1. Patentes
CREATE TABLE IF NOT EXISTS public.patentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#6b7280',
  icone_url TEXT,
  conquistas_necessarias INTEGER NOT NULL DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 0,
  padrao BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.patentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar suas patentes" ON public.patentes;
CREATE POLICY "Usuários podem gerenciar suas patentes"
  ON public.patentes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_patentes_user ON public.patentes(user_id);

-- 2. Metas de Compra (Fases da Trilha)
CREATE TABLE IF NOT EXISTS public.metas_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  preco NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  categoria TEXT NOT NULL DEFAULT 'outro',
  imagem_url TEXT,
  link_loja TEXT,
  prioridade INTEGER,
  ordem_manual INTEGER,
  status TEXT NOT NULL DEFAULT 'bloqueada' CHECK (status IN ('bloqueada','em_andamento','concluida')),
  valor_acumulado NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  conquistado_em TIMESTAMPTZ,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.metas_compra ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar suas metas_compra" ON public.metas_compra;
CREATE POLICY "Usuários podem gerenciar suas metas_compra"
  ON public.metas_compra FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_metas_compra_user ON public.metas_compra(user_id);
CREATE INDEX IF NOT EXISTS idx_metas_compra_status ON public.metas_compra(user_id, status);

-- 3. Contribuições (Aportes e Retiradas nas Metas)
CREATE TABLE IF NOT EXISTS public.contribuicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meta_id UUID REFERENCES public.metas_compra(id) ON DELETE CASCADE NOT NULL,
  valor NUMERIC(14,2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('aporte','retirada')),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  nota TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contribuicoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar suas contribuicoes" ON public.contribuicoes;
CREATE POLICY "Usuários podem gerenciar suas contribuicoes"
  ON public.contribuicoes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_contribuicoes_user ON public.contribuicoes(user_id);
CREATE INDEX IF NOT EXISTS idx_contribuicoes_meta ON public.contribuicoes(meta_id);

-- 4. Conquistas (Galeria)
CREATE TABLE IF NOT EXISTS public.conquistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meta_id UUID REFERENCES public.metas_compra(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  icone_url TEXT,
  raridade TEXT NOT NULL DEFAULT 'comum' CHECK (raridade IN ('comum','rara','epica','lendaria')),
  desbloqueada_em TIMESTAMPTZ,
  personalizada BOOLEAN NOT NULL DEFAULT false,
  oculta BOOLEAN NOT NULL DEFAULT false,
  frase_pessoal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conquistas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar suas conquistas" ON public.conquistas;
CREATE POLICY "Usuários podem gerenciar suas conquistas"
  ON public.conquistas FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_conquistas_user ON public.conquistas(user_id);

-- 5. Progresso do Usuário (XP, Nível, Streak)
CREATE TABLE IF NOT EXISTS public.progresso_usuario (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  nivel INTEGER NOT NULL DEFAULT 1,
  sequencia_meses INTEGER NOT NULL DEFAULT 0,
  patente_atual_id UUID REFERENCES public.patentes(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.progresso_usuario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar seu progresso_usuario" ON public.progresso_usuario;
CREATE POLICY "Usuários podem gerenciar seu progresso_usuario"
  ON public.progresso_usuario FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Histórico de Patentes
CREATE TABLE IF NOT EXISTS public.historico_patentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patente_id UUID REFERENCES public.patentes(id) ON DELETE CASCADE NOT NULL,
  alcancada_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.historico_patentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seu historico_patentes" ON public.historico_patentes;
CREATE POLICY "Usuários podem ver seu historico_patentes"
  ON public.historico_patentes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_historico_patentes_user ON public.historico_patentes(user_id);

-- 7. View: total_guardado
CREATE OR REPLACE VIEW public.total_guardado AS
SELECT
  user_id,
  COALESCE(SUM(valor_acumulado), 0.00) AS total_guardado,
  COALESCE(SUM(preco), 0.00) AS total_alvo,
  COUNT(id) AS total_metas,
  COUNT(id) FILTER (WHERE status = 'concluida') AS metas_concluidas
FROM public.metas_compra
GROUP BY user_id;

-- 8. Função de Seed de Patentes Padrão
CREATE OR REPLACE FUNCTION public.seed_default_patentes(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('Bronze',   '#cd7f32', 0,  0),
      ('Prata',    '#c0c0c0', 2,  1),
      ('Ouro',     '#ffd700', 4,  2),
      ('Platina',  '#e5e4e2', 7,  3),
      ('Diamante', '#b9f2ff', 10, 4),
      ('Mestre',   '#9b59b6', 15, 5),
      ('Lendário', '#f39c12', 25, 6)
    ) AS t(nome, cor, conquistas_necessarias, ordem)
  LOOP
    INSERT INTO public.patentes (user_id, nome, cor, conquistas_necessarias, ordem, padrao)
    VALUES (p_user_id, r.nome, r.cor, r.conquistas_necessarias, r.ordem, true)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_default_patentes(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_default_patentes(UUID) TO authenticated;
```
