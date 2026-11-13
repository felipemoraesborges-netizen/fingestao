import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportSavingsGoalsToCSV } from '../../utils/exportUtils';
import type { SavingsGoal } from '../../types';
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  PiggyBank,
  CalendarDays,
  Loader2,
  CheckCircle2,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SavingsGoalsView: React.FC = () => {
  const {
    savingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    isLoadingData,
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [savedAmountStr, setSavedAmountStr] = useState('');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');

  // Add value modal
  const [addValueOpen, setAddValueOpen] = useState(false);
  const [addValueTarget, setAddValueTarget] = useState<SavingsGoal | null>(null);
  const [addValueStr, setAddValueStr] = useState('');

  const openNewModal = () => {
    setEditing(null);
    setName('');
    setTargetAmountStr('');
    setSavedAmountStr('0');
    setDeadline('');
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditing(goal);
    setName(goal.name);
    setTargetAmountStr(goal.targetAmount.toString());
    setSavedAmountStr(goal.savedAmount.toString());
    setDeadline(goal.deadline || '');
    setNotes(goal.notes || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Informe o nome da meta.');
      return;
    }
    const targetAmount = parseFloat(targetAmountStr.replace(',', '.')) || 0;
    const savedAmount = parseFloat(savedAmountStr.replace(',', '.')) || 0;

    if (targetAmount <= 0) {
      alert('Informe um valor alvo maior que zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editing) {
        await updateSavingsGoal({
          ...editing,
          name: name.trim(),
          targetAmount,
          savedAmount,
          deadline: deadline || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await addSavingsGoal({
          name: name.trim(),
          targetAmount,
          savedAmount,
          deadline: deadline || undefined,
          notes: notes.trim() || undefined,
        });
      }
      setModalOpen(false);
    } catch {
      // handled
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;
    try {
      await deleteSavingsGoal(id);
    } catch {
      // handled
    }
  };

  const openAddValue = (goal: SavingsGoal) => {
    setAddValueTarget(goal);
    setAddValueStr('');
    setAddValueOpen(true);
  };

  const handleAddValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addValueTarget) return;
    const val = parseFloat(addValueStr.replace(',', '.')) || 0;
    if (val <= 0) {
      alert('Informe um valor maior que zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newSaved = addValueTarget.savedAmount + val;
      await updateSavingsGoal({
        ...addValueTarget,
        savedAmount: newSaved,
      });
      setAddValueOpen(false);

      // Confetti if goal reached
      if (newSaved >= addValueTarget.targetAmount && addValueTarget.savedAmount < addValueTarget.targetAmount) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } catch {
      // handled
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'bg-gradient-to-r from-blue-500 to-amber-400';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getMonthlyNeeded = (goal: SavingsGoal): string | null => {
    if (!goal.deadline) return null;
    const remaining = goal.targetAmount - goal.savedAmount;
    if (remaining <= 0) return null;

    const today = new Date();
    const deadlineDate = new Date(goal.deadline + 'T00:00:00');
    const diffMonths = (deadlineDate.getFullYear() - today.getFullYear()) * 12 + (deadlineDate.getMonth() - today.getMonth());

    if (diffMonths <= 0) return 'Prazo vencido!';
    const monthly = remaining / diffMonths;
    return `Guardar ${formatCurrency(monthly)}/mês`;
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Metas de Poupança</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Defina objetivos financeiros e acompanhe seu progresso</p>
        </div>
        <div className="flex items-center gap-2">
          {savingsGoals.length > 0 && (
            <button
              onClick={() => exportSavingsGoalsToCSV(savingsGoals)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
              title="Exportar Metas em CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          )}
          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Meta</span>
          </button>
        </div>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Metas Ativas</span>
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{savingsGoals.length}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Guardado</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(savingsGoals.reduce((s, g) => s + g.savedAmount, 0))}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Falta Guardar</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(
              savingsGoals.reduce((s, g) => s + Math.max(0, g.targetAmount - g.savedAmount), 0)
            )}
          </p>
        </div>
      </div>

      {/* Goals List */}
      {savingsGoals.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <PiggyBank className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Nenhuma meta de poupança cadastrada.
          </p>
          <button onClick={openNewModal} className="mt-2 text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
            + Criar sua primeira meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {savingsGoals.map(goal => {
            const pct = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;
            const completed = pct >= 100;
            const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
            const monthlyHint = getMonthlyNeeded(goal);

            return (
              <div
                key={goal.id}
                className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-xs transition-all ${
                  completed
                    ? 'border-amber-300 dark:border-amber-600/40 bg-gradient-to-br from-white to-amber-50/50 dark:from-slate-900 dark:to-amber-950/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                      completed ? 'bg-gradient-to-br from-blue-500 to-amber-400' : 'bg-emerald-500'
                    }`}>
                      {completed ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{goal.name}</h4>
                      {goal.deadline && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <CalendarDays className="w-3 h-3" />
                          Prazo: {formatDate(goal.deadline)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditModal(goal)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Guardado: <strong className="text-slate-900 dark:text-white">{formatCurrency(goal.savedAmount)}</strong>
                    </span>
                    <span className="text-slate-400">Meta: {formatCurrency(goal.targetAmount)}</span>
                  </div>

                  <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressColor(pct)}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-bold ${completed ? 'text-amber-600 dark:text-amber-400' : pct >= 80 ? 'text-amber-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {completed ? '🎉 Meta alcançada!' : `${pct.toFixed(0)}% concluído`}
                    </span>
                    {!completed && (
                      <span className="text-slate-500 dark:text-slate-400">
                        Faltam {formatCurrency(remaining)}
                      </span>
                    )}
                  </div>

                  {monthlyHint && !completed && (
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                      💡 {monthlyHint}
                    </p>
                  )}
                </div>

                {/* Add Value Button */}
                {!completed && (
                  <button
                    onClick={() => openAddValue(goal)}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800/40"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar valor à meta
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ============= GOAL MODAL ============= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editing ? 'Editar Meta' : 'Nova Meta de Poupança'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Nome da Meta *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Reserva de Emergência, Viagem..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Valor Alvo (R\$) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={targetAmountStr}
                    onChange={e => setTargetAmountStr(e.target.value)}
                    placeholder="10000"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Já Guardado (R\$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={savedAmountStr}
                    onChange={e => setSavedAmountStr(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Prazo (opcional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Observações</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
                  placeholder="Anotações opcionais..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Salvando...' : editing ? 'Salvar' : 'Criar Meta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============= ADD VALUE MODAL ============= */}
      {addValueOpen && addValueTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Adicionar à Meta</h3>
              <button onClick={() => setAddValueOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddValue} className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>{addValueTarget.name}</strong> — Guardado: {formatCurrency(addValueTarget.savedAmount)} de {formatCurrency(addValueTarget.targetAmount)}
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Valor a adicionar (R\$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={addValueStr}
                  onChange={e => setAddValueStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  required
                  autoFocus
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddValueOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PiggyBank className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Salvando...' : 'Adicionar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
