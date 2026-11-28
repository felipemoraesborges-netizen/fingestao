import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { LearningError, makeSnapshot, planStudy, studyCalendar } from './learningEngine.ts';
import type { PracticeData, StudyData } from './learningEngine.ts';

const maxBody = 8192;
const code = z.string().regex(/^[a-z0-9-]{1,96}$/);
const attempt = { lessonId: code, sessionId: z.uuid() };
const checkpoint = { ...attempt, cursor: z.number().int().min(0).max(200) };
const answer = z.union([code, z.boolean(), z.number().finite(), z.array(code).max(16), z.record(code, code)]);
const plot = { row: z.number().int().min(0).max(7), col: z.number().int().min(0).max(7), request: z.uuid() };
const playCommand = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('state') }),
  z.strictObject({ type: z.literal('reminded') }),
  z.strictObject({ type: z.literal('profile'), ranking: z.boolean().optional(), alias: z.string().trim().max(32).refine(value => !value || value.length >= 3).optional(),
    reminder: z.boolean().optional(), time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).optional() }),
  z.strictObject({ type: z.literal('invite'), code: z.uuid() }),
  z.strictObject({ type: z.literal('friend'), id: z.uuid(), decision: z.enum(['accept', 'decline', 'remove']) }),
  z.strictObject({ type: z.literal('buy'), item: code, request: z.uuid() }),
  z.strictObject({ type: z.literal('equip'), item: code }),
  z.strictObject({ type: z.literal('build'), item: code, ...plot }),
  z.strictObject({ type: z.literal('move'), id: z.uuid(), ...plot }),
  z.strictObject({ type: z.literal('upgrade'), id: z.uuid(), tier: z.number().int().min(2).max(3), request: z.uuid() }),
]);
const requestAction = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('state'), lessonId: code.optional(), worldId: code.optional() }),
  z.strictObject({ action: z.literal('start'), lessonId: code, mode: z.enum(['normal', 'treinar', 'revisar']) }),
  z.strictObject({ action: z.literal('answer'), ...checkpoint, answer }),
  z.strictObject({ action: z.literal('next'), ...checkpoint }),
  z.strictObject({ action: z.literal('train'), ...attempt }),
  z.strictObject({ action: z.literal('acknowledge'), ids: z.array(z.uuid()).min(1).max(100), worldId: code.optional() }),
  z.strictObject({ action: z.literal('expense') }),
  z.strictObject({ action: z.literal('play'), command: playCommand }),
]);

type Request = IncomingMessage & { body?: unknown };

async function readBody(request: Request) {
  if (Number(request.headers['content-length']) > maxBody) throw new LearningError('Solicitação muito longa.', 413);
  let input = request.body;
  if (input === undefined) {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of request.iterator({ destroyOnReturn: false })) {
      const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string);
      size += part.length;
      if (size > maxBody) throw new LearningError('Solicitação muito longa.', 413);
      chunks.push(part);
    }
    input = Buffer.concat(chunks).toString('utf8');
  }
  const raw = typeof input === 'string' ? input : JSON.stringify(input);
  if (!raw || Buffer.byteLength(raw) > maxBody) throw new LearningError('Solicitação inválida.', 400);
  try {
    return requestAction.parse(JSON.parse(raw));
  } catch {
    throw new LearningError('Solicitação inválida.', 400);
  }
}

function send(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

function storageError(error: { code: string }) {
  if (['PGRST202', '42883', '42703', '42P01'].includes(error.code)) {
    return new LearningError('A configuração do Aprender no Supabase ainda está incompleta.', 503);
  }
  console.error('Falha ao acessar o progresso do Aprender.', error.code);
  return new LearningError('O Aprender está indisponível no momento. Tente novamente.', 503);
}

export async function learningHttp(request: Request, response: ServerResponse, env: Record<string, string | undefined>) {
  try {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      throw new LearningError('Método indisponível.', 405);
    }
    if (!request.headers['content-type']?.match(/^application\/json(?:\s*;|$)/i)) throw new LearningError('Envie os dados em JSON.', 415);
    const token = /^Bearer ([\w.-]+)$/i.exec(request.headers.authorization ?? '')?.[1];
    if (!token) throw new LearningError('Entre na sua conta para estudar.', 401);
    const action = await readBody(request);
    const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !secret) throw new LearningError('O servidor do Aprender ainda precisa ser configurado.', 503);
    const database = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
    const { data: auth, error: authError } = await database.auth.getUser(token);
    if (authError && (!authError.status || authError.status >= 500)) throw new LearningError('A autenticação está indisponível no momento.', 503);
    const user = auth.user;
    if (!user) throw new LearningError('Sua sessão expirou. Entre novamente para estudar.', 401);
    const userId = user.id;

    if (action.action === 'play') {
      const { type, ...fields } = action.command;
      const { data, error } = await database.rpc('fin_play_operar', { p_usuario: userId, p_acao: type, p_dados: fields });
      if (error) {
        if (error.code === 'P0001' && error.message) throw new LearningError(error.message, 409);
        throw storageError(error);
      }
      if (!data) throw new LearningError('O perfil do FinGestão Play está indisponível.', 503);
      send(response, 200, data);
      return;
    }

    const now = new Date();
    const { day, week } = studyCalendar(now);
    const withPractice = ['state', 'expense', 'acknowledge'].includes(action.action);
    async function load() {
      const { data, error } = await database.rpc('fin_aprendizado_ler', { p_usuario: userId, p_dia: day, p_semana: week });
      if (error) throw storageError(error);
      if (!data?.perfil?.jogo_ativo) throw new LearningError('Ative o Modo Jogo nas configurações para estudar.', 403);
      const study = data as StudyData;
      if (withPractice) {
        const { data: practice, error: practiceError } = await database.rpc('fin_pratica_estado', { p_usuario: userId, p_dia: day });
        if (practiceError && practiceError.code !== 'PGRST202') throw storageError(practiceError);
        if (practice) study.pratica = practice as PracticeData;
      }
      return study;
    }

    let current = await load();
    const lessonId = 'lessonId' in action ? action.lessonId : undefined;
    const worldId = 'worldId' in action ? action.worldId : undefined;
    if (action.action === 'acknowledge') {
      const { error } = await database.from('eventos_jogo').update({ exibido_em: now.toISOString() })
        .eq('user_id', userId).is('exibido_em', null).in('id', action.ids);
      if (error) throw storageError(error);
      current = await load();
    } else {
      for (let retry = 0; retry < 4; retry++) {
        const batch = planStudy(current, action, now);
        if (!batch) break;
        const { data: saved, error } = await database.rpc('fin_aprendizado_salvar', {
          p_usuario: userId, p_anterior: current.perfil.aprendizado_revisao, p_nova: randomUUID(), p_lote: batch,
        });
        if (error) throw storageError(error);
        current = await load();
        if (saved) break;
        if (retry === 3) throw new LearningError('O progresso mudou em outra tela. Tente novamente.', 409);
      }
    }
    send(response, 200, action.action === 'expense' ? { ok: true } : makeSnapshot(current, lessonId, now, worldId));
  } catch (error) {
    if (error instanceof LearningError) send(response, error.status, { error: error.message });
    else {
      console.error('Falha ao processar solicitação do Aprender.', error instanceof Error ? error.name : 'Erro desconhecido');
      send(response, 500, { error: 'Não foi possível abrir o Aprender. Tente novamente.' });
    }
  }
}
