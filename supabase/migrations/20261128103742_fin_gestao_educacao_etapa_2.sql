BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER TABLE public.progresso_usuario
  ADD COLUMN IF NOT EXISTS modo_app text NOT NULL DEFAULT 'classico'
    CHECK (modo_app IN ('classico', 'jogo')),
  ADD COLUMN IF NOT EXISTS jogo_ativo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS modo_escolhido_em timestamptz,
  ADD COLUMN IF NOT EXISTS biblioteca_visivel boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS moedas integer NOT NULL DEFAULT 0 CHECK (moedas >= 0),
  ADD COLUMN IF NOT EXISTS vidas smallint NOT NULL DEFAULT 5 CHECK (vidas BETWEEN 0 AND 5),
  ADD COLUMN IF NOT EXISTS vidas_atualizadas_em timestamptz,
  ADD COLUMN IF NOT EXISTS sequencia_dias integer NOT NULL DEFAULT 0 CHECK (sequencia_dias >= 0),
  ADD COLUMN IF NOT EXISTS melhor_sequencia integer NOT NULL DEFAULT 0
    CHECK (melhor_sequencia >= sequencia_dias),
  ADD COLUMN IF NOT EXISTS ultimo_estudo_em timestamptz,
  ADD COLUMN IF NOT EXISTS congelamentos integer NOT NULL DEFAULT 0 CHECK (congelamentos >= 0),
  ADD COLUMN IF NOT EXISTS ultimo_mundo_id text
    CHECK (ultimo_mundo_id IS NULL OR char_length(ultimo_mundo_id) BETWEEN 1 AND 120),
  ADD COLUMN IF NOT EXISTS reserva_meta_id text
    CHECK (reserva_meta_id IS NULL OR char_length(reserva_meta_id) BETWEEN 1 AND 120),
  ADD COLUMN IF NOT EXISTS lembretes_ativos boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ranking_ativo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS apelido_ranking text
    CHECK (apelido_ranking IS NULL OR (
      char_length(btrim(apelido_ranking)) >= 3 AND char_length(apelido_ranking) <= 32
    ));

CREATE TABLE IF NOT EXISTS public.aprendizado_progresso (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  licao_id text NOT NULL CHECK (char_length(licao_id) BETWEEN 1 AND 120),
  estrelas smallint NOT NULL DEFAULT 0 CHECK (estrelas BETWEEN 0 AND 3),
  concluida_em timestamptz,
  tentativas integer NOT NULL DEFAULT 0 CHECK (tentativas >= 0),
  melhor_pontuacao smallint NOT NULL DEFAULT 0 CHECK (melhor_pontuacao BETWEEN 0 AND 100),
  tentativa_atual_id uuid,
  etapa_atual integer NOT NULL DEFAULT 0 CHECK (etapa_atual >= 0),
  sessao jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(sessao) = 'object'),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, licao_id),
  CHECK (concluida_em IS NULL OR estrelas > 0)
);

CREATE TABLE IF NOT EXISTS public.aprendizado_respostas (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  licao_id text NOT NULL CHECK (char_length(licao_id) BETWEEN 1 AND 120),
  pergunta_id text NOT NULL CHECK (char_length(pergunta_id) BETWEEN 1 AND 120),
  tentativa_id uuid NOT NULL,
  rodada smallint NOT NULL DEFAULT 0 CHECK (rodada >= 0),
  acertou boolean NOT NULL,
  respondida_em timestamptz NOT NULL DEFAULT now(),
  revisar_em timestamptz,
  UNIQUE (user_id, tentativa_id, pergunta_id, rodada),
  CHECK (revisar_em IS NULL OR revisar_em >= respondida_em)
);

CREATE TABLE IF NOT EXISTS public.missoes_usuario (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  missao_id text NOT NULL CHECK (char_length(missao_id) BETWEEN 1 AND 120),
  periodo_tipo text NOT NULL CHECK (periodo_tipo IN ('diaria', 'semanal')),
  periodo_inicio date NOT NULL,
  progresso integer NOT NULL DEFAULT 0 CHECK (progresso >= 0),
  meta integer NOT NULL CHECK (meta > 0),
  concluida_em timestamptz,
  UNIQUE (user_id, periodo_tipo, periodo_inicio, missao_id),
  CHECK (concluida_em IS NULL OR progresso >= meta)
);

