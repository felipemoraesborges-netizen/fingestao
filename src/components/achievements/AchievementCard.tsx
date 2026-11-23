import React from 'react';
import { Lock, Pencil } from 'lucide-react';
import type { Achievement } from '../../types';

interface AchievementCardProps {
  achievement: Achievement;
  onEdit: (ach: Achievement) => void;
}

const RARIDADE_STYLE: Record<Achievement['raridade'], { label: string; color: string; bg: string; border: string }> = {
  comum:    { label: 'Comum',    color: '#6b7280', bg: '#6b728015', border: '#6b728040' },
  rara:     { label: 'Rara',     color: '#3b82f6', bg: '#3b82f615', border: '#3b82f640' },
  epica:    { label: 'Épica',    color: '#8b5cf6', bg: '#8b5cf615', border: '#8b5cf640' },
  lendaria: { label: 'Lendária', color: '#f59e0b', bg: '#f59e0b15', border: '#f59e0b60' },
};

const RARIDADE_ICONS: Record<Achievement['raridade'], string> = {
  comum: '⭐', rara: '💎', epica: '🔮', lendaria: '🏆',
};

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, onEdit }) => {
  const unlocked = Boolean(achievement.desbloqueadaEm);
  const style = RARIDADE_STYLE[achievement.raridade];

  return (
    <div
      className={`relative rounded-2xl border p-4 transition-all ${
        unlocked
          ? 'bg-white dark:bg-slate-900'
          : 'bg-slate-50 dark:bg-slate-900/50 opacity-60 grayscale'
      }`}
      style={unlocked ? { borderColor: style.border, backgroundColor: style.bg } : {}}
    >
      {/* Raridade badge */}
      <div
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mb-2"
        style={{ backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}` }}
      >
        {RARIDADE_ICONS[achievement.raridade]} {style.label}
      </div>

      {/* Lock overlay */}
      {!unlocked && (
        <div className="absolute top-3 right-3">
          <Lock className="w-4 h-4 text-slate-400" />
        </div>
      )}

      {/* Title */}
      <h3 className={`font-bold text-sm mb-1 ${unlocked ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
        {achievement.titulo}
      </h3>

      {/* Description */}
      {achievement.descricao && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{achievement.descricao}</p>
      )}

      {/* Personal phrase */}
      {achievement.frasePessoal && unlocked && (
        <p className="text-xs italic text-violet-600 dark:text-violet-400 mb-2">"{achievement.frasePessoal}"</p>
      )}

      {/* Date unlocked */}
      {achievement.desbloqueadaEm && (
        <p className="text-[10px] text-slate-400 mt-1">
          🎉 {new Date(achievement.desbloqueadaEm).toLocaleDateString('pt-BR')}
        </p>
      )}

      {/* Edit button */}
      {unlocked && (
        <button
          onClick={() => onEdit(achievement)}
          className="absolute bottom-3 right-3 p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          title="Editar conquista"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
