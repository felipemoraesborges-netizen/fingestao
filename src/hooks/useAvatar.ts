import { useMemo } from 'react';
import { limitAvatar, validateAvatar } from '../data/avatarOptions';
import type { Rank, RankHistory, UserProgress } from '../types';

export function useAvatar(progress: UserProgress | undefined, ranks: Rank[], history: RankHistory[], inventory?: string[]) {
  return useMemo(() => {
    const achievedIds = new Set(history.map(item => item.rankId));
    if (progress?.rankAtualId) achievedIds.add(progress.rankAtualId);
    const highest = Math.max(-1, ...ranks.filter(rank => achievedIds.has(rank.id)).map(rank => rank.ordem));
    const locks = Object.fromEntries(Object.entries(progress?.preferencias.itensPorPatente ?? {}).flatMap(([item, rankId]) => {
      const rank = ranks.find(candidate => candidate.id === rankId && !candidate.arquivada);
      return rank && rank.ordem > highest ? [[item, rank.nome]] : [];
    }));
    for (const item of ['solar', 'coloracao-mar', 'oculos-cobre', 'capa-jardim']) {
      if (!inventory?.includes(item)) locks[item] = item === 'capa-jardim' ? 'Prova de Primeiros passos' : 'Disponível na Loja';
    }
    return {
      locks, config: limitAvatar(validateAvatar(progress?.avatarConfig), locks),
      looks: Array.isArray(progress?.avataresSalvos) ? progress.avataresSalvos.slice(0, 3).map(validateAvatar) : [],
    };
  }, [progress, ranks, history, inventory]);
}
