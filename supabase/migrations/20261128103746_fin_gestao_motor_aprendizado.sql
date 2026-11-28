BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER TABLE public.progresso_usuario
  ADD COLUMN IF NOT EXISTS aprendizado_revisao uuid;

CREATE OR REPLACE FUNCTION fin_gestao_educacao_privado.proteger_revisao_aprendizado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $revisao$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF current_user IN ('anon', 'authenticated') AND OLD.aprendizado_revisao IS NOT NULL THEN
      RAISE EXCEPTION 'O estado do aprendizado é atualizado pelo servidor.' USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF current_user IN ('anon', 'authenticated') AND (
    (TG_OP = 'INSERT' AND NEW.aprendizado_revisao IS NOT NULL)
    OR (TG_OP = 'UPDATE' AND NEW.aprendizado_revisao IS DISTINCT FROM OLD.aprendizado_revisao)
  ) THEN
    RAISE EXCEPTION 'O estado do aprendizado é atualizado pelo servidor.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$revisao$;

REVOKE ALL ON FUNCTION fin_gestao_educacao_privado.proteger_revisao_aprendizado() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE TRIGGER fin_gestao_proteger_revisao_aprendizado
BEFORE INSERT OR UPDATE OR DELETE ON public.progresso_usuario
FOR EACH ROW EXECUTE FUNCTION fin_gestao_educacao_privado.proteger_revisao_aprendizado();

GRANT SELECT, INSERT, UPDATE ON public.progresso_usuario TO service_role;
GRANT SELECT ON public.transactions TO service_role;
GRANT INSERT ON public.conquistas TO service_role;

