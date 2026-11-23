import React, { useState } from 'react';
import { Trophy, Plus, Filter } from 'lucide-react';
import type { Achievement } from '../../types';
import { AchievementCard } from './AchievementCard';
import { AchievementEditModal } from './AchievementEditModal';

interface AchievementsGalleryProps {
  achievements: Achievement[];
  isLoading: boolean;
  userId: string;
  onUpdate: (ach: Achievement) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (ach: Omit<Achievement, 'id' | 'createdAt'>) => Promise<Achievement>;
}

type FilterRarity = 'all' | Achievement['raridade'];

export const AchievementsGallery: React.FC<AchievementsGalleryProps> = ({
  achievements, isLoading, onUpdate, onDelete, onAdd
}) => {
  const [editingAch, setEditingAch] = useState<Achievement | null>(null);
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const [showLocked, setShowLocked] = useState(true);

  const unlocked = achievements.filter(a => a.desbloqueadaEm && !a.oculta);
  const locked = achievements.filter(a => !a.desbloqueadaEm && !a.oculta);

  const filtered = [...unlocked, ...(showLocked ? locked : [])].filter(a =>
    filterRarity === 'all' || a.raridade === filterRarity
  );

  const handleAddCustom = async () => {
    const titulo = prompt('Título da conquista personalizada:');
    if (!titulo?.trim()) return;
    await onAdd({
      titulo: titulo.trim(),
      raridade: 'comum',
      desbloqueadaEm: new Date().toISOString(),
      personalizada: true,
      oculta: false,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin mb-3" />
        <p className="text-sm text-slate-500">Carregando conquistas...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Galeria de Conquistas
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {unlocked.length} desbloqueada{unlocked.length !== 1 ? 's' : ''} de {achievements.filter(a => !a.oculta).length}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowLocked(!showLocked)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              showLocked ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              : 'border-slate-200 dark:border-slate-700 text-slate-400'
            }`}>
            {showLocked ? '🔒 Ocultar bloqueadas' : '🔒 Ver bloqueadas'}
          </button>
          <button onClick={handleAddCustom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-colors shadow-sm shadow-amber-500/20 cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            Conquista Manual
          </button>
        </div>
      </div>

      {/* Rarity filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="flex items-center gap-1 text-xs text-slate-400 mr-1">
          <Filter className="w-3.5 h-3.5" />
        </div>
        {(['all', 'comum', 'rara', 'epica', 'lendaria'] as const).map(r => (
          <button key={r} onClick={() => setFilterRarity(r)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              filterRarity === r
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}>
            {r === 'all' ? 'Todas' : r === 'epica' ? 'Épica' : r === 'lendaria' ? 'Lendária' : r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🏆</div>
          <p className="text-slate-500">Nenhuma conquista aqui ainda.</p>
          <p className="text-sm text-slate-400 mt-1">Complete objetivos na Trilha para desbloquear conquistas!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ach => (
            <AchievementCard key={ach.id} achievement={ach} onEdit={setEditingAch} />
          ))}
        </div>
      )}

      <AchievementEditModal
        isOpen={Boolean(editingAch)}
        achievement={editingAch}
        onClose={() => setEditingAch(null)}
        onSave={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
};
