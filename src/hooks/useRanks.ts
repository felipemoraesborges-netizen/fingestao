import type { Achievement, Rank, UserProgress } from '../types';
import { countAchievements, rankStatus } from '../utils/trail';

export function useRanks(ranks: Rank[], progress: UserProgress | undefined, achievements: Achievement[]) {
  const count = countAchievements(achievements);
  return { ...rankStatus(ranks, progress?.rankAtualId, count), count };
}
