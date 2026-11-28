BEGIN;

SET LOCAL lock_timeout = '5s';

CREATE TABLE IF NOT EXISTS public.aportes_trilha (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  valor numeric(14,2) NOT NULL CHECK (valor > 0),
  tipo text NOT NULL CHECK (tipo IN ('aporte', 'retirada')),
  observacao text,
  data date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.aportes_trilha ENABLE ROW LEVEL SECURITY;
DO $trilha$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
    AND tablename = 'aportes_trilha' AND cmd = 'ALL' AND policyname = 'dono_total') THEN
    CREATE POLICY dono_total ON public.aportes_trilha FOR ALL TO authenticated
      USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
  IF to_regclass('public.total_trilha') IS NULL THEN
    CREATE VIEW public.total_trilha WITH (security_invoker = true) AS
      SELECT user_id, sum(CASE WHEN tipo = 'aporte' THEN valor ELSE -valor END) AS total
      FROM public.aportes_trilha GROUP BY user_id;
  ELSIF EXISTS (SELECT 1 FROM pg_class AS object WHERE object.oid = 'public.total_trilha'::regclass AND object.relkind = 'v') THEN
    ALTER VIEW public.total_trilha SET (security_invoker = true);
  END IF;
END;
$trilha$;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aportes_trilha TO authenticated;
GRANT SELECT ON public.aportes_trilha, public.total_trilha TO service_role;
GRANT SELECT ON public.total_trilha TO authenticated;
CREATE INDEX IF NOT EXISTS aportes_trilha_usuario_idx ON public.aportes_trilha (user_id, data DESC);

CREATE OR REPLACE FUNCTION fin_gestao_educacao_privado.conferir_saldo_trilha()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $saldo$
DECLARE
  proprietario uuid;
  saldo numeric;
  diferenca numeric := 0;
BEGIN
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN RETURN OLD; END IF;
  proprietario := CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END;
  IF TG_OP = 'UPDATE' AND OLD.user_id <> NEW.user_id THEN
    RAISE EXCEPTION 'Não é permitido trocar o proprietário do aporte.' USING ERRCODE = '23514';
  END IF;
  IF TG_OP <> 'INSERT' THEN diferenca := diferenca - CASE WHEN OLD.tipo = 'aporte' THEN OLD.valor ELSE -OLD.valor END; END IF;
  IF TG_OP <> 'DELETE' THEN diferenca := diferenca + CASE WHEN NEW.tipo = 'aporte' THEN NEW.valor ELSE -NEW.valor END; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(proprietario::text, 563915));
  SELECT coalesce(sum(CASE WHEN tipo = 'aporte' THEN valor ELSE -valor END), 0)
    INTO saldo FROM public.aportes_trilha WHERE user_id = proprietario;
  IF saldo + diferenca < 0 AND diferenca < 0 THEN
    RAISE EXCEPTION 'Saldo insuficiente para alterar esse lançamento.' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$saldo$;
REVOKE ALL ON FUNCTION fin_gestao_educacao_privado.conferir_saldo_trilha() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE TRIGGER fin_gestao_conferir_saldo_trilha
BEFORE INSERT OR UPDATE OR DELETE ON public.aportes_trilha FOR EACH ROW
EXECUTE FUNCTION fin_gestao_educacao_privado.conferir_saldo_trilha();

DO $cofrinho_schema$
DECLARE tipo_meta text;
BEGIN
  SELECT format_type(atttypid, atttypmod) INTO tipo_meta FROM pg_attribute
  WHERE attrelid = 'public.savings_goals'::regclass AND attname = 'id' AND NOT attisdropped;
  IF tipo_meta IS NULL OR tipo_meta NOT IN ('text', 'uuid') THEN RAISE EXCEPTION 'Tipo de savings_goals.id não suportado: %', tipo_meta; END IF;
  EXECUTE format('CREATE TABLE IF NOT EXISTS public.movimentos_cofrinho (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meta_id %s REFERENCES public.savings_goals(id) ON DELETE SET NULL,
    tipo text NOT NULL CHECK (tipo IN (''aporte'', ''retirada'')),
    valor numeric(14,2) NOT NULL CHECK (valor > 0),
    criada_em timestamptz NOT NULL DEFAULT now()
  )', tipo_meta);
END;
$cofrinho_schema$;
ALTER TABLE public.movimentos_cofrinho ENABLE ROW LEVEL SECURITY;
DO $cofrinhos$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'movimentos_cofrinho' AND policyname = 'dono_total') THEN
    CREATE POLICY dono_total ON public.movimentos_cofrinho FOR ALL TO authenticated
      USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END;
$cofrinhos$;
REVOKE ALL ON public.movimentos_cofrinho FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.movimentos_cofrinho TO authenticated, service_role;
CREATE INDEX IF NOT EXISTS movimentos_cofrinho_usuario_meta_idx ON public.movimentos_cofrinho (user_id, meta_id, criada_em DESC);

CREATE OR REPLACE FUNCTION fin_gestao_educacao_privado.cofrinho_lancar(p_meta text, p_tipo text, p_valor numeric, p_id uuid)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $cofrinho$
DECLARE
  dono uuid := auth.uid();
  meta public.savings_goals.id%TYPE;
  saldo numeric;
  criado uuid;
