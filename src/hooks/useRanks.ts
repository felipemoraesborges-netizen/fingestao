import { useState, useCallback } from 'react';
import type { Rank, UserProgress } from '../types';
import { GamificationService } from '../services/gamificationService';

interface UseRanksReturn {
  ranks: Rank[];
  userProgress: UserProgress | null;
  pendingPromotion: Rank | null;
  isLoading: boolean;
  error: string | null;
  loadRanks: (userId: string) => Promise<void>;
  loadUserProgress: (userId: string) => Promise<void>;
  updateUserProgress: (progress: UserProgress) => void;
  setPendingPromotion: (rank: Rank | null) => void;
  dismissPromotion: () => void;
  currentRank: Rank | null;
  nextRank: Rank | null;
}

export function useRanks(): UseRanksReturn {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<Rank | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRanks = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let data = await GamificationService.getRanks(userId);
      if (data.length === 0) {
        // Seed default ranks for new user
        await GamificationService.seedDefaultRanks(userId);
        data = await GamificationService.getRanks(userId);
      }
      setRanks(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar patentes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUserProgress = useCallback(async (userId: string) => {
    try {
      const prog = await GamificationService.getUserProgress(userId);
      if (prog) {
        setUserProgress(prog);
      } else {
        // Create initial progress
        const initial = await GamificationService.upsertUserProgress({
          userId,
          xp: 0,
          nivel: 1,
          sequenciaMeses: 0,
        });
        setUserProgress(initial);
      }
    } catch (e: unknown) {
      console.error('Erro ao carregar progresso:', e);
    }
  }, []);

  const updateUserProgress = useCallback((progress: UserProgress) => {
    setUserProgress(progress);
  }, []);

  const dismissPromotion = useCallback(() => {
    setPendingPromotion(null);
  }, []);

  // Derived: current and next rank
  const currentRank = userProgress?.rankAtualId
    ? ranks.find(r => r.id === userProgress.rankAtualId) ?? null
    : ranks[0] ?? null;

  const nextRank = currentRank
    ? ranks.find(r => r.ordem > currentRank.ordem) ?? null
    : null;

  return {
    ranks,
    userProgress,
    pendingPromotion,
    isLoading,
    error,
    loadRanks,
    loadUserProgress,
    updateUserProgress,
    setPendingPromotion,
    dismissPromotion,
    currentRank,
    nextRank,
  };
}
