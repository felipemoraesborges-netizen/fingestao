import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, FileText } from 'lucide-react';
import type { Goal } from '../../types';

interface ContributionModalProps {
  isOpen: boolean;
  goal: Goal | null;
  onClose: () => void;
  onSave: (goalId: string, valor: number, tipo: 'aporte' | 'retirada', data: string, nota?: string) => Promise<void>;
}

export const ContributionModal: React.FC<ContributionModalProps> = ({ isOpen, goal, onClose, onSave }) => {
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<'aporte' | 'retirada'>('aporte');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [nota, setNota] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroMsg, setErroMsg] = useState('');

  if (!isOpen || !goal) return null;

  const falta = Math.max(0, goal.preco - goal.valorAcumulado);
  const pct = goal.preco > 0 ? Math.min(100, (goal.valorAcumulado / goal.preco) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) return setErroMsg('Informe um valor válido maior que zero.');

    setIsSubmitting(true);
    setErroMsg('');
    try {
      await onSave(goal.id, valorNum, tipo, data, nota.trim() || undefined);
      setValor(''); setNota(''); setTipo('aporte');
      onClose();
    } catch (err: unknown) {
      setErroMsg(err instanceof Error ? err.message : 'Erro ao registrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">{goal.nome}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Acumulado: <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  R$ {goal.valorAcumulado.toFixed(2)}
                </span> de R$ {goal.preco.toFixed(2)}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: pct >= 100 ? '#10b981' : pct >= 80 ? '#f59e0b' : '#8b5cf6'
              }}
            />
          </div>
          <p className="text-right text-xs text-slate-400 mt-1">{pct.toFixed(0)}% — Falta R$ {falta.toFixed(2)}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {erroMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
              {erroMsg}
            </div>
          )}

          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo('aporte')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                tipo === 'aporte'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Aporte
            </button>
            <button
              type="button"
              onClick={() => setTipo('retirada')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                tipo === 'retirada'
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-600 dark:text-red-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <TrendingDown className="w-4 h-4" /> Retirada
            </button>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Valor (R$) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="0,00"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
              autoFocus
            />
            {tipo === 'aporte' && falta > 0 && (
              <button
                type="button"
                onClick={() => setValor(falta.toFixed(2))}
                className="mt-1 text-xs text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
              >
                Usar valor restante (R$ {falta.toFixed(2)})
              </button>
            )}
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />Data
            </label>
            <input
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
            />
          </div>

          {/* Nota */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              <FileText className="w-3.5 h-3.5 inline mr-1" />Nota (opcional)
            </label>
            <input
              type="text"
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="ex: Economizei no mercado"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-colors shadow-md disabled:opacity-50 cursor-pointer ${
                tipo === 'aporte'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  : 'bg-red-500 hover:bg-red-400 shadow-red-500/20'
              }`}>
              {isSubmitting ? 'Salvando...' : tipo === 'aporte' ? '+ Registrar Aporte' : '- Registrar Retirada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