BEGIN
  IF dono IS NULL OR p_id IS NULL OR p_tipo IS NULL OR p_tipo NOT IN ('aporte', 'retirada')
    OR p_valor IS NULL OR p_valor <= 0 OR p_valor > 100000000 OR p_valor <> round(p_valor, 2)
    THEN RAISE EXCEPTION 'Movimento inválido.' USING ERRCODE = 'P0001'; END IF;
  SELECT id, saved_amount INTO meta, saldo FROM public.savings_goals WHERE user_id = dono AND id::text = p_meta FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Meta indisponível.' USING ERRCODE = 'P0001'; END IF;

  INSERT INTO public.movimentos_cofrinho (id, user_id, meta_id, tipo, valor)
  VALUES (p_id, dono, meta, p_tipo, p_valor) ON CONFLICT (id) DO NOTHING RETURNING id INTO criado;
  IF criado IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.movimentos_cofrinho WHERE id = p_id AND user_id = dono AND meta_id = meta AND tipo = p_tipo AND valor = p_valor)
      THEN RETURN saldo; END IF;
    RAISE EXCEPTION 'O movimento já foi utilizado.' USING ERRCODE = 'P0001';
  END IF;
  saldo := saldo + CASE WHEN p_tipo = 'aporte' THEN p_valor ELSE -p_valor END;
  IF saldo < 0 THEN RAISE EXCEPTION 'Saldo insuficiente neste cofrinho.' USING ERRCODE = 'P0001'; END IF;
  UPDATE public.savings_goals SET saved_amount = saldo WHERE user_id = dono AND id = meta;
  RETURN saldo;
