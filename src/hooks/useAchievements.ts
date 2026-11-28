import type { Achievement } from '../types';
import { GamificationService } from '../services/gamificationService';

export function useAchievements(userId: string, refresh: () => Promise<void>) {
  return {
    save: async (achievement: Omit<Achievement, 'id' | 'createdAt'>, id?: string) => {
      const saved = await GamificationService.saveAchievement(userId, achievement, id);
      await refresh();
      return saved;
    },
    remove: async (id: string) => {
      await GamificationService.deleteAchievement(id, userId);
      await refresh();
    },
  };
}
