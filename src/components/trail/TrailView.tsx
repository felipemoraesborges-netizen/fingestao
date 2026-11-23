import React, { useEffect, useState } from 'react';
import { Plus, Map, AlertCircle, Loader2, Bell, Sparkles } from 'lucide-react';
import type { Goal, Contribution, UserProgress, Rank, Achievement } from '../../types';
import { GoalCard } from './GoalCard';
import { GoalFormModal } from './GoalFormModal';
import { ContributionModal } from './ContributionModal';
import { RankBadge } from '../common/RankBadge';

interface TrailViewProps {
  goals: Goal[];
  contributions: Contribution[];
  isLoading: boolean;
  error: string | null;
  userId: string;
  userProgress: UserProgress | null;
  currentRank: Rank | null;
  nextRank: Rank | null;
  achievements: Achievement[];
  ranks: Rank[];
  onAddGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateGoal: (goal: Goal) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  onAddContribution: (
    goalId: string, valor: number, tipo: 'aporte' | 'retirada', data: string, nota?: string
  ) => Promise<void>;
}

function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

export const TrailView: React.FC<TrailViewProps> = ({
  goals = [], isLoading, error, userProgress, currentRank, nextRank, achievements = [],
  onAddGoal, onUpdateGoal, onDeleteGoal, onAddContribution,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);

  useEffect(() => { requestNotificationPermission(); }, []);

  const safeGoals = Array.isArray(goals) ? goals : [];
  const safeAchievements = Array.isArray(achievements) ? achievements : [];

  const totalGuardado = safeGoals.reduce((s, g) => s + (Number(g.valorAcumulado) || 0), 0);
  const totalObjetivos = safeGoals.reduce((s, g) => s + (Number(g.preco) || 0), 0);
  const concluidas = safeGoals.filter(g => g.status === 'concluida').length;
  const unlockedAch = safeAchievements.filter(a => a.desbloqueadaEm).length;

  const handleSaveGoal = async (data: Omit<Goal, 'id' | 'createdAt'>) => {
    if (editingGoal) {
      await onUpdateGoal({ ...editingGoal, ...data });
    } else {
      await onAddGoal(data);
    }
    setEditingGoal(null);
    setFormOpen(false);
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Excluir este objetivo da trilha?')) return;
    await onDeleteGoal(id);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormOpen(true);
  };

  const handleContribution = async (goalId: string, valor: number, tipo: 'aporte' | 'retirada', data: string, nota?: string) => {
    await onAddContribution(goalId, valor, tipo, data, nota);
    setContributionGoal(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Carregando sua trilha de conquistas...</p>
        <p className="text-xs text-slate-400 mt-1">Conectando ao Supabase</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Map className="w-7 h-7 text-violet-500" />
            Trilha de Conquistas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Do mais barato ao mais caro — complete as fases e desbloqueie suas conquistas
          </p>
        </div>
        <div className="flex items-center gap-3">
          {currentRank && <RankBadge rank={currentRank} xp={userProgress?.xp} nivel={userProgress?.nivel} />}
          <button
            onClick={() => { setEditingGoal(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all shadow-md shadow-violet-600/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Novo Objetivo
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Metas Cadastradas', value: safeGoals.length, color: 'text-violet-600 dark:text-violet-400', emoji: '🎯' },
          { label: 'Metas Concluídas', value: concluidas, color: 'text-emerald-600 dark:text-emerald-400', emoji: '✅' },
          { label: 'Total Guardado', value: `R$ ${totalGuardado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-blue-600 dark:text-blue-400', emoji: '💰' },
          { label: 'Conquistas', value: unlockedAch, color: 'text-amber-600 dark:text-amber-400', emoji: '🏆' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 text-center shadow-xs">
            <div className="text-xl mb-0.5">{kpi.emoji}</div>
            <div className={`text-lg font-black ${kpi.color}`}>{kpi.value}</div>
            <div className="text-[11px] font-medium text-slate-400">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Next rank hint */}
      {nextRank && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 flex items-center gap-3">
          <Bell className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <span className="font-bold">Falta {Math.max(0, nextRank.conquistasNecessarias - unlockedAch)} conquista{nextRank.conquistasNecessarias - unlockedAch !== 1 ? 's' : ''}</span> para a patente <span className="font-bold">{nextRank.nome}</span>!
          </p>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-2.5 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Trail summary bar */}
      {safeGoals.length > 0 && totalObjetivos > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-semibold">Progresso geral da trilha</span>
            <span className="font-bold text-violet-600 dark:text-violet-400">
              R$ {totalGuardado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ {totalObjetivos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (totalGuardado / totalObjetivos) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* 4. Estado Vazio quando não há metas */}
      {safeGoals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">
            Sua trilha de metas está vazia
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Cadastre os itens que você quer comprar (móveis, eletrônicos, viagens). O FinGestão vai ordená-los automaticamente do mais barato ao mais caro em formato de fases!
          </p>
          <button
            onClick={() => { setEditingGoal(null); setFormOpen(true); }}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all shadow-lg shadow-violet-600/25 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Adicionar primeira meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...safeGoals]
            .sort((a, b) => a.preco - b.preco)
            .map((goal, idx) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={idx}
                onAddContribution={setContributionGoal}
                onEdit={handleEditGoal}
                onDelete={handleDeleteGoal}
              />
            ))
          }
        </div>
      )}

      {/* Modals */}
      <GoalFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingGoal(null); }}
        onSave={handleSaveGoal}
        editingGoal={editingGoal}
      />

      <ContributionModal
        isOpen={Boolean(contributionGoal)}
        goal={contributionGoal}
        onClose={() => setContributionGoal(null)}
        onSave={handleContribution}
      />
    </div>
  );
};