END;
$cofrinho$;
REVOKE ALL ON FUNCTION fin_gestao_educacao_privado.cofrinho_lancar(text, text, numeric, uuid) FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA fin_gestao_educacao_privado TO authenticated;
GRANT EXECUTE ON FUNCTION fin_gestao_educacao_privado.cofrinho_lancar(text, text, numeric, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.fin_cofrinho_lancar(p_meta text, p_tipo text, p_valor numeric, p_id uuid)
RETURNS numeric LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path = ''
AS $cofrinho_publico$
  SELECT fin_gestao_educacao_privado.cofrinho_lancar(p_meta, p_tipo, p_valor, p_id);
$cofrinho_publico$;
REVOKE ALL ON FUNCTION public.fin_cofrinho_lancar(text, text, numeric, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fin_cofrinho_lancar(text, text, numeric, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.fin_pratica_estado(p_usuario uuid, p_dia date)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $pratica$
  WITH estado AS (
    SELECT coalesce((SELECT valor_casa FROM public.progresso_usuario WHERE user_id = p_usuario), 100) AS passo,
      greatest(0, coalesce((SELECT sum(CASE WHEN tipo = 'aporte' THEN valor ELSE -valor END)
        FROM public.aportes_trilha WHERE user_id = p_usuario), 0)) AS saldo
  ), compraveis AS (
    SELECT meta.id, estado.passo, estado.saldo,
      row_number() OVER (ORDER BY meta.preco, meta.created_at, meta.id) AS ordem,
      ceil(sum(greatest(meta.preco, 0)) OVER (ORDER BY meta.preco, meta.created_at, meta.id) / estado.passo) AS casa_preco
    FROM public.metas_compra AS meta CROSS JOIN estado WHERE meta.user_id = p_usuario
  ), casas AS (
    SELECT id, saldo, passo, ordem + greatest(0, max(casa_preco - ordem) OVER (ORDER BY ordem)) AS casa
    FROM compraveis
  ), dias AS (
    SELECT DISTINCT (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia
    FROM public.transactions
    WHERE user_id = p_usuario AND type = 'expense' AND amount > 0
      AND created_at >= (p_dia - 6)::timestamp AT TIME ZONE 'America/Sao_Paulo'
      AND created_at < (p_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo'
  ), poupanca AS (
    SELECT (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia
    FROM public.aportes_trilha WHERE user_id = p_usuario AND tipo = 'aporte'
    UNION
    SELECT (criada_em AT TIME ZONE 'America/Sao_Paulo')::date
    FROM public.movimentos_cofrinho WHERE user_id = p_usuario AND tipo = 'aporte'
  ), semanas_mes AS (
    SELECT count(DISTINCT date_trunc('week', created_at AT TIME ZONE 'America/Sao_Paulo'))::int AS total
    FROM public.transactions WHERE user_id = p_usuario AND type = 'expense' AND amount > 0
      AND created_at >= date_trunc('month', p_dia::timestamp) AT TIME ZONE 'America/Sao_Paulo'
      AND created_at < (p_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo'
  )
  SELECT jsonb_build_object(
    'dias', (SELECT count(*) FROM dias),
    'teto', EXISTS (SELECT 1 FROM public.categories WHERE user_id = p_usuario AND type = 'expense' AND budget_limit > 0),
    'meta', EXISTS (SELECT 1 FROM public.metas_compra WHERE user_id = p_usuario AND preco > 0)
       OR EXISTS (SELECT 1 FROM public.savings_goals WHERE user_id = p_usuario AND target_amount > 0),
    'aporte', EXISTS (SELECT 1 FROM public.aportes_trilha WHERE user_id = p_usuario AND tipo = 'aporte' AND valor > 0),
    'semanasMes', (SELECT total FROM semanas_mes),
    'diasPoupanca', (SELECT count(*) FROM poupanca WHERE dia <= p_dia),
    'semanasPoupanca', (SELECT count(DISTINCT date_trunc('week', dia::timestamp)) FROM poupanca WHERE dia <= p_dia),
    'produtos', coalesce((SELECT jsonb_agg(id) FROM (
      SELECT casa.id FROM casas AS casa
      WHERE casa.casa <= floor(casa.saldo / casa.passo)
        AND NOT EXISTS (SELECT 1 FROM public.eventos_jogo WHERE user_id = p_usuario AND chave_evento = 'meta:' || casa.id)
        AND NOT EXISTS (SELECT 1 FROM public.eventos_jogo WHERE user_id = p_usuario AND tipo = 'meta'
          AND criado_em >= p_dia::timestamp AT TIME ZONE 'America/Sao_Paulo')
      ORDER BY casa.casa LIMIT 1
    ) AS novos), '[]'::jsonb),
    'chaves', coalesce((SELECT jsonb_agg(chave_evento) FROM public.eventos_jogo WHERE user_id = p_usuario
      AND (tipo = 'desafio' OR chave_evento LIKE 'mensal:%')), '[]'::jsonb)
  );
$pratica$;
GRANT SELECT ON public.categories, public.savings_goals, public.metas_compra TO service_role;
REVOKE ALL ON FUNCTION public.fin_pratica_estado(uuid, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fin_pratica_estado(uuid, date) TO service_role;
CREATE INDEX IF NOT EXISTS transactions_despesa_registro_idx ON public.transactions (user_id, created_at) WHERE type = 'expense';

CREATE TABLE IF NOT EXISTS public.catalogo_finplay (
  item_id text PRIMARY KEY,
  titulo text NOT NULL,
  descricao text NOT NULL,
  tipo text NOT NULL,
  arte text,
  licao_id text,
  nivel smallint NOT NULL CHECK (nivel BETWEEN 1 AND 100),
  preco integer NOT NULL CHECK (preco >= 0)
);
ALTER TABLE public.catalogo_finplay ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_finplay DROP CONSTRAINT IF EXISTS catalogo_finplay_tipo_check,
  ADD CONSTRAINT catalogo_finplay_tipo_check CHECK (tipo IN ('construcao', 'roupa', 'cabelo', 'acessorio', 'congelamento', 'pet'));
ALTER TABLE public.inventario_usuario DROP CONSTRAINT IF EXISTS inventario_usuario_tipo_check,
  ADD CONSTRAINT inventario_usuario_tipo_check CHECK (tipo IN ('roupa', 'cabelo', 'acessorio', 'pet'));
REVOKE ALL ON public.catalogo_finplay FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.catalogo_finplay TO service_role;

INSERT INTO public.catalogo_finplay (item_id, titulo, descricao, tipo, arte, licao_id, nivel, preco)
VALUES
  ('escola', 'Escola', 'Entenda renda, despesas e escolhas do dia a dia.', 'construcao', 'escola', 'pp-dinheiro', 1, 0),
  ('biblioteca', 'Biblioteca', 'Aprenda a organizar o orçamento mensal.', 'construcao', 'biblioteca', 'orc-mapa', 1, 12),
  ('condominio', 'Condomínio', 'Compare custos mensais de moradia.', 'construcao', 'condominio', 'comp-casa', 8, 30),
  ('torre-residencial', 'Torre residencial', 'Planeje despesas fixas e variáveis.', 'construcao', 'torre-residencial', 'orc-tipos', 12, 40),
  ('banco', 'Banco', 'Estude as condições de títulos e depósitos.', 'construcao', 'banco', 'inv-cdb', 5, 24),
  ('universidade', 'Universidade', 'Compare riscos e prazos para diferentes objetivos.', 'construcao', 'universidade', 'inv-perfil', 18, 50),
  ('hospital', 'Hospital', 'Aprenda a se preparar para imprevistos.', 'construcao', 'hospital', 'res-funcao', 5, 22),
  ('farmacia', 'Farmácia', 'Identifique gastos essenciais e urgentes.', 'construcao', 'farmacia', 'pp-prioridades', 3, 16),
  ('supermercado', 'Supermercado', 'Use categorias e limites ao planejar as compras.', 'construcao', 'supermercado', 'orc-tetos', 3, 18),
  ('restaurante', 'Restaurante', 'Acompanhe os gastos que se repetem no mês.', 'construcao', 'restaurante', 'ctl-invisiveis', 4, 20),
  ('loja', 'Loja de bairro', 'Compare preços e formas de pagamento.', 'construcao', 'loja', 'comp-negociacao', 5, 20),
  ('centro-comercial', 'Centro comercial', 'Avalie o custo total das compras.', 'construcao', 'centro-comercial', 'comp-planejamento', 17, 42),
  ('industria', 'Indústria limpa', 'Reconheça custos e entradas da atividade econômica.', 'construcao', 'industria', 'pro-mei', 27, 55),
  ('empresa', 'Centro empresarial', 'Separe o caixa pessoal do caixa do negócio.', 'construcao', 'empresa', 'pro-mei', 20, 45),
  ('prefeitura', 'Prefeitura', 'Compare o planejamento com o que aconteceu no mês.', 'construcao', 'prefeitura', 'orc-revisao', 8, 30),
  ('parque', 'Parque municipal', 'Priorize escolhas que fazem sentido para sua rotina.', 'construcao', 'parque', 'ctl-decisoes', 1, 8),
  ('praca', 'Praça central', 'Crie um hábito regular de conferência.', 'construcao', 'praca', 'ctl-rotina', 2, 12),
  ('museu', 'Museu', 'Entenda como os preços mudam ao longo do tempo.', 'construcao', 'museu', 'inv-inflacao', 15, 36),
  ('estadio', 'Estádio', 'Organize a economia para um objetivo com prazo.', 'construcao', 'estadio', 'pou-objetivo', 25, 50),
  ('fortaleza', 'Fortaleza da reserva', 'Calcule a cobertura da sua reserva.', 'construcao', 'fortaleza', 'res-tamanho', 9, 30),
  ('monumento', 'Monumento', 'Entenda como os aportes se acumulam no tempo.', 'construcao', 'monumento', 'pou-compostos', 30, 55),
  ('estacao', 'Estação de transporte', 'Compare despesas de transporte no mês.', 'construcao', 'estacao', 'ctl-categorias', 10, 32),
  ('aeroporto', 'Aeroporto', 'Monte um orçamento de viagem.', 'construcao', 'aeroporto', 'comp-viagem', 34, 64),
  ('porto', 'Porto sustentável', 'Planeje compras com custos de entrega.', 'construcao', 'porto', 'comp-planejamento', 32, 60),
  ('usina-solar', 'Usina solar', 'Calcule um aporte para alcançar uma meta.', 'construcao', 'usina-solar', 'pou-aporte', 14, 35),
  ('parque-eolico', 'Parque eólico', 'Compare condições de investimentos de longo prazo.', 'construcao', 'parque-eolico', 'inv-tesouro', 24, 48),
  ('centro-tecnologico', 'Centro tecnológico', 'Identifique os cuidados ao pagar por meios digitais.', 'construcao', 'centro-tecnologico', 'pro-golpes', 28, 55),
  ('centro-pesquisa', 'Centro de pesquisa', 'Compare dados financeiros com períodos equivalentes.', 'construcao', 'centro-pesquisa', 'inv-inflacao', 35, 65),
  ('centro-financeiro', 'Centro financeiro', 'Calcule o custo total do crédito.', 'construcao', 'centro-financeiro', 'div-juros', 40, 70),
  ('solar', 'Jaqueta solar', 'Uma jaqueta com acabamento dourado.', 'roupa', NULL, NULL, 1, 18),
  ('coloracao-mar', 'Cabelo azul-mar', 'Uma cor de cabelo azul-petróleo.', 'cabelo', NULL, NULL, 1, 12),
  ('oculos-cobre', 'Óculos de cobre', 'Uma armação fina em tom cobre.', 'acessorio', NULL, NULL, 1, 14),
  ('capa-jardim', 'Capa jardim', 'Acessório liberado pelo selo Primeiros Passos.', 'acessorio', NULL, 'pp-prova', 1, 0),
  ('congelamento', 'Congelar sequência', 'Cobre um dia perdido na sua sequência.', 'congelamento', NULL, NULL, 1, 25)
ON CONFLICT (item_id) DO NOTHING;

INSERT INTO public.catalogo_finplay (item_id, titulo, descricao, tipo, arte, nivel, preco)
VALUES
  ('finny', 'Finny, a capivara', 'Seu guia de aprendizado.', 'pet', 'finny', 1, 0),
  ('raposa', 'Raposa', 'Companheiro colecionável para a sua cidade.', 'pet', 'raposa', 2, 14),
  ('dragao', 'Dragão', 'Companheiro colecionável para a sua cidade.', 'pet', 'dragao', 18, 40),
  ('porquinho', 'Porquinho', 'Companheiro colecionável para a sua cidade.', 'pet', 'porquinho', 1, 10),
  ('coruja', 'Coruja', 'Companheiro colecionável para a sua cidade.', 'pet', 'coruja', 4, 18),
  ('panda', 'Panda', 'Companheiro colecionável para a sua cidade.', 'pet', 'panda', 9, 26),
  ('tartaruga', 'Tartaruga', 'Companheiro colecionável para a sua cidade.', 'pet', 'tartaruga', 2, 12),
  ('arara', 'Arara', 'Companheiro colecionável para a sua cidade.', 'pet', 'arara', 6, 22),
  ('mico', 'Mico-leão-dourado', 'Companheiro colecionável para a sua cidade.', 'pet', 'mico', 10, 28),
  ('coelho', 'Coelho', 'Companheiro colecionável para a sua cidade.', 'pet', 'coelho', 3, 15),
  ('pinguim', 'Pinguim', 'Companheiro colecionável para a sua cidade.', 'pet', 'pinguim', 11, 30),
  ('tucano', 'Tucano', 'Companheiro colecionável para a sua cidade.', 'pet', 'tucano', 7, 22),
  ('ovelha', 'Ovelha', 'Companheiro colecionável para a sua cidade.', 'pet', 'ovelha', 5, 19),
  ('cachorro', 'Cachorro', 'Companheiro colecionável para a sua cidade.', 'pet', 'cachorro', 1, 10),
  ('gato', 'Gato', 'Companheiro colecionável para a sua cidade.', 'pet', 'gato', 3, 14),
  ('elefante', 'Elefante', 'Companheiro colecionável para a sua cidade.', 'pet', 'elefante', 14, 36),
  ('chinchila', 'Chinchila', 'Companheiro colecionável para a sua cidade.', 'pet', 'chinchila', 12, 30),
  ('camaleao', 'Camaleão', 'Companheiro colecionável para a sua cidade.', 'pet', 'camaleao', 16, 38),
  ('beija-flor', 'Beija-flor', 'Companheiro colecionável para a sua cidade.', 'pet', 'beija-flor', 20, 43),
  ('urso', 'Urso', 'Companheiro colecionável para a sua cidade.', 'pet', 'urso', 24, 48)
ON CONFLICT (item_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.cidade_finplay (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL REFERENCES public.catalogo_finplay(item_id),
  linha smallint NOT NULL CHECK (linha BETWEEN 0 AND 7),
  coluna smallint NOT NULL CHECK (coluna BETWEEN 0 AND 7),
  melhoria smallint NOT NULL DEFAULT 1 CHECK (melhoria BETWEEN 1 AND 3),
  criada_em timestamptz NOT NULL DEFAULT now(),
  CHECK (linha <> 0 OR coluna <> 0),
  UNIQUE (user_id, linha, coluna),
  UNIQUE (user_id, item_id)
);
ALTER TABLE public.cidade_finplay ENABLE ROW LEVEL SECURITY;
DO $cidade$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cidade_finplay' AND policyname = 'dono_total') THEN
    CREATE POLICY dono_total ON public.cidade_finplay FOR ALL TO authenticated
      USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END;
$cidade$;
REVOKE ALL ON public.cidade_finplay FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.cidade_finplay TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.cidade_finplay TO service_role;

ALTER TABLE public.progresso_usuario
  ADD COLUMN IF NOT EXISTS ranking_codigo uuid,
  ADD COLUMN IF NOT EXISTS pet_ativo text,
  ADD COLUMN IF NOT EXISTS lembrete_hora time NOT NULL DEFAULT '19:00',
  ADD COLUMN IF NOT EXISTS lembrete_visto_dia date;
CREATE UNIQUE INDEX IF NOT EXISTS progresso_usuario_ranking_codigo_idx ON public.progresso_usuario (ranking_codigo) WHERE ranking_codigo IS NOT NULL;
REVOKE SELECT ON public.amizades_jogo FROM authenticated;

CREATE OR REPLACE FUNCTION fin_gestao_educacao_privado.finplay_nivel(p_usuario uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $nivel$
  SELECT least(100, 1 + coalesce(sum(xp), 0) / 85)::integer
  FROM public.eventos_jogo WHERE user_id = p_usuario AND tipo IN ('etapa', 'licao', 'prova', 'sequencia');
$nivel$;
REVOKE ALL ON FUNCTION fin_gestao_educacao_privado.finplay_nivel(uuid) FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA fin_gestao_educacao_privado TO service_role;
GRANT EXECUTE ON FUNCTION fin_gestao_educacao_privado.finplay_nivel(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.fin_play_estado(p_usuario uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $estado$
  WITH titular AS (
    SELECT *, now() AT TIME ZONE 'America/Sao_Paulo' AS hoje
    FROM public.progresso_usuario WHERE user_id = p_usuario AND jogo_ativo
  ), amigos AS (
    SELECT relacao.id, relacao.estado, relacao.amigo_id = p_usuario AS recebida,
      outro.user_id,
      coalesce(outro.apelido_ranking, 'Jogador ' || upper(left(outro.ranking_codigo::text, 6))) AS apelido
    FROM public.amizades_jogo AS relacao
    JOIN public.progresso_usuario AS outro
      ON outro.user_id = CASE WHEN relacao.user_id = p_usuario THEN relacao.amigo_id ELSE relacao.user_id END
    CROSS JOIN titular
    WHERE p_usuario IN (relacao.user_id, relacao.amigo_id) AND relacao.estado IN ('aceita', 'pendente')
      AND titular.ranking_ativo AND outro.ranking_ativo AND outro.jogo_ativo AND outro.ranking_codigo IS NOT NULL
  ), pontos AS (
    SELECT amigo.user_id, amigo.apelido, false AS eu FROM amigos AS amigo WHERE amigo.estado = 'aceita'
    UNION ALL
    SELECT user_id, coalesce(apelido_ranking, 'Jogador ' || upper(left(ranking_codigo::text, 6))), true
    FROM titular WHERE ranking_ativo AND ranking_codigo IS NOT NULL
  ), placar AS (
    SELECT linha.apelido, linha.eu, coalesce(sum(evento.xp), 0) AS xp
    FROM pontos AS linha
    LEFT JOIN public.eventos_jogo AS evento ON evento.user_id = linha.user_id
      AND evento.tipo IN ('etapa', 'licao', 'prova', 'sequencia')
      AND evento.criado_em >= date_trunc('week', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo'
    GROUP BY linha.user_id, linha.apelido, linha.eu
    ORDER BY xp DESC, linha.apelido, linha.eu DESC
  )
  SELECT jsonb_build_object('moedas', titular.moedas, 'nivel', fin_gestao_educacao_privado.finplay_nivel(p_usuario),
    'arvore', (SELECT least(10, 1 + (count(*) FILTER (WHERE chave_evento LIKE 'licao:%')
      + 4 * count(*) FILTER (WHERE tipo = 'prova') + 3 * count(*) FILTER (WHERE tipo = 'desafio')
      + count(*) FILTER (WHERE tipo = 'missao') / 4) / 8) FROM public.eventos_jogo WHERE user_id = p_usuario),
    'congelamentos', titular.congelamentos, 'ranking', titular.ranking_ativo, 'apelido', titular.apelido_ranking,
    'pet', coalesce((SELECT posse.item_id FROM public.inventario_usuario AS posse JOIN public.catalogo_finplay AS pet ON pet.item_id = posse.item_id
      WHERE posse.user_id = p_usuario AND posse.item_id = titular.pet_ativo AND pet.tipo = 'pet'), 'finny'),
    'codigo', CASE WHEN titular.ranking_ativo THEN titular.ranking_codigo END,
    'lembrete', titular.lembretes_ativos, 'horario', to_char(titular.lembrete_hora, 'HH24:MI'),
    'notificar', titular.lembretes_ativos AND titular.hoje::time >= titular.lembrete_hora
      AND titular.lembrete_visto_dia IS DISTINCT FROM titular.hoje::date
      AND (titular.ultimo_estudo_em AT TIME ZONE 'America/Sao_Paulo')::date IS DISTINCT FROM titular.hoje::date,
    'catalogo', coalesce((SELECT jsonb_agg(to_jsonb(item) ORDER BY item.nivel, item.titulo)
      FROM public.catalogo_finplay AS item), '[]'::jsonb),
    'inventario', coalesce((SELECT jsonb_agg(item_id) FROM public.inventario_usuario WHERE user_id = p_usuario), '[]'::jsonb),
    'construcoes', coalesce((SELECT jsonb_agg(to_jsonb(cidade) - 'user_id') FROM public.cidade_finplay AS cidade WHERE user_id = p_usuario), '[]'::jsonb),
    'amigos', coalesce((SELECT jsonb_agg(to_jsonb(amigo) - 'user_id' ORDER BY amigo.apelido) FROM amigos AS amigo), '[]'::jsonb),
    'placar', coalesce((SELECT jsonb_agg(to_jsonb(posicao) ORDER BY posicao.xp DESC, posicao.apelido, posicao.eu DESC) FROM placar AS posicao), '[]'::jsonb))
  FROM titular;
$estado$;
REVOKE ALL ON FUNCTION public.fin_play_estado(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fin_play_estado(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.fin_play_operar(p_usuario uuid, p_acao text, p_dados jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $operacao$
DECLARE
  jogador public.progresso_usuario%ROWTYPE;
  item public.catalogo_finplay%ROWTYPE;
  relacao public.amizades_jogo%ROWTYPE;
  predio public.cidade_finplay%ROWTYPE;
  destino uuid;
  nivel_atual integer;
  largura integer;
  linha_alvo smallint;
  coluna_alvo smallint;
  novo_nivel smallint;
  custo integer;
  chave text;
  cidade_atual timestamp := now() AT TIME ZONE 'America/Sao_Paulo';
BEGIN
  INSERT INTO public.progresso_usuario (user_id) VALUES (p_usuario) ON CONFLICT (user_id) DO NOTHING;
  IF p_acao = 'state' THEN
    SELECT * INTO STRICT jogador FROM public.progresso_usuario WHERE user_id = p_usuario;
  ELSE
    SELECT * INTO STRICT jogador FROM public.progresso_usuario WHERE user_id = p_usuario FOR UPDATE;
  END IF;
  IF NOT jogador.jogo_ativo THEN RAISE EXCEPTION 'Ative o Modo Jogo nas configurações.' USING ERRCODE = 'P0001'; END IF;

  INSERT INTO public.inventario_usuario (id, user_id, item_id, tipo, origem)
  VALUES (gen_random_uuid(), p_usuario, 'finny', 'pet', 'mundo') ON CONFLICT (user_id, item_id) DO NOTHING;

  INSERT INTO public.inventario_usuario (id, user_id, item_id, tipo, origem)
  SELECT gen_random_uuid(), p_usuario, 'capa-jardim', 'acessorio', 'mundo'
  WHERE EXISTS (SELECT 1 FROM public.aprendizado_progresso WHERE user_id = p_usuario AND licao_id = 'pp-prova' AND concluida_em IS NOT NULL)
  ON CONFLICT (user_id, item_id) DO NOTHING;

  IF p_acao = 'state' THEN RETURN public.fin_play_estado(p_usuario); END IF;

  IF p_acao = 'profile' THEN
    UPDATE public.progresso_usuario SET
      ranking_ativo = coalesce((p_dados->>'ranking')::boolean, jogador.ranking_ativo),
      ranking_codigo = CASE WHEN coalesce((p_dados->>'ranking')::boolean, jogador.ranking_ativo)
        THEN coalesce(jogador.ranking_codigo, gen_random_uuid()) END,
      apelido_ranking = CASE WHEN p_dados ? 'alias' THEN nullif(btrim(p_dados->>'alias'), '') ELSE jogador.apelido_ranking END,
      lembretes_ativos = coalesce((p_dados->>'reminder')::boolean, jogador.lembretes_ativos),
      lembrete_hora = coalesce((p_dados->>'time')::time, jogador.lembrete_hora)
    WHERE user_id = p_usuario;
  ELSIF p_acao = 'equip' THEN
    IF NOT EXISTS (SELECT 1 FROM public.inventario_usuario WHERE user_id = p_usuario AND tipo = 'pet' AND item_id = p_dados->>'item') THEN
      RAISE EXCEPTION 'Este companheiro ainda não está na sua coleção.' USING ERRCODE = 'P0001';
    END IF;
    UPDATE public.progresso_usuario SET pet_ativo = p_dados->>'item' WHERE user_id = p_usuario;
  ELSIF p_acao = 'reminded' THEN
    IF jogador.lembretes_ativos AND cidade_atual::time >= jogador.lembrete_hora THEN
      UPDATE public.progresso_usuario SET lembrete_visto_dia = cidade_atual::date
      WHERE user_id = p_usuario AND lembrete_visto_dia IS DISTINCT FROM cidade_atual::date;
    END IF;
  ELSIF p_acao IN ('invite', 'friend') THEN
    IF NOT jogador.ranking_ativo OR jogador.ranking_codigo IS NULL THEN
      RAISE EXCEPTION 'Ative a participação no ranking primeiro.' USING ERRCODE = 'P0001';
    END IF;
    IF p_acao = 'invite' THEN
      SELECT user_id INTO destino FROM public.progresso_usuario
      WHERE ranking_codigo = (p_dados->>'code')::uuid AND ranking_ativo AND jogo_ativo AND user_id <> p_usuario;
      IF destino IS NULL THEN RAISE EXCEPTION 'O código de amizade está indisponível.' USING ERRCODE = 'P0001'; END IF;
      IF (SELECT count(*) FROM public.amizades_jogo WHERE p_usuario IN (user_id, amigo_id) AND estado IN ('pendente', 'aceita')) >= 50 THEN
        RAISE EXCEPTION 'Você atingiu o limite de 50 relações ativas.' USING ERRCODE = 'P0001';
      END IF;
      INSERT INTO public.amizades_jogo AS anterior (id, user_id, amigo_id, estado)
      VALUES (gen_random_uuid(), p_usuario, destino, 'pendente')
      ON CONFLICT (least(user_id, amigo_id), greatest(user_id, amigo_id)) DO UPDATE
      SET user_id = EXCLUDED.user_id, amigo_id = EXCLUDED.amigo_id, estado = 'pendente', criado_em = now(), respondida_em = NULL
      WHERE anterior.estado = 'cancelada';
    ELSE
      SELECT * INTO relacao FROM public.amizades_jogo
      WHERE id = (p_dados->>'id')::uuid AND p_usuario IN (user_id, amigo_id) FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Convite indisponível.' USING ERRCODE = 'P0001'; END IF;
      IF p_dados->>'decision' IN ('accept', 'decline') AND relacao.amigo_id = p_usuario AND relacao.estado = 'pendente' THEN
        UPDATE public.amizades_jogo SET estado = CASE p_dados->>'decision' WHEN 'accept' THEN 'aceita' ELSE 'recusada' END,
          respondida_em = now() WHERE id = relacao.id;
      ELSIF p_dados->>'decision' = 'remove' AND (relacao.estado = 'aceita' OR (relacao.estado = 'pendente' AND relacao.user_id = p_usuario)) THEN
        UPDATE public.amizades_jogo SET estado = 'cancelada', respondida_em = now() WHERE id = relacao.id;
      END IF;
    END IF;
  ELSIF p_acao IN ('buy', 'build', 'upgrade', 'move') THEN
    chave := 'operacao:' || (p_dados->>'request')::uuid;
    IF EXISTS (SELECT 1 FROM public.eventos_jogo WHERE user_id = p_usuario AND chave_evento = chave) THEN
      RETURN public.fin_play_estado(p_usuario);
    END IF;
    nivel_atual := fin_gestao_educacao_privado.finplay_nivel(p_usuario);
    IF p_acao IN ('buy', 'build') THEN
      SELECT * INTO item FROM public.catalogo_finplay WHERE item_id = p_dados->>'item';
      IF NOT FOUND OR item.nivel > nivel_atual OR (p_acao = 'build') <> (item.tipo = 'construcao') THEN
        RAISE EXCEPTION 'Esse item ainda está indisponível.' USING ERRCODE = 'P0001';
      END IF;
      IF item.item_id = 'capa-jardim' AND NOT EXISTS (
        SELECT 1 FROM public.inventario_usuario WHERE user_id = p_usuario AND item_id = item.item_id
      ) THEN RAISE EXCEPTION 'Conclua Primeiros passos para liberar a capa.' USING ERRCODE = 'P0001'; END IF;
      custo := item.preco;
    END IF;
    IF p_acao IN ('build', 'move') THEN
      largura := CASE WHEN nivel_atual >= 75 THEN 8 WHEN nivel_atual >= 50 THEN 7 WHEN nivel_atual >= 25 THEN 6 WHEN nivel_atual >= 10 THEN 5 ELSE 4 END;
      linha_alvo := (p_dados->>'row')::smallint; coluna_alvo := (p_dados->>'col')::smallint;
      IF linha_alvo IS NULL OR coluna_alvo IS NULL OR linha_alvo < 0 OR coluna_alvo < 0 OR linha_alvo >= largura
        OR coluna_alvo >= largura OR (linha_alvo = 0 AND coluna_alvo = 0)
        OR EXISTS (SELECT 1 FROM public.cidade_finplay WHERE user_id = p_usuario AND linha = linha_alvo AND coluna = coluna_alvo)
        THEN RAISE EXCEPTION 'Escolha um terreno livre no mapa.' USING ERRCODE = 'P0001'; END IF;
    END IF;
    IF p_acao IN ('upgrade', 'move') THEN
      SELECT * INTO predio FROM public.cidade_finplay WHERE user_id = p_usuario AND id = (p_dados->>'id')::uuid;
      IF NOT FOUND THEN RAISE EXCEPTION 'Construção indisponível.' USING ERRCODE = 'P0001'; END IF;
      custo := 0;
      IF p_acao = 'upgrade' THEN
        novo_nivel := (p_dados->>'tier')::smallint;
        IF novo_nivel <> predio.melhoria + 1 OR novo_nivel > 3 OR nivel_atual < (novo_nivel - 1) * 5 THEN
          RAISE EXCEPTION 'A melhoria ainda está indisponível.' USING ERRCODE = 'P0001';
        END IF;
        custo := novo_nivel * 8;
      END IF;
    END IF;

    IF p_acao = 'buy' AND item.tipo <> 'congelamento' AND EXISTS (
      SELECT 1 FROM public.inventario_usuario WHERE user_id = p_usuario AND item_id = item.item_id
    ) THEN RETURN public.fin_play_estado(p_usuario); END IF;
    IF p_acao = 'build' AND EXISTS (
      SELECT 1 FROM public.cidade_finplay WHERE user_id = p_usuario AND item_id = item.item_id
    ) THEN RAISE EXCEPTION 'Você já tem uma construção desse tipo.' USING ERRCODE = 'P0001'; END IF;
    IF jogador.moedas < custo THEN RAISE EXCEPTION 'Seu saldo de FinCoins é insuficiente.' USING ERRCODE = 'P0001'; END IF;

    IF p_acao = 'buy' AND item.tipo <> 'congelamento' THEN
      INSERT INTO public.inventario_usuario (id, user_id, item_id, tipo, origem)
      VALUES (gen_random_uuid(), p_usuario, item.item_id, item.tipo, 'loja');
    ELSIF p_acao = 'build' THEN
      INSERT INTO public.cidade_finplay (user_id, item_id, linha, coluna)
      VALUES (p_usuario, item.item_id, linha_alvo, coluna_alvo);
    ELSIF p_acao = 'upgrade' THEN
      UPDATE public.cidade_finplay SET melhoria = novo_nivel WHERE id = predio.id;
    ELSIF p_acao = 'move' THEN
      UPDATE public.cidade_finplay SET linha = linha_alvo, coluna = coluna_alvo WHERE id = predio.id;
    END IF;
    INSERT INTO public.eventos_jogo (id, user_id, chave_evento, tipo, moedas_gastas, exibido_em)
    VALUES (gen_random_uuid(), p_usuario, chave, 'compra', custo, now());
    UPDATE public.progresso_usuario SET
      moedas = moedas - custo,
      congelamentos = congelamentos + CASE WHEN p_acao = 'buy' AND item.tipo = 'congelamento' THEN 1 ELSE 0 END,
      aprendizado_revisao = gen_random_uuid()
    WHERE user_id = p_usuario;
  ELSE
    RAISE EXCEPTION 'Operação indisponível.' USING ERRCODE = 'P0001';
  END IF;
  RETURN public.fin_play_estado(p_usuario);
END;
$operacao$;
REVOKE ALL ON FUNCTION public.fin_play_operar(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fin_play_operar(uuid, text, jsonb) TO service_role;

CREATE TABLE IF NOT EXISTS public.reflexoes_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL CHECK (char_length(btrim(titulo)) BETWEEN 1 AND 120),
  valor numeric(14,2) NOT NULL CHECK (valor > 0),
  criada_em timestamptz NOT NULL DEFAULT now(),
  horas smallint NOT NULL CHECK (horas IN (24, 48, 72))
);
ALTER TABLE public.reflexoes_compra ENABLE ROW LEVEL SECURITY;
DO $reflexoes$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reflexoes_compra' AND policyname = 'dono_total') THEN
    CREATE POLICY dono_total ON public.reflexoes_compra FOR ALL TO authenticated
      USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END;
$reflexoes$;
REVOKE ALL ON public.reflexoes_compra FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.reflexoes_compra TO authenticated;
CREATE INDEX IF NOT EXISTS reflexoes_compra_usuario_idx ON public.reflexoes_compra (user_id, criada_em DESC);

CREATE TABLE IF NOT EXISTS public.historias_finplay (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  revisao uuid NOT NULL,
  escolhas text[] NOT NULL DEFAULT '{}' CHECK (cardinality(escolhas) BETWEEN 0 AND 8)
);
ALTER TABLE public.historias_finplay ENABLE ROW LEVEL SECURITY;
DO $historias$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'historias_finplay' AND policyname = 'dono_total') THEN
    CREATE POLICY dono_total ON public.historias_finplay FOR ALL TO authenticated
      USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END;
$historias$;
REVOKE ALL ON public.historias_finplay FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.historias_finplay TO authenticated;

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS import_key text;
CREATE UNIQUE INDEX IF NOT EXISTS transactions_import_key_idx ON public.transactions (user_id, import_key) WHERE import_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.fin_importar_extrato(p_lote jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $extrato$
DECLARE
  dono uuid := auth.uid();
  linha jsonb;
  categoria text;
  valor numeric;
  chave text;
  tipo text;
  descricao text;
  quantidade integer := 0;
  adicionada integer;
BEGIN
  IF dono IS NULL OR jsonb_typeof(p_lote) IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_lote) NOT BETWEEN 1 AND 500
    THEN RAISE EXCEPTION 'O lote precisa ter entre 1 e 500 registros.' USING ERRCODE = 'P0001'; END IF;
  FOR linha IN SELECT value FROM jsonb_array_elements(p_lote) LOOP
    valor := (linha->>'valor')::numeric;
    chave := linha->>'chave';
    tipo := linha->>'tipo';
    descricao := btrim(linha->>'descricao');
    IF valor IS NULL OR valor <= 0 OR valor > 9999999999.99 OR valor <> round(valor, 2)
      OR chave IS NULL OR chave !~ '^[a-f0-9]{64}$'
      OR tipo IS NULL OR tipo NOT IN ('income', 'expense')
      OR descricao IS NULL OR char_length(descricao) NOT BETWEEN 1 AND 250
      THEN RAISE EXCEPTION 'Um registro do extrato está incompleto.' USING ERRCODE = 'P0001'; END IF;
    SELECT id INTO categoria FROM public.categories
      WHERE user_id = dono AND id = linha->>'categoria' AND public.categories.type = tipo;
    IF categoria IS NULL THEN RAISE EXCEPTION 'A categoria precisa pertencer à conta e ao tipo do lançamento.' USING ERRCODE = 'P0001'; END IF;
    INSERT INTO public.transactions (user_id, type, amount, description, date, category_id, payment_method, import_key)
    VALUES (dono, tipo, valor, descricao, (linha->>'data')::date, categoria, 'other', chave)
    ON CONFLICT (user_id, import_key) WHERE import_key IS NOT NULL DO NOTHING;
    GET DIAGNOSTICS adicionada = ROW_COUNT;
    quantidade := quantidade + adicionada;
  END LOOP;
  RETURN quantidade;
END;
$extrato$;
REVOKE ALL ON FUNCTION public.fin_importar_extrato(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fin_importar_extrato(jsonb) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
