import type { Achievement, Contribution, Goal, Rank, RankHistory, TrailPreferences, UserProgress } from '../types';
import { generateUUID, isValidUUID } from '../utils/id';
import { calculateTrail, cents, countAchievements, DEFAULT_HOUSE_VALUE, DEFAULT_PREFERENCES, MAX_MONEY, rankStatus, rarityFor } from '../utils/trail';
import { productIcon } from '../data/achievementIcons';
import { mapGoal } from './purchaseGoalsService';
import { check, database, optional, requireMoney, rows } from './supabaseQueries';
import type { QueryError, Row } from './supabaseQueries';

type NewAchievement = Omit<Achievement, 'id' | 'createdAt'>;
type RankInput = Pick<Rank, 'nome' | 'cor' | 'iconeUrl' | 'conquistasNecessarias'>;

function object(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};
}

function missingColumn(error: QueryError, column: string) {
  return error && ['42703', 'PGRST204'].includes(error.code ?? '') && error.message.includes(column);
}

function mapAchievement(row: Row): Achievement {
  const rarity = String(row.raridade) as Achievement['raridade'];
  return {
    id: String(row.id), goalId: optional(row.meta_id), titulo: String(row.titulo),
    descricao: optional(row.descricao), frasePessoal: optional(row.frase_pessoal ?? row.frase),
    iconeUrl: optional(row.icone_url), iconeNome: optional(row.icone_nome), comemorada: Boolean(row.comemorada),
    excluida: Boolean(row.excluida), produto: row.produto_trilha as Achievement['produto'] ?? undefined,
    raridade: ['comum', 'rara', 'epica', 'lendaria'].includes(rarity) ? rarity : 'comum',
    desbloqueadaEm: optional(row.desbloqueada_em), personalizada: Boolean(row.personalizada),
    oculta: Boolean(row.oculta), createdAt: String(row.created_at ?? ''),
  };
}

function mapRank(row: Row): Rank {
  return {
    id: String(row.id), nome: String(row.nome), cor: String(row.cor), iconeUrl: optional(row.icone_url),
    conquistasNecessarias: Number(row.conquistas_necessarias), ordem: Number(row.ordem),
    padrao: Boolean(row.padrao), arquivada: Boolean(row.arquivada), createdAt: String(row.created_at ?? ''),
  };
}

function mapProgress(row: Row): UserProgress {
  const value = Number(row.valor_casa);
  const prefs = object(row.preferencias_trilha);
  const limits = prefs.limites;
  const limitsValid = Array.isArray(limits) && limits.length === 3 &&
    limits.every((limit, index) => typeof limit === 'number' && Number.isFinite(limit) && limit >= (index ? limits[index - 1] : 0));
  return {
    userId: String(row.user_id), xp: Number(row.xp ?? 0), nivel: Number(row.nivel ?? 1),
    sequenciaMeses: Number(row.sequencia_meses ?? 0), rankAtualId: optional(row.patente_atual_id),
    updatedAt: String(row.updated_at ?? ''), avatarConfig: row.avatar_config, avataresSalvos: row.avatares_salvos,
    valorCasa: Number.isFinite(value) && value >= 0.01 ? value : DEFAULT_HOUSE_VALUE,
    preferencias: {
      som: prefs.som === true,
      limites: limitsValid ? limits as TrailPreferences['limites'] : DEFAULT_PREFERENCES.limites,
      itensPorPatente: Object.fromEntries(Object.entries(object(prefs.itensPorPatente)).filter(([, rankId]) => typeof rankId === 'string')) as Record<string, string>,
    },
    marcoMaximo: Number(row.marco_maximo_trilha ?? 0), revisao: optional(row.revisao_trilha),
    promocao: row.promocao_trilha as UserProgress['promocao'] ?? undefined,
  };
}

