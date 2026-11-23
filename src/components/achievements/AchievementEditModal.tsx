import React, { useState } from 'react';
import { X, Star, Trophy, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import type { Achievement } from '../../types';

interface AchievementEditModalProps {
  isOpen: boolean;
  achievement: Achievement | null;
  onClose: () => void;
  onSave: (ach: Achievement) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const RARIDADE_OPTS: { value: Achievement['raridade']; label: string; color: string }[] = [
  { value: 'comum', label: 'Comum', color: '#6b7280' },
  { value: 'rara', label: 'Rara', color: '#3b82f6' },
  { value: 'epica', label: 'Épica', color: '#8b5cf6' },
  { value: 'lendaria', label: 'Lendária', color: '#f59e0b' },
];

export const AchievementEditModal: React.FC<AchievementEditModalProps> = ({
  isOpen, achievement, onClose, onSave, onDelete
}) => {
  const [titulo, setTitulo] = useState(achievement?.titulo ?? '');
  const [descricao, setDescricao] = useState(achievement?.descricao ?? '');
  const [frasePessoal, setFrasePessoal] = useState(achievement?.frasePessoal ?? '');
  const [raridade, setRaridade] = useState<Achievement['raridade']>(achievement?.raridade ?? 'comum');
  const [oculta, setOculta] = useState(achievement?.oculta ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (achievement) {
      setTitulo(achievement.titulo);
      setDescricao(achievement.descricao ?? '');
      setFrasePessoal(achievement.frasePessoal ?? '');
      setRaridade(achievement.raridade);
      setOculta(achievement.oculta);
    }
  }, [achievement]);

  if (!isOpen || !achievement) return null;

  const handleSave = async () => {
    if (!titulo.trim()) return;
    setIsSubmitting(true);
    try {
      await onSave({ ...achievement, titulo: titulo.trim(), descricao: descricao.trim() || undefined, frasePessoal: frasePessoal.trim() || undefined, raridade, oculta });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Excluir esta conquista permanentemente?')) return;
    await onDelete(achievement.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-slate-900 dark:text-white">Editar Conquista</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Título</label>
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Descrição</label>
            <textarea rows={2} value={descricao} onChange={e => setDescricao(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Frase Pessoal</label>
            <input type="text" value={frasePessoal} onChange={e => setFrasePessoal(e.target.value)}
              placeholder="ex: Nunca desisti!"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              <Star className="w-3.5 h-3.5 inline mr-1" />Raridade
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RARIDADE_OPTS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setRaridade(opt.value)}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    raridade === opt.value
                      ? 'border-current'
                      : 'border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                  style={raridade === opt.value ? { color: opt.color, backgroundColor: `${opt.color}15`, borderColor: opt.color } : {}}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={() => setOculta(!oculta)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
              oculta
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
            {oculta ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {oculta ? 'Oculta da galeria' : 'Visível na galeria'}
          </button>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={handleDelete}
              className="p-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer">
              <Trash2 className="w-4 h-4" />
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="button" onClick={handleSave} disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold transition-colors shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer">
              <Pencil className="w-3.5 h-3.5 inline mr-1" />
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
