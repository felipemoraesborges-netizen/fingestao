import { getSupabaseClient } from '../lib/supabase';
import type { Goal, Contribution, Achievement, UserProgress, Rank } from '../types';

/**
 * Gera um UUID v4 válido compatível com colunas do tipo UUID no Supabase/PostgreSQL.
 * Usa crypto.randomUUID() nativo do navegador / ambiente moderno.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function mapGoal(row: Record<string, unknown>): Goal {
  return {
    id: String(row.id || ''),
    nome: String(row.nome || ''),
    preco: Number(row.preco ?? 0),
    categoria: String(row.categoria || 'outro'),
    imagemUrl: (row.imagem_url as string | null) ?? undefined,
    linkLoja: (row.link_loja as string | null) ?? undefined,
    prioridade: (row.prioridade as number | null) ?? undefined,
    ordemManual: (row.ordem_manual as number | null) ?? undefined,
    status: (row.status as Goal['status']) ?? 'bloqueada',
    valorAcumulado: Number(row.valor_acumulado ?? 0),
    conquistadoEm: (row.conquistado_em as string | null) ?? undefined,
    observacao: (row.observacao as string | null) ?? undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: (row.updated_at as string | null) ?? undefined,
  };
}

function mapContribution(row: Record<string, unknown>): Contribution {
  return {
    id: String(row.id || ''),
    goalId: String(row.meta_id || row.goal_id || ''),
    valor: Number(row.valor ?? 0),
    tipo: (row.tipo as Contribution['tipo']) ?? 'aporte',
    data: String(row.data || new Date().toISOString().slice(0, 10)),
    nota: (row.nota as string | null) ?? undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function mapAchievement(row: Record<string, unknown>): Achievement {
  return {
    id: String(row.id || ''),
    goalId: (row.meta_id as string | null) ?? (row.goal_id as string | null) ?? undefined,
    titulo: String(row.titulo || ''),
    descricao: (row.descricao as string | null) ?? undefined,
    iconeUrl: (row.icone_url as string | null) ?? undefined,
    raridade: (row.raridade as Achievement['raridade']) ?? 'comum',
    desbloqueadaEm: (row.desbloqueada_em as string | null) ?? undefined,
    personalizada: Boolean(row.personalizada),
    oculta: Boolean(row.oculta),
    frasePessoal: (row.frase_pessoal as string | null) ?? undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: (row.updated_at as string | null) ?? undefined,
  };
}

function mapUserProgress(row: Record<string, unknown>): UserProgress {
  return {
    userId: String(row.user_id || ''),
    xp: Number(row.xp ?? 0),
    nivel: Number(row.nivel ?? 1),
    sequenciaMeses: Number(row.sequencia_meses ?? 0),
    rankAtualId: (row.patente_atual_id as string | null) ?? (row.rank_atual_id as string | null) ?? undefined,
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

function mapRank(row: Record<string, unknown>): Rank {
  return {
    id: String(row.id || ''),
    nome: String(row.nome || ''),
    cor: String(row.cor || '#6b7280'),
    iconeUrl: (row.icone_url as string | null) ?? undefined,
    conquistasNecessarias: Number(row.conquistas_necessarias ?? 0),
    ordem: Number(row.ordem ?? 0),
    padrao: Boolean(row.padrao),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

export class GamificationService {
  // ==========================================
  // METAS DE COMPRA (metas_compra / goals)
  // ==========================================
  static async getGoals(userId: string): Promise<Goal[]> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return [];

    try {
      // Tenta primeiro 'metas_compra'
      const { data, error } = await supabase
        .from('metas_compra')
        .select('*')
        .eq('user_id', userId)
        .order('preco', { ascending: true });

      if (!error && data) {
        return data.map(mapGoal);
      }

      // Fallback para 'goals' se 'metas_compra' não existir
      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        const fallback = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId)
          .order('preco', { ascending: true });
        if (!fallback.error && fallback.data) {
          return fallback.data.map(mapGoal);
        }
      }

      if (error) throw error;
      return [];
    } catch (err) {
      console.error('Erro ao buscar metas_compra:', err);
      return [];
    }
  }

  static async addGoal(goal: Omit<Goal, 'id' | 'createdAt'>, userId: string): Promise<Goal> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) throw new Error('Supabase não conectado.');

    const newId = generateUUID();
    const payload = {
      id: newId,
      user_id: userId,
      nome: goal.nome,
      preco: goal.preco,
      categoria: goal.categoria,
      imagem_url: goal.imagemUrl ?? null,
      link_loja: goal.linkLoja ?? null,
      prioridade: goal.prioridade ?? null,
      ordem_manual: goal.ordemManual ?? null,
      status: goal.status ?? 'bloqueada',
      valor_acumulado: goal.valorAcumulado ?? 0,
      observacao: goal.observacao ?? null,
    };

    let { data, error } = await supabase
      .from('metas_compra')
      .insert(payload)
      .select()
      .single();

    if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
      const fb = await supabase.from('goals').insert(payload).select().single();
      data = fb.data;
      error = fb.error;
    }

    if (error) {
      throw new Error(`Falha ao salvar meta: ${error.message}`);
    }

    return mapGoal(data as Record<string, unknown>);
  }

  static async updateGoal(goal: Goal, userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return;

    const payload = {
      nome: goal.nome,
      preco: goal.preco,
      categoria: goal.categoria,
      imagem_url: goal.imagemUrl ?? null,
      link_loja: goal.linkLoja ?? null,
      prioridade: goal.prioridade ?? null,
      ordem_manual: goal.ordemManual ?? null,
      status: goal.status,
      valor_acumulado: goal.valorAcumulado,
      conquistado_em: goal.conquistadoEm ?? null,
      observacao: goal.observacao ?? null,
    };

    let { error } = await supabase
      .from('metas_compra')
      .update(payload)
      .eq('id', goal.id)
      .eq('user_id', userId);

    if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
      const fb = await supabase.from('goals').update(payload).eq('id', goal.id).eq('user_id', userId);
      error = fb.error;
    }

    if (error) throw new Error(`Falha ao atualizar meta: ${error.message}`);
  }

  static async deleteGoal(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return;

    let { error } = await supabase
      .from('metas_compra')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
      const fb = await supabase.from('goals').delete().eq('id', id).eq('user_id', userId);
      error = fb.error;
    }

    if (error) throw new Error(`Falha ao excluir meta: ${error.message}`);
  }

  // ==========================================
  // CONTRIBUIÇÕES (contribuicoes / contributions)
  // ==========================================
  static async getContributions(userId: string, goalId?: string): Promise<Contribution[]> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return [];

    try {
      let q = supabase
        .from('contribuicoes')
        .select('*')
        .eq('user_id', userId)
        .order('data', { ascending: false });

      if (goalId) q = q.eq('meta_id', goalId);
      const { data, error } = await q;

      if (!error && data) return data.map(mapContribution);

      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        let q2 = supabase
          .from('contributions')
          .select('*')
          .eq('user_id', userId)
          .order('data', { ascending: false });
        if (goalId) q2 = q2.eq('goal_id', goalId);
        const fb = await q2;
        if (!fb.error && fb.data) return fb.data.map(mapContribution);
      }

      return [];
    } catch {
      return [];
    }
  }

  static async addContribution(
    contrib: Omit<Contribution, 'id' | 'createdAt'>,
    userId: string
  ): Promise<Contribution> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) throw new Error('Supabase não conectado.');

    const newId = generateUUID();
    const payloadPt = {
      id: newId,
      user_id: userId,
      meta_id: contrib.goalId,
      valor: contrib.valor,
      tipo: contrib.tipo,
      data: contrib.data,
      nota: contrib.nota ?? null,
    };

    let { data, error } = await supabase
      .from('contribuicoes')
      .insert(payloadPt)
      .select()
      .single();

    if (error && (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('meta_id'))) {
      const payloadEn = {
        id: newId,
        user_id: userId,
        goal_id: contrib.goalId,
        valor: contrib.valor,
        tipo: contrib.tipo,
        data: contrib.data,
        nota: contrib.nota ?? null,
      };
      const fb = await supabase.from('contributions').insert(payloadEn).select().single();
      data = fb.data;
      error = fb.error;
    }

    if (error) throw new Error(`Falha ao registrar aporte: ${error.message}`);
    return mapContribution(data as Record<string, unknown>);
  }

  static async deleteContribution(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return;

    let { error } = await supabase
      .from('contribuicoes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
      const fb = await supabase.from('contributions').delete().eq('id', id).eq('user_id', userId);
      error = fb.error;
    }

    if (error) throw new Error(`Falha ao excluir aporte: ${error.message}`);
  }

  // ==========================================
  // CONQUISTAS (conquistas / achievements)
  // ==========================================
  static async getAchievements(userId: string): Promise<Achievement[]> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return [];

    try {
      const { data, error } = await supabase
        .from('conquistas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) return data.map(mapAchievement);

      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        const fb = await supabase
          .from('achievements')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (!fb.error && fb.data) return fb.data.map(mapAchievement);
      }

      return [];
    } catch {
      return [];
    }
  }

  static async addAchievement(
    ach: Omit<Achievement, 'id' | 'createdAt'>,
    userId: string
  ): Promise<Achievement> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) throw new Error('Supabase não conectado.');

    const newId = generateUUID();
    const payloadPt = {
      id: newId,
      user_id: userId,
      meta_id: ach.goalId ?? null,
      titulo: ach.titulo,
      descricao: ach.descricao ?? null,
      icone_url: ach.iconeUrl ?? null,
      raridade: ach.raridade,
      desbloqueada_em: ach.desbloqueadaEm ?? null,
      personalizada: ach.personalizada ?? false,
      oculta: ach.oculta ?? false,
      frase_pessoal: ach.frasePessoal ?? null,
    };

    let { data, error } = await supabase
      .from('conquistas')
      .insert(payloadPt)
      .select()
      .single();

    if (error && (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('meta_id'))) {
      const payloadEn = {
        id: newId,
        user_id: userId,
        goal_id: ach.goalId ?? null,
        titulo: ach.titulo,
        descricao: ach.descricao ?? null,
        icone_url: ach.iconeUrl ?? null,
        raridade: ach.raridade,
        desbloqueada_em: ach.desbloqueadaEm ?? null,
        personalizada: ach.personalizada ?? false,
        oculta: ach.oculta ?? false,
        frase_pessoal: ach.frasePessoal ?? null,
      };
      const fb = await supabase.from('achievements').insert(payloadEn).select().single();
      data = fb.data;
      error = fb.error;
    }

    if (error) throw new Error(`Falha ao registrar conquista: ${error.message}`);
    return mapAchievement(data as Record<string, unknown>);
  }

  static async updateAchievement(ach: Achievement, userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return;

    const payloadPt = {
      titulo: ach.titulo,
      descricao: ach.descricao ?? null,
      icone_url: ach.iconeUrl ?? null,
      raridade: ach.raridade,
      desbloqueada_em: ach.desbloqueadaEm ?? null,
      personalizada: ach.personalizada,
      oculta: ach.oculta,
      frase_pessoal: ach.frasePessoal ?? null,
    };

    let { error } = await supabase
      .from('conquistas')
      .update(payloadPt)
      .eq('id', ach.id)
      .eq('user_id', userId);

    if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
      const fb = await supabase.from('achievements').update(payloadPt).eq('id', ach.id).eq('user_id', userId);
      error = fb.error;
    }

    if (error) throw new Error(`Falha ao atualizar conquista: ${error.message}`);
  }

  static async deleteAchievement(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return;

    let { error } = await supabase
      .from('conquistas')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
      const fb = await supabase.from('achievements').delete().eq('id', id).eq('user_id', userId);
      error = fb.error;
    }

    if (error) throw new Error(`Falha ao excluir conquista: ${error.message}`);
  }

  // ==========================================
  // PROGRESSO DO USUÁRIO (progresso_usuario / user_progress)
  // ==========================================
  static async getUserProgress(userId: string): Promise<UserProgress | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('progresso_usuario')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) return mapUserProgress(data as Record<string, unknown>);

      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        const fb = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (!fb.error && fb.data) return mapUserProgress(fb.data as Record<string, unknown>);
      }

      return null;
    } catch {
      return null;
    }
  }

  static async upsertUserProgress(progress: Partial<UserProgress> & { userId: string }): Promise<UserProgress> {
    const supabase = getSupabaseClient();
    if (!supabase || !progress.userId) throw new Error('Supabase não conectado.');

    const payloadPt = {
      user_id: progress.userId,
      xp: progress.xp ?? 0,
      nivel: progress.nivel ?? 1,
      sequencia_meses: progress.sequenciaMeses ?? 0,
      patente_atual_id: progress.rankAtualId ?? null,
    };

    let { data, error } = await supabase
      .from('progresso_usuario')
      .upsert(payloadPt)
      .select()
      .single();

    if (error && (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('patente_atual_id'))) {
      const payloadEn = {
        user_id: progress.userId,
        xp: progress.xp ?? 0,
        nivel: progress.nivel ?? 1,
        sequencia_meses: progress.sequenciaMeses ?? 0,
        rank_atual_id: progress.rankAtualId ?? null,
      };
      const fb = await supabase.from('user_progress').upsert(payloadEn).select().single();
      data = fb.data;
      error = fb.error;
    }

    if (error) throw new Error(`Falha ao salvar progresso: ${error.message}`);
    return mapUserProgress(data as Record<string, unknown>);
  }

  // ==========================================
  // PATENTES (patentes / ranks)
  // ==========================================
  static async getRanks(userId: string): Promise<Rank[]> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return [];

    try {
      const { data, error } = await supabase
        .from('patentes')
        .select('*')
        .eq('user_id', userId)
        .order('ordem', { ascending: true });

      if (!error && data && data.length > 0) return data.map(mapRank);

      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        const fb = await supabase
          .from('ranks')
          .select('*')
          .eq('user_id', userId)
          .order('ordem', { ascending: true });
        if (!fb.error && fb.data && fb.data.length > 0) return fb.data.map(mapRank);
      }

      return [];
    } catch {
      return [];
    }
  }

  static async seedDefaultRanks(userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return;

    try {
      // Tenta RPC em português primeiro
      const { error: rpcErr } = await supabase.rpc('seed_default_patentes', { p_user_id: userId });
      if (!rpcErr) return;

      // Fallback para rpc em inglês
      const { error: rpcErr2 } = await supabase.rpc('seed_default_ranks', { p_user_id: userId });
      if (!rpcErr2) return;

      // Se ambas as funções RPC não existirem, faz insert direto na tabela patentes / ranks com UUID válido
      const defaultRanks = [
        { nome: 'Bronze', cor: '#cd7f32', conquistas_necessarias: 0, ordem: 0 },
        { nome: 'Prata', cor: '#c0c0c0', conquistas_necessarias: 2, ordem: 1 },
        { nome: 'Ouro', cor: '#ffd700', conquistas_necessarias: 4, ordem: 2 },
        { nome: 'Platina', cor: '#e5e4e2', conquistas_necessarias: 7, ordem: 3 },
        { nome: 'Diamante', cor: '#b9f2ff', conquistas_necessarias: 10, ordem: 4 },
        { nome: 'Mestre', cor: '#9b59b6', conquistas_necessarias: 15, ordem: 5 },
        { nome: 'Lendário', cor: '#f39c12', conquistas_necessarias: 25, ordem: 6 },
      ];

      const rowsPt = defaultRanks.map(r => ({
        id: generateUUID(),
        user_id: userId,
        nome: r.nome,
        cor: r.cor,
        conquistas_necessarias: r.conquistas_necessarias,
        ordem: r.ordem,
        padrao: true,
      }));

      const { error: insertErr } = await supabase.from('patentes').insert(rowsPt);
      if (insertErr && (insertErr.code === '42P01' || insertErr.message?.includes('does not exist'))) {
        await supabase.from('ranks').insert(rowsPt);
      }
    } catch (e) {
      console.warn('Não foi possível semear patentes padrão:', e);
    }
  }

  // ==========================================
  // HISTÓRICO DE PATENTES (historico_patentes / rank_history)
  // ==========================================
  static async addRankHistory(userId: string, rankId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return;

    try {
      const payloadPt = { id: generateUUID(), user_id: userId, patente_id: rankId };
      const { error } = await supabase.from('historico_patentes').insert(payloadPt);

      if (error && (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('patente_id'))) {
        await supabase.from('rank_history').insert({ id: generateUUID(), user_id: userId, rank_id: rankId });
      }
    } catch (e) {
      console.warn('Erro ao registrar histórico de patente:', e);
    }
  }

  // ==========================================
  // VIEW TOTAL GUARDADO (total_guardado)
  // ==========================================
  static async getTotalGuardado(userId: string): Promise<{ totalGuardado: number; totalAlvo: number; totalMetas: number; metasConcluidas: number } | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('total_guardado')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return {
          totalGuardado: Number(data.total_guardado ?? 0),
          totalAlvo: Number(data.total_alvo ?? 0),
          totalMetas: Number(data.total_metas ?? 0),
          metasConcluidas: Number(data.metas_concluidas ?? 0),
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}
