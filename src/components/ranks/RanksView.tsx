import React from 'react';
import { Shield, ChevronRight, Trophy } from 'lucide-react';
import type { Rank, UserProgress, Achievement } from '../../types';
import { RankBadge } from '../common/RankBadge';

interface RanksViewProps {
  ranks: Rank[];
  userProgress: UserProgress | null;
  achievements: Achievement[];
  currentRank: Rank | null;
  nextRank: Rank | null;
}

const RANK_ICONS: Record<string, string> = {
  'Bronze': '🥉', 'Prata': '🥈', 'Ouro': '🥇',
  'Platina': '💎', 'Diamante': '💠', 'Mestre': '👑', 'Lendário': '🌟',
};

export const RanksView: React.FC<RanksViewProps> = ({ ranks, userProgress, achievements, currentRank, nextRank }) => {
  const unlockedCount = achievements.filter(a => a.desbloqueadaEm).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Sistema de Patentes</h2>
          <p className="text-sm text-slate-500">Conquiste mais objetivos para subir de patente</p>
        </div>
      </div>

      {/* Current status card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-5 mb-6 border border-slate-700 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Sua Patente Atual</p>
            {currentRank ? (
              <RankBadge rank={currentRank} xp={userProgress?.xp} nivel={userProgress?.nivel} size="lg" />
            ) : (
              <span className="text-slate-400">Sem patente</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Nível</p>
            <p className="text-3xl font-black text-white">{userProgress?.nivel ?? 1}</p>
          </div>
        </div>

        {/* XP bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>{userProgress?.xp ?? 0} XP</span>
            <span>Próx. nível: {((userProgress?.nivel ?? 1)) * 500} XP</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, ((userProgress?.xp ?? 0) % 500) / 5)}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-700">
          <div className="text-center">
            <p className="text-lg font-black">{userProgress?.xp ?? 0}</p>
            <p className="text-[10px] text-slate-400">XP Total</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-amber-400">{unlockedCount}</p>
            <p className="text-[10px] text-slate-400">Conquistas</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-violet-400">
              {nextRank ? `${nextRank.conquistasNecessarias - unlockedCount}` : '✓'}
            </p>
            <p className="text-[10px] text-slate-400">
              {nextRank ? 'Para próx.' : 'Máximo!'}
            </p>
          </div>
        </div>
      </div>

      {/* Ranks ladder */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
          Escada de Patentes
        </h3>
        {ranks.map((rank, idx) => {
          const isCurrentRank = currentRank?.id === rank.id;
          const isUnlocked = unlockedCount >= rank.conquistasNecessarias;
          const isNext = nextRank?.id === rank.id;
          const icon = RANK_ICONS[rank.nome] ?? '🏅';

          return (
            <div key={rank.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
              isCurrentRank
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20 shadow-md shadow-amber-500/10'
                : isNext
                ? 'border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
                : isUnlocked
                ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/10'
                : 'border-slate-100 dark:border-slate-800 opacity-50'
            }`}>
              {/* Number */}
              <div className="text-xs text-slate-400 font-bold w-5 text-center">{idx + 1}</div>

              {/* Icon + name */}
              <div className="text-2xl">{icon}</div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white" style={{ color: isUnlocked ? rank.cor : undefined }}>
                    {rank.nome}
                  </span>
                  {isCurrentRank && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">ATUAL</span>
                  )}
                  {isNext && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">PRÓXIMA</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <Trophy className="w-3 h-3" />
                  {rank.conquistasNecessarias === 0 ? 'Patente inicial' : `${rank.conquistasNecessarias} conquista${rank.conquistasNecessarias !== 1 ? 's' : ''}`}
                </p>
              </div>

              {/* Status icon */}
              <div>
                {isUnlocked ? (
                  <span className="text-emerald-500 text-lg">✓</span>
                ) : isNext ? (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                ) : (
                  <span className="text-slate-300 dark:text-slate-600 text-lg">🔒</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
