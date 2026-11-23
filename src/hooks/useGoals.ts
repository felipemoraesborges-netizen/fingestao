import { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { Goal, Contribution, UserProgress, Rank, Achievement } from '../types';
import { GamificationService } from '../services/gamificationService';

const XP_APORTE = 10;
const XP_BONUS_50 = 25;
const XP_BONUS_90 = 25;
const XP_CONCLUIDO = 100;
const XP_PRIMEIRA_CONQUISTA = 200;

interface UseGoalsReturn {
  goals: Goal[];
  contributions: Contribution[];
  isLoading: boolean;
  error: string | null;
  loadGoals: (userId: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>, userId: string) => Promise<void>;
  updateGoal: (goal: Goal, userId: string) => Promise<void>;
  deleteGoal: (id: string, userId: string) => Promise<void>;
  addContribution: (
    contrib: Omit<Contribution, 'id' | 'createdAt'>,
    userId: string,
    progress: UserProgress | null,
    ranks: Rank[],
    achievements: Achievement[],
    onProgressUpdate: (p: UserProgress) => void,
    onAchievementUnlocked: (a: Achievement) => void,
    onRankPromotion: (r: Rank) => void,
  ) => Promise<void>;
  loadContributions: (userId: string) => Promise<void>;
}

export function useGoals(): UseGoalsReturn {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGoals = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await GamificationService.getGoals(userId);
      // Recompute statuses based on order and accumulated values
      const sorted = [...data].sort((a, b) => a.preco - b.preco);
      let surplus = 0;
      const updated = sorted.map((g, idx) => {
        if (g.status === 'concluida') {
          surplus = Math.max(0, g.valorAcumulado - g.preco);
          return g;
        }
        const accumulated = g.valorAcumulado + surplus;
        surplus = 0;
        const isFirst = idx === 0 || sorted[idx - 1].status === 'concluida';
        const status: Goal['status'] = accumulated >= g.preco
          ? 'concluida'
          : isFirst ? 'em_andamento' : 'bloqueada';
        return { ...g, valorAcumulado: accumulated, status };
      });
      setGoals(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar objetivos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadContributions = useCallback(async (userId: string) => {
    try {
      const data = await GamificationService.getContributions(userId);
      setContributions(data);
    } catch {
      // non-critical
    }
  }, []);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'createdAt'>, userId: string) => {
    setError(null);
    try {
      const created = await GamificationService.addGoal(goal, userId);
      setGoals(prev => [...prev, created].sort((a, b) => a.preco - b.preco));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao criar objetivo.';
      setError(msg);
      throw e;
    }
  }, []);

  const updateGoal = useCallback(async (goal: Goal, userId: string) => {
    setError(null);
    try {
      await GamificationService.updateGoal(goal, userId);
      setGoals(prev => prev.map(g => g.id === goal.id ? goal : g).sort((a, b) => a.preco - b.preco));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar objetivo.';
      setError(msg);
      throw e;
    }
  }, []);

  const deleteGoal = useCallback(async (id: string, userId: string) => {
    setError(null);
    try {
      await GamificationService.deleteGoal(id, userId);
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao excluir objetivo.';
      setError(msg);
      throw e;
    }
  }, []);

  const addContribution = useCallback(async (
    contrib: Omit<Contribution, 'id' | 'createdAt'>,
    userId: string,
    progress: UserProgress | null,
    ranks: Rank[],
    achievements: Achievement[],
    onProgressUpdate: (p: UserProgress) => void,
    onAchievementUnlocked: (a: Achievement) => void,
    onRankPromotion: (r: Rank) => void,
  ) => {
    setError(null);
    try {
      const saved = await GamificationService.addContribution(contrib, userId);
      setContributions(prev => [saved, ...prev]);

      // Update goals state with new accumulated value + cascade
      setGoals(prev => {
        const sortedGoals = [...prev].sort((a, b) => a.preco - b.preco);
        const targetIdx = sortedGoals.findIndex(g => g.id === contrib.goalId);
        if (targetIdx === -1) return prev;

        const delta = contrib.tipo === 'aporte' ? contrib.valor : -contrib.valor;
        sortedGoals[targetIdx] = {
          ...sortedGoals[targetIdx],
          valorAcumulado: Math.max(0, sortedGoals[targetIdx].valorAcumulado + delta),
        };

        // Cascade: if goal completed, surplus goes to next
        let surplus = 0;
        const result = sortedGoals.map((g, idx) => {
          const accumulated = g.valorAcumulado + surplus;
          surplus = 0;
          const wasCompleted = g.status === 'concluida';
          const nowComplete = accumulated >= g.preco;

          if (nowComplete && !wasCompleted) {
            surplus = accumulated - g.preco;
            const now = new Date().toISOString();
            // Async side-effects
            const completedGoal: Goal = { ...g, valorAcumulado: g.preco, status: 'concluida', conquistadoEm: now };
            GamificationService.updateGoal(completedGoal, userId).catch(console.error);

            // Unlock achievement
            const isFirst = achievements.filter(a => a.desbloqueadaEm).length === 0;
            const achData: Omit<Achievement, 'id' | 'createdAt'> = {
              goalId: g.id,
              titulo: `Conquistado: ${g.nome}`,
              descricao: `Você juntou R$ ${g.preco.toFixed(2)} para ${g.nome}! 🎉`,
              raridade: isFirst ? 'epica' : 'comum',
              desbloqueadaEm: now,
              personalizada: false,
              oculta: false,
            };
            GamificationService.addAchievement(achData, userId)
              .then(a => onAchievementUnlocked(a))
              .catch(console.error);

            // XP calculation
            const unlockedCount = achievements.filter(a => a.desbloqueadaEm).length;
            let xpGain = XP_CONCLUIDO;
            if (isFirst) xpGain += XP_PRIMEIRA_CONQUISTA;

            const currentXp = (progress?.xp ?? 0) + xpGain + XP_APORTE;
            const newNivel = Math.floor(currentXp / 500) + 1;
            const updatedProgress: UserProgress = {
              userId,
              xp: currentXp,
              nivel: newNivel,
              sequenciaMeses: progress?.sequenciaMeses ?? 0,
              rankAtualId: progress?.rankAtualId,
              updatedAt: now,
            };

            // Check rank promotion
            const newAchCount = unlockedCount + 1;
            const eligibleRanks = ranks
              .filter(r => r.conquistasNecessarias <= newAchCount)
              .sort((a, b) => b.conquistasNecessarias - a.conquistasNecessarias);
            const newRank = eligibleRanks[0];
            if (newRank && newRank.id !== progress?.rankAtualId) {
              updatedProgress.rankAtualId = newRank.id;
              GamificationService.addRankHistory(userId, newRank.id).catch(console.error);
              onRankPromotion(newRank);
            }

            GamificationService.upsertUserProgress(updatedProgress)
              .then(p => onProgressUpdate(p))
              .catch(console.error);

            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            return completedGoal;
          }

          // Check milestones (50%, 90%) for XP bonus
          const pct = g.preco > 0 ? (accumulated / g.preco) * 100 : 0;
          const prevPct = g.preco > 0 ? (g.valorAcumulado / g.preco) * 100 : 0;
          let bonusXp = XP_APORTE;
          if (pct >= 90 && prevPct < 90) bonusXp += XP_BONUS_90;
          else if (pct >= 50 && prevPct < 50) bonusXp += XP_BONUS_50;

          if (idx === targetIdx && bonusXp > XP_APORTE) {
            const now = new Date().toISOString();
            const currentXp = (progress?.xp ?? 0) + bonusXp;
            GamificationService.upsertUserProgress({
              userId,
              xp: currentXp,
              nivel: Math.floor(currentXp / 500) + 1,
              sequenciaMeses: progress?.sequenciaMeses ?? 0,
              rankAtualId: progress?.rankAtualId,
              updatedAt: now,
            }).then(p => onProgressUpdate(p)).catch(console.error);
          } else if (idx === targetIdx) {
            // Simple XP for aporte
            const now = new Date().toISOString();
            const currentXp = (progress?.xp ?? 0) + XP_APORTE;
            GamificationService.upsertUserProgress({
              userId,
              xp: currentXp,
              nivel: Math.floor(currentXp / 500) + 1,
              sequenciaMeses: progress?.sequenciaMeses ?? 0,
              rankAtualId: progress?.rankAtualId,
              updatedAt: now,
            }).then(p => onProgressUpdate(p)).catch(console.error);
          }

          const nextStatus: Goal['status'] = nowComplete ? 'concluida'
            : (idx === 0 || sortedGoals[idx - 1].status === 'concluida') ? 'em_andamento'
            : 'bloqueada';

          const updatedG = { ...g, valorAcumulado: accumulated, status: nextStatus };
          if (idx === targetIdx) {
            GamificationService.updateGoal(updatedG, userId).catch(console.error);
          }
          return updatedG;
        });

        return result;
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao registrar aporte.';
      setError(msg);
      throw e;
    }
  }, []);

  return { goals, contributions, isLoading, error, loadGoals, addGoal, updateGoal, deleteGoal, addContribution, loadContributions };
}
