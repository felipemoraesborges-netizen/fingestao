import type { Goal, TrailLedger, TrailMovement, TrailMovementInput } from '../types';
import { generateUUID, isValidUUID } from '../utils/id';
import { cents, signedTrailCents, trailEpochDay } from '../utils/trail';
import { check, database, optional, requireMoney, rows } from './supabaseQueries';
import { notifyLearningActivity } from './learningService';
import type { QueryError, Row } from './supabaseQueries';

type NewGoal = Omit<Goal, 'id' | 'createdAt'>;

function checkTrailLedger(error: QueryError) {
  if (error && ['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error.code ?? '')) {
    throw new Error('Saldo próprio indisponível. Confira aportes_trilha e total_trilha no Supabase.');
  }
  check(error);
}

const trailWrites = new Map<string, Promise<void>>();

function serializeTrailWrite(userId: string, action: () => Promise<void>) {
  const locks = globalThis.navigator?.locks;
  if (locks) return locks.request('fingestao:aportes-trilha:' + userId, action);

  const previous = trailWrites.get(userId) ?? Promise.resolve();
  const current = previous.then(action);
  const drained = current.then(() => undefined, () => undefined);
  trailWrites.set(userId, drained);
  void drained.then(() => {
    if (trailWrites.get(userId) === drained) trailWrites.delete(userId);
  });
  return current;
}

export function mapGoal(row: Row): Goal {
  return {
    id: String(row.id), nome: String(row.nome), preco: Number(row.preco), categoria: String(row.categoria ?? 'outro'),
    imagemUrl: optional(row.imagem_url), linkLoja: optional(row.link_loja), observacao: optional(row.observacao),
    prioridade: row.prioridade == null ? undefined : Number(row.prioridade),
    ordemManual: row.ordem_manual == null ? undefined : Number(row.ordem_manual),
    status: row.status as Goal['status'], valorAcumulado: Number(row.valor_acumulado ?? 0),
    conquistadoEm: optional(row.conquistado_em ?? row.concluida_em), createdAt: String(row.created_at ?? ''),
  };
}

export class PurchaseGoalsService {
  static async getGoals(userId: string) {
    return (await rows('metas_compra', userId)).map(mapGoal);
  }

  static async saveGoal(userId: string, goal: NewGoal, id?: string) {
    const fields = {
      nome: goal.nome.trim(), preco: requireMoney(goal.preco), categoria: goal.categoria,
      imagem_url: goal.imagemUrl ?? null, link_loja: goal.linkLoja ?? null, observacao: goal.observacao ?? null,
    };
    if (!fields.nome) throw new Error('Informe um nome para o produto.');
    const table = database().from('metas_compra');
    const { error } = id
      ? await table.update(fields).eq('id', id).eq('user_id', userId).select('id').single()
      : await table.insert({ ...fields, id: generateUUID(), user_id: userId });
    check(error);
    notifyLearningActivity();
  }

  static async deleteGoal(id: string, userId: string) {
    const { error } = await database().from('metas_compra').delete().eq('user_id', userId).eq('id', id);
    check(error);
  }

  private static async getTrailBalance(userId: string) {
    const { data, error } = await database().from('total_trilha').select('total').eq('user_id', userId).maybeSingle();
    checkTrailLedger(error);
    const total = Number(data?.total ?? 0);
    if (!Number.isSafeInteger(cents(total))) throw new Error('O saldo retornado é inválido.');
    return cents(total) / 100;
  }

  static async getTrailLedger(userId: string): Promise<TrailLedger> {
    const [total, entries] = await Promise.all([
      this.getTrailBalance(userId),
      rows('aportes_trilha', userId, 'id', 'id,valor,tipo,observacao,data,created_at', checkTrailLedger),
    ]);
    const movements = entries.map((entry): TrailMovement => {
      const valor = Number(entry.valor);
      if ((entry.tipo !== 'aporte' && entry.tipo !== 'retirada') || !Number.isSafeInteger(cents(valor)) || valor <= 0) {
        throw new Error('Há um lançamento inválido no histórico de aportes.');
      }
      return {
        id: String(entry.id), tipo: entry.tipo, valor, data: String(entry.data).slice(0, 10),
        observacao: typeof entry.observacao === 'string' ? entry.observacao : null,
        createdAt: String(entry.created_at ?? ''),
      };
    }).sort((left, right) => right.data.localeCompare(left.data) || right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id));
    return { total, movements };
  }

  static saveTrailMovement(userId: string, input: TrailMovementInput, original?: TrailMovement) {
    return serializeTrailWrite(userId, async () => {
      const valor = requireMoney(input.valor);
      if (trailEpochDay(input.data) === undefined) throw new Error('Informe uma data válida.');
      if (input.tipo !== 'aporte' && input.tipo !== 'retirada') throw new Error('Tipo de lançamento inválido.');
      const payload = { valor, tipo: input.tipo, data: input.data, observacao: input.observacao?.trim() || null };
      await this.verifyTrailBalance(userId, payload, original);
      if (original) {
        await this.changeTrailMovement(userId, original, payload);
        notifyLearningActivity();
        return;
      }
      const { error } = await database().from('aportes_trilha').insert({ ...payload, id: generateUUID(), user_id: userId });
      checkTrailLedger(error);
      notifyLearningActivity();
    });
  }

  static deleteTrailMovement(userId: string, original: TrailMovement) {
    return serializeTrailWrite(userId, async () => {
      await this.verifyTrailBalance(userId, undefined, original);
      await this.changeTrailMovement(userId, original);
    });
  }

  private static async verifyTrailBalance(userId: string, next?: TrailMovementInput, original?: TrailMovement) {
    const balance = cents(await this.getTrailBalance(userId));
    const proposed = balance + signedTrailCents(next) - signedTrailCents(original);
    if (!Number.isSafeInteger(proposed)) throw new Error('Esse lançamento ultrapassa o limite de saldo.');
    if (proposed < 0) throw new Error('Saldo insuficiente. Esse lançamento deixaria o saldo negativo.');
  }

  private static async changeTrailMovement(userId: string, original: TrailMovement, payload?: TrailMovementInput) {
    if (!isValidUUID(original.id)) throw new Error('Identificador do lançamento inválido.');
    const table = database().from('aportes_trilha');
    const update = (payload ? table.update(payload) : table.delete())
      .eq('user_id', userId).eq('id', original.id).eq('valor', original.valor).eq('tipo', original.tipo).eq('data', original.data);
    const unchanged = original.observacao === null ? update.is('observacao', null) : update.eq('observacao', original.observacao);
    const { data, error } = await unchanged.select('id').maybeSingle();
    checkTrailLedger(error);
    if (!data) throw new Error('Esse lançamento mudou em outra sessão. Atualize o histórico e tente novamente.');
  }
}