export class GamificationService {
  static async addContribution(contribution: Omit<Contribution, 'id' | 'createdAt'>, userId: string) {
    const { goalId, tipo, data, nota } = contribution;
    if (!isValidUUID(goalId)) throw new Error('Identificador do produto inválido.');
    const valor = requireMoney(contribution.valor);
    const client = database();
    const { data: raw, error } = await client.from('metas_compra').select('*').eq('user_id', userId).eq('id', goalId).single();
    check(error);
    const goal = mapGoal(raw as Row);
    const newValue = (cents(goal.valorAcumulado) + cents(tipo === 'aporte' ? valor : -valor)) / 100;
    if (newValue < 0 || newValue > MAX_MONEY) throw new Error('O movimento ultrapassa o saldo permitido para este produto.');
    const status = newValue >= goal.preco ? 'concluida' : newValue > 0 ? 'em_andamento' : 'bloqueada';
    const dateField = Object.hasOwn(raw as Row, 'conquistado_em') ? 'conquistado_em' : 'concluida_em';
    const dates = Object.hasOwn(raw as Row, dateField) ? {
      [dateField]: status === 'concluida' ? goal.conquistadoEm ?? new Date().toISOString() : null,
    } : {};
    const id = generateUUID();
    const insert = await client.from('contribuicoes').insert({ id, user_id: userId, meta_id: goalId, valor, tipo, data, nota });
    check(insert.error);
    const update = await client.from('metas_compra').update({ valor_acumulado: newValue, status, ...dates })
      .eq('user_id', userId).eq('id', goalId).eq('valor_acumulado', goal.valorAcumulado).select('id').maybeSingle();
    if (update.error || !update.data) {
      const rollback = await client.from('contribuicoes').delete().eq('user_id', userId).eq('id', id);
      if (rollback.error) throw new Error('Falha ao reconciliar o movimento. Confira o saldo antes de repetir.');
      check(update.error);
      throw new Error('O saldo mudou em outra sessão. Tente novamente.');
    }
    try { await this.addContributionXp(userId); }
    catch (reason) { console.warn('O movimento foi salvo, mas o XP não foi atualizado.', reason); }
  }

