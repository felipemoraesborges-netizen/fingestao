import { getSupabaseClient } from '../lib/supabase';
import type { LearningAction, LearningSnapshot } from '../learning/contracts';
import type { PlayAction, PlayState } from '../learning/playContracts';

export const learningActivityEvent = 'fingestao:financial-activity';

export function notifyLearningActivity() {
  window.dispatchEvent(new Event(learningActivityEvent));
}

export async function sendLearningAction(action: { action: 'expense' }, signal?: AbortSignal): Promise<{ ok: true }>;
export async function sendLearningAction(action: Exclude<LearningAction, { action: 'expense' }>, signal?: AbortSignal): Promise<LearningSnapshot>;
export async function sendLearningAction(action: LearningAction, signal?: AbortSignal) {
  return sendGameRequest(action, signal);
}

export function sendPlayAction(command: PlayAction, signal?: AbortSignal): Promise<PlayState> {
  return sendGameRequest({ action: 'play', command }, signal);
}

async function sendGameRequest(action: LearningAction | { action: 'play'; command: PlayAction }, signal?: AbortSignal) {
  const session = await getSupabaseClient()?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!token) throw new Error('Entre na sua conta para estudar.');
  const response = await fetch('/api/aprendizado', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(action), signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || ('error' in data && data.error)) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'O Aprender está indisponível no momento. Tente novamente.');
  }
  return data;
}
