import { getSupabaseClient } from '../lib/supabase';
import { notifyLearningActivity } from './learningService';

export type SavingsMovementType = 'aporte' | 'retirada';
export interface SavingsMovement { id: string; tipo: SavingsMovementType; valor: number; criada_em: string }

export async function recordSavingsMovement(meta: string, kind: SavingsMovementType, amount: number, id: string) {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.rpc('fin_cofrinho_lancar', { p_meta: meta, p_tipo: kind, p_valor: amount, p_id: id });
  if (error?.code === 'PGRST202') return false;
  if (error) throw new Error(error.code === 'P0001' ? error.message : 'Não foi possível salvar o movimento no cofrinho.');
  notifyLearningActivity();
  return true;
}

export async function readSavingsMovements(userId: string, goalId: string, signal: AbortSignal) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Conecte a conta para consultar o histórico.');
  const { data, error } = await client.from('movimentos_cofrinho').select('id,tipo,valor,criada_em')
    .eq('user_id', userId).eq('meta_id', goalId).order('criada_em', { ascending: false }).limit(100).abortSignal(signal);
  if (error) throw new Error('O histórico requer a migração do cofrinho no Supabase.');
  return (data ?? []) as SavingsMovement[];
}
