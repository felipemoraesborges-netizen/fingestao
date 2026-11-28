import { useCallback, useEffect, useRef, useState } from 'react';
import { GamificationService } from '../services/gamificationService';
import { PurchaseGoalsService } from '../services/purchaseGoalsService';
import type { Achievement, Goal, Rank, RankHistory, TrailLedger, UserProgress } from '../types';

export interface TrailSnapshot {
  ledger: TrailLedger | null;
  ledgerError: string;
  goals: Goal[];
  achievements: Achievement[];
  progress: UserProgress;
  ranks: Rank[];
  history: RankHistory[];
}

export function useTrailGame(userId: string) {
  const [snapshot, setSnapshot] = useState<TrailSnapshot>();
  const [error, setError] = useState('');
  const pending = useRef(Promise.resolve());
  const refresh = useCallback((confirmedDowngrade = false) => {
    const next = pending.current.then(async () => {
      try {
        const [ledgerResult, goals, previous, allRanks, initial] = await Promise.all([
          PurchaseGoalsService.getTrailLedger(userId).then(ledger => ({ ledger, ledgerError: '' }), (reason: unknown) => ({
            ledger: null, ledgerError: reason instanceof Error ? reason.message : 'Não foi possível consultar o saldo da Trilha.',
          })),
          PurchaseGoalsService.getGoals(userId),
          GamificationService.getAchievements(userId), GamificationService.getRanks(userId),
          GamificationService.getUserProgress(userId),
        ]);
        const total = ledgerResult.ledger?.total ?? 0;
        const achievements = ledgerResult.ledger
          ? await GamificationService.unlockProducts(userId, goals, previous, total, initial)
          : previous;
        const progress = await GamificationService.syncProgress(initial, allRanks, achievements, total, confirmedDowngrade);
        const history = await GamificationService.getRankHistory(userId);
        setSnapshot({ ...ledgerResult, goals, achievements, ranks: allRanks, progress, history });
        setError('');
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : 'Falha ao atualizar a Trilha.';
        setError(message);
      }
    });
    pending.current = next;
    return next;
  }, [userId]);

  useEffect(() => {
    void refresh();
    const onFocus = () => { if (!document.hidden) void refresh(); };
    window.addEventListener('focus', onFocus);
    const timer = window.setInterval(onFocus, 45_000);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(timer);
    };
  }, [refresh]);

  return { snapshot, error, refresh };
}
