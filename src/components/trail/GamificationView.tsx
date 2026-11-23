import React, { useState, useEffect, useCallback } from 'react';
import { Map, Trophy, Shield, Cloud, Settings, LogIn } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useGoals } from '../../hooks/useGoals';
import { useAchievements } from '../../hooks/useAchievements';
import { useRanks } from '../../hooks/useRanks';
import { TrailView } from './TrailView';
import { AchievementsGallery } from '../achievements/AchievementsGallery';
import { RanksView } from '../ranks/RanksView';
import { RankPromotionModal } from '../ranks/RankPromotionModal';
import { ErrorBoundary } from '../common/ErrorBoundary';
import type { Goal, Contribution, Achievement, Rank } from '../../types';

type SubTab = 'trail' | 'achievements' | 'ranks';

export const GamificationView: React.FC = () => {
  const { currentUser, isCloudActive, setAuthModalOpen, setActiveTab } = useApp();
  const [subTab, setSubTab] = useState<SubTab>('trail');

  const goalHook = useGoals();
  const achHook = useAchievements();
  const rankHook = useRanks();

  const userId = currentUser?.id ?? '';

  // Load all gamification data when user is authenticated
  const loadAll = useCallback(async () => {
    if (!userId) return;
    try {
      await Promise.allSettled([
        goalHook.loadGoals(userId),
        goalHook.loadContributions(userId),
        achHook.loadAchievements(userId),
        rankHook.loadRanks(userId),
        rankHook.loadUserProgress(userId),
      ]);
    } catch (e) {
      console.error('Erro ao sincronizar dados da Trilha:', e);
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (userId) {
      loadAll();
    }
  }, [userId, loadAll]);

  // ─── Goal actions ───
  const handleAddGoal = async (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    if (!userId) return;
    await goalHook.addGoal(goal, userId);
  };

  const handleUpdateGoal = async (goal: Goal) => {
    if (!userId) return;
    await goalHook.updateGoal(goal, userId);
  };

  const handleDeleteGoal = async (id: string) => {
    if (!userId) return;
    await goalHook.deleteGoal(id, userId);
  };

  const handleAddContribution = async (
    goalId: string, valor: number, tipo: 'aporte' | 'retirada', data: string, nota?: string
  ) => {
    if (!userId) return;
    const contrib: Omit<Contribution, 'id' | 'createdAt'> = { goalId, valor, tipo, data, nota };
    await goalHook.addContribution(
      contrib,
      userId,
      rankHook.userProgress,
      rankHook.ranks,
      achHook.achievements,
      (p) => rankHook.updateUserProgress(p),
      (a: Achievement) => achHook.pushAchievement(a),
      (r: Rank) => rankHook.setPendingPromotion(r),
    );
  };

  // ─── Achievement actions ───
  const handleUpdateAchievement = async (ach: Achievement) => {
    if (!userId) return;
    await achHook.updateAchievement(ach, userId);
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!userId) return;
    await achHook.deleteAchievement(id, userId);
  };

  const handleAddAchievement = async (ach: Omit<Achievement, 'id' | 'createdAt'>) => {
    if (!userId) throw new Error('Usuário não autenticado');
    return await achHook.addAchievement(ach, userId);
  };

  // ─── 1. Guest gate (Modo Local / Não autenticado) ───
  if (!isCloudActive || !currentUser) {
    return (
      <div className="py-12 sm:py-16 px-4">
        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-xl shadow-slate-900/5">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Cloud className="w-8 h-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-3">
            Modo Local / Nuvem Desconectada
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
            Trilha de Conquistas
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            Conecte sua conta em <strong>Configurações & Nuvem</strong> para usar a Trilha de Conquistas. Seus objetivos, conquistas e patentes são salvos no Supabase para você nunca perder seu progresso.
          </p>

          <div className="space-y-2.5">
            <button
              onClick={() => setActiveTab('settings')}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all shadow-md shadow-violet-600/25 active:scale-98 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>Ir para Configurações & Nuvem</span>
            </button>

            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar ou Cadastrar Conta</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Sub-tabs ───
  const tabs: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'trail', label: 'Trilha de Objetivos', icon: <Map className="w-4 h-4" /> },
    { id: 'achievements', label: 'Galeria de Conquistas', icon: <Trophy className="w-4 h-4" /> },
    { id: 'ranks', label: 'Patentes & Nível', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <ErrorBoundary fallbackTitle="Erro ao carregar a Trilha de Conquistas" onReset={loadAll}>
      <div className="space-y-6">
        {/* Sub-nav */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full sm:w-fit overflow-x-auto shadow-xs border border-slate-200/60 dark:border-slate-700/60">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                subTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {subTab === 'trail' && (
          <TrailView
            goals={goalHook.goals ?? []}
            contributions={goalHook.contributions ?? []}
            isLoading={goalHook.isLoading}
            error={goalHook.error}
            userId={userId}
            userProgress={rankHook.userProgress}
            currentRank={rankHook.currentRank}
            nextRank={rankHook.nextRank}
            achievements={achHook.achievements ?? []}
            ranks={rankHook.ranks ?? []}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            onAddContribution={handleAddContribution}
          />
        )}

        {subTab === 'achievements' && (
          <AchievementsGallery
            achievements={achHook.achievements ?? []}
            isLoading={achHook.isLoading}
            userId={userId}
            onUpdate={handleUpdateAchievement}
            onDelete={handleDeleteAchievement}
            onAdd={handleAddAchievement}
          />
        )}

        {subTab === 'ranks' && (
          <RanksView
            ranks={rankHook.ranks ?? []}
            userProgress={rankHook.userProgress}
            achievements={achHook.achievements ?? []}
            currentRank={rankHook.currentRank}
            nextRank={rankHook.nextRank}
          />
        )}

        {/* Rank Promotion Modal */}
        <RankPromotionModal
          rank={rankHook.pendingPromotion}
          onDismiss={rankHook.dismissPromotion}
        />
      </div>
    </ErrorBoundary>
  );
};
