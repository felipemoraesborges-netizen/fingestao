import { getSupabaseClient } from '../lib/supabase';
import { cents, MAX_MONEY } from '../utils/trail';

export type Row = Record<string, unknown>;
export type QueryError = { message: string; code?: string } | null;

export function database() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Conecte sua conta ao Supabase.');
  return client;
}

export function check(error: QueryError) {
  if (error) throw new Error(error.message);
}

export function optional(value: unknown) {
  return typeof value === 'string' && value ? value : undefined;
}

export function requireMoney(value: number) {
  if (!Number.isFinite(value) || cents(value) < 1 || value > MAX_MONEY) {
    throw new Error('Informe um valor positivo válido em reais.');
  }
  return cents(value) / 100;
}

export async function rows(table: string, userId: string, order = 'id', columns = '*', handleError = check): Promise<Row[]> {
  const result: Row[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await database().from(table).select(columns).eq('user_id', userId)
      .order(order).range(offset, offset + pageSize - 1);
    handleError(error);
    const page = (data ?? []) as unknown as Row[];
    result.push(...page);
    if (page.length < pageSize) return result;
  }
}