CREATE OR REPLACE FUNCTION public.fin_aprendizado_ler(p_usuario uuid, p_dia date, p_semana date)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $leitura$
  WITH datas AS (
    SELECT p_dia::timestamp AT TIME ZONE 'America/Sao_Paulo' AS inicio,
      (p_dia + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo' AS fim,
      p_semana::timestamp AT TIME ZONE 'America/Sao_Paulo' AS semana
  )
  SELECT jsonb_build_object(
    'perfil', coalesce((
      SELECT jsonb_build_object('jogo_ativo', perfil.jogo_ativo, 'aprendizado_revisao', perfil.aprendizado_revisao,
        'xp', perfil.xp, 'nivel', perfil.nivel, 'moedas', perfil.moedas, 'vidas', perfil.vidas,
        'vidas_atualizadas_em', perfil.vidas_atualizadas_em, 'sequencia_dias', perfil.sequencia_dias,
        'melhor_sequencia', perfil.melhor_sequencia, 'ultimo_estudo_em', perfil.ultimo_estudo_em,
        'congelamentos', perfil.congelamentos, 'ultimo_mundo_id', perfil.ultimo_mundo_id)
      FROM public.progresso_usuario AS perfil WHERE perfil.user_id = p_usuario
    ), '{"jogo_ativo":true,"aprendizado_revisao":null,"xp":0,"nivel":1,"moedas":0,"vidas":5,"vidas_atualizadas_em":null,"sequencia_dias":0,"melhor_sequencia":0,"ultimo_estudo_em":null,"congelamentos":0,"ultimo_mundo_id":null}'::jsonb),
    'licoes', coalesce((SELECT jsonb_agg(to_jsonb(licao) - 'user_id')
      FROM public.aprendizado_progresso AS licao WHERE licao.user_id = p_usuario), '[]'::jsonb),
    'respostas', coalesce((
      SELECT jsonb_agg(to_jsonb(recente)) FROM (
        SELECT DISTINCT ON (resposta.pergunta_id) resposta.licao_id, resposta.pergunta_id, resposta.revisar_em
        FROM public.aprendizado_respostas AS resposta WHERE resposta.user_id = p_usuario
        ORDER BY resposta.pergunta_id, resposta.respondida_em DESC, resposta.rodada DESC
      ) AS recente
    ), '[]'::jsonb),
    'missoes', coalesce((SELECT jsonb_agg(to_jsonb(missao) - 'user_id') FROM public.missoes_usuario AS missao
      WHERE missao.user_id = p_usuario AND missao.periodo_inicio IN (p_dia, p_semana)), '[]'::jsonb),
    'chaves', coalesce((SELECT jsonb_agg(evento.chave_evento) FROM public.eventos_jogo AS evento
      WHERE evento.user_id = p_usuario AND (evento.criado_em >= datas.semana OR evento.tipo IN ('etapa','licao','prova','sequencia'))), '[]'::jsonb),
    'xp_dia', coalesce((SELECT sum(evento.xp) FROM public.eventos_jogo AS evento
      WHERE evento.user_id = p_usuario AND evento.criado_em >= datas.inicio AND evento.criado_em < datas.fim), 0),
    'pendentes', coalesce((
      SELECT jsonb_agg(to_jsonb(aviso)) FROM (
        SELECT evento.id, evento.chave_evento, evento.xp, evento.moedas_ganhas FROM public.eventos_jogo AS evento
        WHERE evento.user_id = p_usuario AND evento.exibido_em IS NULL AND (evento.xp > 0 OR evento.moedas_ganhas > 0)
        ORDER BY evento.criado_em LIMIT 30
      ) AS aviso
    ), '[]'::jsonb),
    'tem_gasto', EXISTS (SELECT 1 FROM public.transactions AS transacao WHERE transacao.user_id = p_usuario
      AND transacao.type = 'expense' AND transacao.created_at >= datas.inicio AND transacao.created_at < datas.fim)
  )
  FROM datas;
$leitura$;

CREATE OR REPLACE FUNCTION public.fin_aprendizado_salvar(p_usuario uuid, p_anterior uuid, p_nova uuid, p_lote jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $gravacao$
DECLARE
  atual public.progresso_usuario%ROWTYPE;
  perfil_dados jsonb := p_lote->'perfil';
  item jsonb;
  registro uuid;
  premio jsonb;
  xp_soma bigint := 0;
  moedas_soma bigint := 0;
  xp_final integer;
BEGIN
  INSERT INTO public.progresso_usuario (user_id) VALUES (p_usuario) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO STRICT atual FROM public.progresso_usuario WHERE user_id = p_usuario FOR UPDATE;
  IF NOT atual.jogo_ativo OR atual.aprendizado_revisao IS DISTINCT FROM p_anterior THEN
    RETURN false;
  END IF;

  IF p_lote ? 'licao' THEN
    item := p_lote->'licao';
    INSERT INTO public.aprendizado_progresso
      (id, user_id, licao_id, estrelas, melhor_pontuacao, tentativas, concluida_em, atualizado_em, tentativa_atual_id, etapa_atual, sessao)
    VALUES ((item->>'id')::uuid, p_usuario, item->>'licao_id', (item->>'estrelas')::smallint, (item->>'melhor_pontuacao')::smallint,
      (item->>'tentativas')::int, (item->>'concluida_em')::timestamptz, (item->>'atualizado_em')::timestamptz,
      (item->'sessao'->>'id')::uuid, (item->'sessao'->>'index')::int, item->'sessao')
    ON CONFLICT (user_id, licao_id) DO UPDATE SET
      estrelas = EXCLUDED.estrelas, melhor_pontuacao = EXCLUDED.melhor_pontuacao, tentativas = EXCLUDED.tentativas,
      concluida_em = EXCLUDED.concluida_em, atualizado_em = EXCLUDED.atualizado_em,
      tentativa_atual_id = EXCLUDED.tentativa_atual_id, etapa_atual = EXCLUDED.etapa_atual, sessao = EXCLUDED.sessao;
  END IF;

  IF p_lote ? 'resposta' THEN
    item := p_lote->'resposta';
    INSERT INTO public.aprendizado_respostas
      (id, user_id, licao_id, pergunta_id, tentativa_id, rodada, acertou, respondida_em, revisar_em)
    VALUES ((item->>'id')::uuid, p_usuario, item->>'licao_id', item->>'pergunta_id', (item->>'tentativa_id')::uuid,
      (item->>'rodada')::smallint, (item->>'acertou')::boolean, (item->>'respondida_em')::timestamptz,
      (item->>'revisar_em')::timestamptz);
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_lote->'missoes')
  LOOP
    INSERT INTO public.missoes_usuario (id, user_id, missao_id, periodo_tipo, periodo_inicio, progresso, meta, concluida_em)
    VALUES ((item->>'id')::uuid, p_usuario, item->>'missao_id', item->>'periodo_tipo', (item->>'periodo_inicio')::date,
      (item->>'progresso')::int, (item->>'meta')::int, (item->>'concluida_em')::timestamptz)
    ON CONFLICT (user_id, periodo_tipo, periodo_inicio, missao_id) DO UPDATE SET
      progresso = EXCLUDED.progresso, concluida_em = EXCLUDED.concluida_em;
  END LOOP;

  FOR item IN SELECT value FROM jsonb_array_elements(p_lote->'eventos')
  LOOP
    INSERT INTO public.eventos_jogo (id, user_id, chave_evento, tipo, xp, moedas_ganhas, exibido_em)
    VALUES ((item->>'id')::uuid, p_usuario, item->>'chave_evento', item->>'tipo', (item->>'xp')::int,
      (item->>'moedas_ganhas')::int, CASE WHEN NOT (item->>'anuncia')::boolean THEN now() END)
    ON CONFLICT (user_id, chave_evento) DO NOTHING
    RETURNING id INTO registro;
    IF registro IS NOT NULL THEN
      xp_soma := xp_soma + (item->>'xp')::int;
      moedas_soma := moedas_soma + (item->>'moedas_ganhas')::int;
      IF item ? 'conquista' THEN
        premio := item->'conquista';
        INSERT INTO public.conquistas (id, user_id, titulo, descricao, icone_nome, raridade, desbloqueada_em, personalizada, oculta, comemorada)
        VALUES ((premio->>'id')::uuid, p_usuario, premio->>'titulo', premio->>'descricao', premio->>'icone_nome',
          CASE WHEN item->>'tipo' = 'prova' THEN 'epica' ELSE 'comum' END, now(), false, false, false);
        UPDATE public.eventos_jogo SET conquista_id = (premio->>'id')::uuid WHERE id = registro;
      END IF;
    END IF;
  END LOOP;

  xp_final := LEAST(atual.xp::bigint + xp_soma, 2147483647)::integer;
  UPDATE public.progresso_usuario SET
    aprendizado_revisao = p_nova,
    revisao_trilha = CASE WHEN xp_soma > 0 THEN p_nova ELSE atual.revisao_trilha END,
    xp = xp_final,
    nivel = CASE WHEN xp_soma > 0 THEN GREATEST(atual.nivel, xp_final / 500 + 1) ELSE atual.nivel END,
    moedas = LEAST(atual.moedas::bigint + moedas_soma, 2147483647)::integer,
    vidas = (perfil_dados->>'vidas')::smallint,
    vidas_atualizadas_em = (perfil_dados->>'vidas_atualizadas_em')::timestamptz,
    sequencia_dias = (perfil_dados->>'sequencia_dias')::int,
    melhor_sequencia = (perfil_dados->>'melhor_sequencia')::int,
    ultimo_estudo_em = (perfil_dados->>'ultimo_estudo_em')::timestamptz,
    congelamentos = (perfil_dados->>'congelamentos')::int,
    ultimo_mundo_id = perfil_dados->>'ultimo_mundo_id'
  WHERE user_id = p_usuario;
  RETURN true;
END;
$gravacao$;

REVOKE ALL ON FUNCTION public.fin_aprendizado_ler(uuid, date, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fin_aprendizado_salvar(uuid, uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fin_aprendizado_ler(uuid, date, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.fin_aprendizado_salvar(uuid, uuid, uuid, jsonb) TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
