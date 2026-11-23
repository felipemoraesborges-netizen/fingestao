-- ==============================================================================
-- FINGESTÃO: ESQUEMA COMPLETO DO BANCO DE DADOS SUPABASE (PostgreSQL + RLS)
-- Copie e cole este script integralmente no SQL Editor do seu projeto Supabase.
-- ==============================================================================

-- 1. Habilitar extensões necessárias para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  monthly_expense_budget NUMERIC(12,2) DEFAULT 4000.00,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem inserir seu próprio perfil" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 3. Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Tag',
  color TEXT NOT NULL DEFAULT '#10b981',
  budget_limit NUMERIC(12,2) DEFAULT 0.00,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar suas categorias" ON public.categories;
CREATE POLICY "Usuários podem gerenciar suas categorias" 
  ON public.categories FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Tabela de Pastas / Projetos / Eventos
CREATE TABLE IF NOT EXISTS public.folders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_budget NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT NOT NULL DEFAULT 'Folder',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar suas pastas" ON public.folders;
CREATE POLICY "Usuários podem gerenciar suas pastas" 
  ON public.folders FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Tabela de Transações (Receitas e Despesas)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category_id TEXT NOT NULL,
  folder_id TEXT REFERENCES public.folders(id) ON DELETE SET NULL,
  payment_method TEXT NOT NULL DEFAULT 'pix' CHECK (payment_method IN ('pix', 'credit_card', 'debit_card', 'cash', 'bank_slip', 'transfer', 'other')),
  is_recurring BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar suas transações" ON public.transactions;
CREATE POLICY "Usuários podem gerenciar suas transações" 
  ON public.transactions FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Índices para Alta Performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_folder ON public.transactions(folder_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_status ON public.folders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);

-- 7. Função e Trigger para atualizar automaticamente "updated_at"
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trigger_categories_updated_at ON public.categories;
CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trigger_folders_updated_at ON public.folders;
CREATE TRIGGER trigger_folders_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trigger_transactions_updated_at ON public.transactions;
CREATE TRIGGER trigger_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 8. Trigger para criar perfil automaticamente no SignUp (Supabase Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Tabela de Investimentos
CREATE TABLE IF NOT EXISTS public.investments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('renda_fixa', 'tesouro_direto', 'acoes', 'fiis', 'cripto', 'poupanca', 'outro')),
  amount_invested NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  current_value NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar seus investimentos" ON public.investments;
CREATE POLICY "Usuários podem gerenciar seus investimentos"
  ON public.investments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_investments_user ON public.investments(user_id);

DROP TRIGGER IF EXISTS trigger_investments_updated_at ON public.investments;
CREATE TRIGGER trigger_investments_updated_at
  BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 10. Tabela de Metas de Poupança
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  saved_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  deadline DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar suas metas" ON public.savings_goals;
CREATE POLICY "Usuários podem gerenciar suas metas"
  ON public.savings_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON public.savings_goals(user_id);

DROP TRIGGER IF EXISTS trigger_savings_goals_updated_at ON public.savings_goals;
CREATE TRIGGER trigger_savings_goals_updated_at
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


-- ============================================================
-- 11. GAMIFICAÇÃO — Trilha de Conquistas (Tabelas em Português)
-- ============================================================

-- 11.1 Patentes
CREATE TABLE IF NOT EXISTS public.patentes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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

-- 11.2 Metas de Compra (Fases da Trilha)
CREATE TABLE IF NOT EXISTS public.metas_compra (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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

DROP TRIGGER IF EXISTS trigger_metas_compra_updated_at ON public.metas_compra;
CREATE TRIGGER trigger_metas_compra_updated_at
  BEFORE UPDATE ON public.metas_compra
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 11.3 Contribuições (Aportes e Retiradas nas Metas)
CREATE TABLE IF NOT EXISTS public.contribuicoes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meta_id TEXT REFERENCES public.metas_compra(id) ON DELETE CASCADE NOT NULL,
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

-- 11.4 Conquistas (Galeria)
CREATE TABLE IF NOT EXISTS public.conquistas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meta_id TEXT REFERENCES public.metas_compra(id) ON DELETE SET NULL,
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

DROP TRIGGER IF EXISTS trigger_conquistas_updated_at ON public.conquistas;
CREATE TRIGGER trigger_conquistas_updated_at
  BEFORE UPDATE ON public.conquistas
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 11.5 Progresso do Usuário (XP, Nível, Streak)
CREATE TABLE IF NOT EXISTS public.progresso_usuario (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  nivel INTEGER NOT NULL DEFAULT 1,
  sequencia_meses INTEGER NOT NULL DEFAULT 0,
  patente_atual_id TEXT REFERENCES public.patentes(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.progresso_usuario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar seu progresso_usuario" ON public.progresso_usuario;
CREATE POLICY "Usuários podem gerenciar seu progresso_usuario"
  ON public.progresso_usuario FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trigger_progresso_usuario_updated_at ON public.progresso_usuario;
CREATE TRIGGER trigger_progresso_usuario_updated_at
  BEFORE UPDATE ON public.progresso_usuario
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 11.6 Histórico de Patentes
CREATE TABLE IF NOT EXISTS public.historico_patentes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patente_id TEXT REFERENCES public.patentes(id) ON DELETE CASCADE NOT NULL,
  alcancada_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.historico_patentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seu historico_patentes" ON public.historico_patentes;
CREATE POLICY "Usuários podem ver seu historico_patentes"
  ON public.historico_patentes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_historico_patentes_user ON public.historico_patentes(user_id);

-- 11.7 View: total_guardado
CREATE OR REPLACE VIEW public.total_guardado AS
SELECT
  user_id,
  COALESCE(SUM(valor_acumulado), 0.00) AS total_guardado,
  COALESCE(SUM(preco), 0.00) AS total_alvo,
  COUNT(id) AS total_metas,
  COUNT(id) FILTER (WHERE status = 'concluida') AS metas_concluidas
FROM public.metas_compra
GROUP BY user_id;

-- 11.8 Função de Seed de Patentes Padrão
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