CREATE TABLE IF NOT EXISTS public.eventos_jogo (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chave_evento text NOT NULL CHECK (char_length(chave_evento) BETWEEN 1 AND 250),
  tipo text NOT NULL CHECK (tipo IN (
    'etapa', 'licao', 'prova', 'missao', 'desafio', 'meta', 'sequencia', 'compra', 'congelamento', 'treino'
  )),
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  moedas_ganhas integer NOT NULL DEFAULT 0 CHECK (moedas_ganhas >= 0),
  moedas_gastas integer NOT NULL DEFAULT 0 CHECK (moedas_gastas >= 0),
  conquista_id uuid REFERENCES public.conquistas(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  exibido_em timestamptz,
  UNIQUE (user_id, chave_evento),
  CHECK (moedas_ganhas = 0 OR moedas_gastas = 0),
  CHECK (exibido_em IS NULL OR exibido_em >= criado_em)
);

CREATE TABLE IF NOT EXISTS public.inventario_usuario (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL CHECK (char_length(item_id) BETWEEN 1 AND 120),
  tipo text NOT NULL CHECK (tipo IN ('roupa', 'cabelo', 'acessorio')),
  origem text NOT NULL CHECK (origem IN ('loja', 'patente', 'mundo')),
  adquirido_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.amizades_jogo (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amigo_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estado text NOT NULL DEFAULT 'pendente'
    CHECK (estado IN ('pendente', 'aceita', 'recusada', 'cancelada')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  respondida_em timestamptz,
  CHECK (user_id <> amigo_id),
  CHECK (respondida_em IS NULL OR respondida_em >= criado_em)
);

CREATE TABLE IF NOT EXISTS public.notificacoes_jogo (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE
    CHECK (left(endpoint, 8) = 'https://' AND octet_length(endpoint) BETWEEN 9 AND 2048),
  chave_p256dh text NOT NULL CHECK (char_length(chave_p256dh) BETWEEN 1 AND 512),
  chave_auth text NOT NULL CHECK (char_length(chave_auth) BETWEEN 1 AND 512),
  horario_local time NOT NULL,
  fuso_horario text NOT NULL DEFAULT 'America/Sao_Paulo'
    CHECK (char_length(fuso_horario) BETWEEN 1 AND 64),
  criada_em timestamptz NOT NULL DEFAULT now(),
  ultimo_envio_em timestamptz,
  revogada_em timestamptz
);

CREATE INDEX IF NOT EXISTS aprendizado_respostas_pergunta_idx
  ON public.aprendizado_respostas (user_id, pergunta_id, respondida_em DESC);

CREATE INDEX IF NOT EXISTS aprendizado_respostas_revisao_idx
  ON public.aprendizado_respostas (user_id, revisar_em)
  WHERE revisar_em IS NOT NULL;

CREATE INDEX IF NOT EXISTS eventos_jogo_por_data_idx
  ON public.eventos_jogo (user_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS eventos_jogo_pendentes_idx
  ON public.eventos_jogo (user_id, criado_em)
  WHERE exibido_em IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS eventos_jogo_conquista_idx
  ON public.eventos_jogo (conquista_id)
  WHERE conquista_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS amizades_jogo_par_idx
  ON public.amizades_jogo (least(user_id, amigo_id), greatest(user_id, amigo_id));

CREATE INDEX IF NOT EXISTS amizades_jogo_remetente_idx
  ON public.amizades_jogo (user_id, estado);

CREATE INDEX IF NOT EXISTS amizades_jogo_destinatario_idx
  ON public.amizades_jogo (amigo_id, estado);

CREATE INDEX IF NOT EXISTS notificacoes_jogo_usuario_idx
  ON public.notificacoes_jogo (user_id);

DO $politicas$
DECLARE
  nome_tabela text;
BEGIN
  FOREACH nome_tabela IN ARRAY ARRAY[
    'aprendizado_progresso', 'aprendizado_respostas', 'missoes_usuario',
    'eventos_jogo', 'inventario_usuario', 'amizades_jogo', 'notificacoes_jogo'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', nome_tabela);

    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policies AS politica
      WHERE politica.schemaname = 'public'
        AND politica.tablename = nome_tabela
        AND politica.policyname = 'dono_total'
    ) THEN
      EXECUTE format(
        'CREATE POLICY dono_total ON public.%I FOR ALL TO authenticated
          USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)',
        nome_tabela
      );
    END IF;

    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', nome_tabela);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role', nome_tabela);

    IF nome_tabela <> 'notificacoes_jogo' THEN
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', nome_tabela);
    END IF;
  END LOOP;
END;
$politicas$;

CREATE SCHEMA IF NOT EXISTS fin_gestao_educacao_privado;
REVOKE ALL ON SCHEMA fin_gestao_educacao_privado FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION fin_gestao_educacao_privado.proteger_estado_jogo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $protecao$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF ROW(
      NEW.moedas, NEW.vidas, NEW.vidas_atualizadas_em, NEW.sequencia_dias,
      NEW.melhor_sequencia, NEW.ultimo_estudo_em, NEW.congelamentos, NEW.ultimo_mundo_id
    ) IS DISTINCT FROM ROW(0, 5::smallint, NULL::timestamptz, 0, 0, NULL::timestamptz, 0, NULL::text) THEN
      RAISE EXCEPTION 'O estado do jogo é atualizado pelo servidor.' USING ERRCODE = '42501';
    END IF;
  ELSIF ROW(
    NEW.moedas, NEW.vidas, NEW.vidas_atualizadas_em, NEW.sequencia_dias,
    NEW.melhor_sequencia, NEW.ultimo_estudo_em, NEW.congelamentos, NEW.ultimo_mundo_id
  ) IS DISTINCT FROM ROW(
    OLD.moedas, OLD.vidas, OLD.vidas_atualizadas_em, OLD.sequencia_dias,
    OLD.melhor_sequencia, OLD.ultimo_estudo_em, OLD.congelamentos, OLD.ultimo_mundo_id
  ) THEN
    RAISE EXCEPTION 'O estado do jogo é atualizado pelo servidor.' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$protecao$;

REVOKE ALL ON FUNCTION fin_gestao_educacao_privado.proteger_estado_jogo()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER fin_gestao_proteger_estado_jogo
BEFORE INSERT OR UPDATE ON public.progresso_usuario
FOR EACH ROW EXECUTE FUNCTION fin_gestao_educacao_privado.proteger_estado_jogo();

COMMIT;

NOTIFY pgrst, 'reload schema';