  private static async addContributionXp(userId: string) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const progress = await this.getUserProgress(userId);
      const xp = Math.min(2_147_483_647, progress.xp + 10);
      if (await this.updateProgressRevision(progress, { xp, nivel: Math.floor(xp / 500) + 1 })) return;
    }
  }

  static async getAchievements(userId: string) {
    return (await rows('conquistas', userId)).map(mapAchievement);
  }

  static async saveAchievement(userId: string, achievement: NewAchievement, id?: string): Promise<Achievement> {
    const fields = {
      titulo: achievement.titulo.trim(), descricao: achievement.descricao ?? null,
      icone_url: achievement.iconeUrl ?? null, icone_nome: achievement.iconeNome ?? null,
      raridade: achievement.raridade, desbloqueada_em: achievement.desbloqueadaEm ?? null,
      personalizada: achievement.personalizada, oculta: achievement.oculta,
    };
    if (!fields.titulo) throw new Error('Informe um título.');
    const write = (phraseColumn: string) => {
      const table = database().from('conquistas');
      const payload = { ...fields, [phraseColumn]: achievement.frasePessoal ?? null };
      return (id
        ? table.update(payload).eq('id', id).eq('user_id', userId)
        : table.insert({ ...payload, id: generateUUID(), user_id: userId })).select().single();
    };
    let result = await write('frase_pessoal');
    if (missingColumn(result.error, 'frase_pessoal')) result = await write('frase');
    check(result.error);
    return mapAchievement(result.data as Row);
  }

  static async deleteAchievement(id: string, userId: string) {
    const { error } = await database().from('conquistas').update({ excluida: true }).eq('user_id', userId).eq('id', id);
    check(error);
  }

  static async claimCelebration(userId: string, id: string, promotion = false) {
    const table = promotion ? 'historico_patentes' : 'conquistas';
    const field = promotion ? 'comemorada_trilha' : 'comemorada';
    const { data, error } = await database().from(table).update({ [field]: true })
      .eq('user_id', userId).eq('id', id).eq(field, false).select('id').maybeSingle();
    check(error);
    return Boolean(data);
  }

  static async getUserProgress(userId: string): Promise<UserProgress> {
    const table = database().from('progresso_usuario');
    const read = () => database().from('progresso_usuario').select('*').eq('user_id', userId).maybeSingle();
    let result = await read();
    check(result.error);
    if (!result.data) {
      const { error } = await table.upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });
      check(error);
      result = await read();
      check(result.error);
    }
    if (!result.data || !Object.hasOwn(result.data, 'valor_casa')) throw new Error('Aplique a migração trilha-conquistas.sql no Supabase.');
    return mapProgress(result.data as Row);
  }

  static async saveSettings(userId: string, fields: Partial<Pick<UserProgress, 'valorCasa' | 'avatarConfig' | 'avataresSalvos' | 'preferencias'>>, total: number) {
    const payload: Row = {};
    if (fields.avatarConfig !== undefined) payload.avatar_config = fields.avatarConfig;
    if (fields.avataresSalvos !== undefined) payload.avatares_salvos = fields.avataresSalvos;
    if (fields.preferencias !== undefined) payload.preferencias_trilha = fields.preferencias;
    if (fields.valorCasa !== undefined) {
      const value = requireMoney(fields.valorCasa);
      for (let attempt = 0; attempt < 5; attempt++) {
        const progress = await this.getUserProgress(userId);
        const milestone = Math.floor(Math.max(0, cents(total)) / cents(value) / 10);
        const saved = await this.updateProgressRevision(progress, {
          ...payload, valor_casa: value, marco_maximo_trilha: Math.max(progress.marcoMaximo, milestone),
        });
        if (saved) return;
      }
      throw new Error('O progresso mudou em outra sessão. Tente novamente.');
    }
    const { error } = await database().from('progresso_usuario').update(payload).eq('user_id', userId).select('user_id').single();
    check(error);
  }

  static async getRanks(userId: string) {
    return (await rows('patentes', userId)).map(mapRank).sort((left, right) => left.ordem - right.ordem);
  }

  static async getRankHistory(userId: string): Promise<RankHistory[]> {
    return (await rows('historico_patentes', userId)).map(row => ({
      id: String(row.id), rankId: String(row.patente_id), alcancadaEm: String(row.alcancada_em ?? ''),
      anteriorId: optional(row.anterior_trilha_id), comemorada: row.comemorada_trilha !== false,
    })).sort((left, right) => left.alcancadaEm.localeCompare(right.alcancadaEm));
  }

  static async saveRank(userId: string, rank: RankInput, ranks: Rank[], id?: string) {
    const fields = { nome: rank.nome.trim(), cor: rank.cor, icone_url: rank.iconeUrl || null, conquistas_necessarias: rank.conquistasNecessarias };
    if (!fields.nome || !Number.isSafeInteger(rank.conquistasNecessarias) || rank.conquistasNecessarias < 0 || rank.conquistasNecessarias > 2_147_483_647) {
      throw new Error('Informe um nome e uma quantidade inteira válida.');
    }
    const table = database().from('patentes');
    const { error } = id
      ? await table.update(fields).eq('user_id', userId).eq('id', id).select('id').single()
      : await table.insert({ ...fields, id: generateUUID(), user_id: userId, ordem: Math.max(-1, ...ranks.map(item => item.ordem)) + 1, padrao: false });
    check(error);
  }

  static async archiveRank(userId: string, rankId: string) {
    const { error } = await database().from('patentes').update({ arquivada: true }).eq('user_id', userId).eq('id', rankId).select('id').single();
    check(error);
  }

  static async unlockProducts(userId: string, goals: Goal[], achievements: Achievement[], total: number, progress: UserProgress) {
    const trail = calculateTrail(goals, achievements, total, progress.valorCasa);
    const reached = trail.products.filter(item => !item.achievement && item.house <= trail.house);
    if (!reached.length) return achievements;
    const unlockedAt = new Date().toISOString();
    const client = database();
    for (const { goal, house } of reached) {
      const fields = {
        user_id: userId, meta_id: goal.id, chave_trilha: goal.id,
        titulo: goal.nome, icone_nome: productIcon(goal.nome, goal.categoria),
        raridade: rarityFor(goal.preco, progress.preferencias.limites),
        desbloqueada_em: unlockedAt, comemorada: false,
        produto_trilha: { nome: goal.nome, preco: goal.preco, categoria: goal.categoria, imagemUrl: goal.imagemUrl, casa: house },
      };
      const locked = achievements.find(item => item.goalId === goal.id && !item.desbloqueadaEm && !item.excluida);
      if (locked) {
        const update = await client.from('conquistas').update(fields).eq('user_id', userId)
          .eq('id', locked.id).is('desbloqueada_em', null);
        check(update.error);
      } else {
        const insert = await client.from('conquistas').upsert({ ...fields, id: generateUUID() }, { onConflict: 'chave_trilha', ignoreDuplicates: true });
        check(insert.error);
      }
    }
    return this.getAchievements(userId);
  }

  private static async updateProgressRevision(progress: UserProgress, fields: Row) {
    const update = database().from('progresso_usuario')
      .update({ ...fields, revisao_trilha: generateUUID() }).eq('user_id', progress.userId);
    const matching = progress.revisao ? update.eq('revisao_trilha', progress.revisao) : update.is('revisao_trilha', null);
    const { data, error } = await matching.select().maybeSingle();
    check(error);
    return data ? mapProgress(data as Row) : null;
  }

  private static async flushPromotion(progress: UserProgress) {
    const pending = progress.promocao;
    if (!pending || !progress.revisao) return;
    const { error } = await database().from('historico_patentes').upsert({
      id: pending.id, user_id: progress.userId, patente_id: pending.rankId,
      alcancada_em: pending.data, anterior_trilha_id: pending.anteriorId ?? null, comemorada_trilha: false,
    }, { onConflict: 'id', ignoreDuplicates: true });
    check(error);
    const clear = await database().from('progresso_usuario').update({ promocao_trilha: null })
      .eq('user_id', progress.userId).eq('revisao_trilha', progress.revisao);
    check(clear.error);
  }

  static async syncProgress(progress: UserProgress, ranks: Rank[], achievements: Achievement[], total: number, confirmedDowngrade = false) {
    const userId = progress.userId;
    const count = countAchievements(achievements);
    for (let attempt = 0; attempt < 5; attempt++) {
      await this.flushPromotion(progress);
      const status = rankStatus(ranks, progress.rankAtualId, count);
      const rank = confirmedDowngrade ? status.eligible : status.current;
      const milestone = Math.floor(Math.max(0, cents(total)) / cents(progress.valorCasa) / 10);
      const crossed = Math.max(0, milestone - progress.marcoMaximo);
      const changed = rank?.id !== progress.rankAtualId;
      const promoted = changed && rank && rank.ordem > (status.retained?.ordem ?? -1) && (status.retained || rank.conquistasNecessarias > 0);
      if (!changed && !crossed) return progress;
      const xp = Math.min(2_147_483_647, progress.xp + crossed * 15 + (promoted ? 150 : 0));
      const write = await this.updateProgressRevision(progress, {
        patente_atual_id: rank?.id ?? null, xp, nivel: Math.floor(xp / 500) + 1,
        marco_maximo_trilha: Math.max(milestone, progress.marcoMaximo),
        promocao_trilha: promoted && rank ? { id: generateUUID(), rankId: rank.id, anteriorId: status.retained?.id, data: new Date().toISOString() } : null,
      });
      if (write) {
        await this.flushPromotion(write);
        return write;
      }
      progress = await this.getUserProgress(userId);
    }
    throw new Error('O progresso mudou em outra sessão. Atualize a trilha.');
  }
}
