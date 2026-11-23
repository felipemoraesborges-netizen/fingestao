import { useState, useCallback } from 'react';
import type { Achievement } from '../types';
import { GamificationService } from '../services/gamificationService';

interface UseAchievementsReturn {
  achievements: Achievement[];
  isLoading: boolean;
  error: string | null;
  loadAchievements: (userId: string) => Promise<void>;
  addAchievement: (ach: Omit<Achievement, 'id' | 'createdAt'>, userId: string) => Promise<Achievement>;
  updateAchievement: (ach: Achievement, userId: string) => Promise<void>;
  deleteAchievement: (id: string, userId: string) => Promise<void>;
  pushAchievement: (ach: Achievement) => void; // used when unlocked externally
}

export function useAchievements(): UseAchievementsReturn {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAchievements = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await GamificationService.getAchievements(userId);
      setAchievements(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar conquistas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addAchievement = useCallback(async (ach: Omit<Achievement, 'id' | 'createdAt'>, userId: string) => {
    setError(null);
    try {
      const created = await GamificationService.addAchievement(ach, userId);
      setAchievements(prev => [created, ...prev]);
      return created;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao criar conquista.';
      setError(msg);
      throw e;
    }
  }, []);

  const updateAchievement = useCallback(async (ach: Achievement, userId: string) => {
    setError(null);
    try {
      await GamificationService.updateAchievement(ach, userId);
      setAchievements(prev => prev.map(a => a.id === ach.id ? ach : a));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar conquista.';
      setError(msg);
      throw e;
    }
  }, []);

  const deleteAchievement = useCallback(async (id: string, userId: string) => {
    setError(null);
    try {
      await GamificationService.deleteAchievement(id, userId);
      setAchievements(prev => prev.filter(a => a.id !== id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao excluir conquista.';
      setError(msg);
      throw e;
    }
  }, []);

  const pushAchievement = useCallback((ach: Achievement) => {
    setAchievements(prev => {
      if (prev.find(a => a.id === ach.id)) return prev;
      return [ach, ...prev];
    });
  }, []);

  return { achievements, isLoading, error, loadAchievements, addAchievement, updateAchievement, deleteAchievement, pushAchievement };
}
