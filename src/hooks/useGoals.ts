import type { Contribution, Goal } from '../types';
import { GamificationService } from '../services/gamificationService';
import { PurchaseGoalsService } from '../services/purchaseGoalsService';

export function useGoals(userId: string, refresh: () => Promise<void>) {
  return {
    save: async (goal: Omit<Goal, 'id' | 'createdAt'>, id?: string) => {
      await PurchaseGoalsService.saveGoal(userId, goal, id);
      await refresh();
    },
    remove: async (id: string) => {
      await PurchaseGoalsService.deleteGoal(id, userId);
      await refresh();
    },
    contribute: async (contribution: Omit<Contribution, 'id' | 'createdAt'>) => {
      await GamificationService.addContribution(contribution, userId);
      await refresh();
    },
  };
}
