import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { TransactionType } from '../../types';
import { X, Check } from 'lucide-react';
import { COLOR_OPTIONS, ICON_OPTIONS, renderIcon } from '../../utils/iconMap';

export const CategoryModal: React.FC = () => {
  const {
    categoryModalOpen,
    setCategoryModalOpen,
    editingCategory,
    addCategory,
    updateCategory,
  } = useApp();

  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [budgetLimitStr, setBudgetLimitStr] = useState('');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('Tag');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!categoryModalOpen) return;

    if (editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type);
      setBudgetLimitStr(editingCategory.budgetLimit ? editingCategory.budgetLimit.toString() : '');
      setColor(editingCategory.color);
      setIcon(editingCategory.icon);
    } else {
      setName('');
      setType('expense');
      setBudgetLimitStr('');
      setColor('#10b981');
      setIcon('Tag');
    }
  }, [categoryModalOpen, editingCategory]);

  if (!categoryModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe o nome da categoria.');
      return;
    }

    const limit = parseFloat(budgetLimitStr.replace(',', '.')) || 0;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory({
          ...editingCategory,
          name: name.trim(),
          type,
          budgetLimit: limit,
          color,
          icon,
        });
      } else {
        await addCategory({
          name: name.trim(),
          type,
          budgetLimit: limit,
          color,
          icon,
        });
      }

      setCategoryModalOpen(false);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: color }}
            >
              {renderIcon(icon, 'w-4 h-4')}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
          </div>
          <button
            onClick={() => setCategoryModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Type Toggle: Despesa vs Receita */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 rounded-xl font-bold text-xs transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-xl font-bold text-xs transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Receita
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Nome da Categoria *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Streaming, Combustível, Pets..."
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              autoFocus
            />
          </div>

          {/* Monthly Budget Limit (only for expenses) */}
          {type === 'expense' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Teto de Gastos Mensal (R$)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={budgetLimitStr}
                  onChange={(e) => setBudgetLimitStr(e.target.value)}
                  placeholder="Ex: 600,00"
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Deixe 0 se não quiser estipular limite para esta categoria.
              </p>
            </div>
          )}

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Cor
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c.value ? 'scale-125 ring-2 ring-offset-2 ring-emerald-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Ícone
            </label>
            <div className="grid grid-cols-6 gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 max-h-32 overflow-y-auto">
              {ICON_OPTIONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = icon.toLowerCase() === item.name.toLowerCase();
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setCategoryModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : editingCategory ? 'Salvar Categoria' : 'Criar Categoria'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
