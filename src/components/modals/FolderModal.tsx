import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { FolderStatus } from '../../types';
import { X, Check } from 'lucide-react';
import { COLOR_OPTIONS, ICON_OPTIONS, renderIcon } from '../../utils/iconMap';

export const FolderModal: React.FC = () => {
  const {
    folderModalOpen,
    setFolderModalOpen,
    editingFolder,
    addFolder,
    updateFolder,
  } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetBudgetStr, setTargetBudgetStr] = useState('');
  const [color, setColor] = useState('#06b6d4');
  const [icon, setIcon] = useState('Palmtree');
  const [status, setStatus] = useState<FolderStatus>('active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!folderModalOpen) return;

    if (editingFolder) {
      setName(editingFolder.name);
      setDescription(editingFolder.description || '');
      setTargetBudgetStr(editingFolder.targetBudget.toString());
      setColor(editingFolder.color);
      setIcon(editingFolder.icon);
      setStatus(editingFolder.status);
      setStartDate(editingFolder.startDate || '');
      setEndDate(editingFolder.endDate || '');
    } else {
      setName('');
      setDescription('');
      setTargetBudgetStr('');
      setColor('#06b6d4');
      setIcon('Palmtree');
      setStatus('active');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
    }
  }, [folderModalOpen, editingFolder]);

  if (!folderModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe o nome da pasta / projeto.');
      return;
    }

    const budget = parseFloat(targetBudgetStr.replace(',', '.')) || 0;

    setIsSubmitting(true);
    try {
      if (editingFolder) {
        await updateFolder({
          ...editingFolder,
          name: name.trim(),
          description: description.trim() || undefined,
          targetBudget: budget,
          color,
          icon,
          status,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
      } else {
        await addFolder({
          name: name.trim(),
          description: description.trim() || undefined,
          targetBudget: budget,
          color,
          icon,
          status,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
      }

      setFolderModalOpen(false);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickFolderNames = ['Viagem para a Praia', 'Reforma da Cozinha', 'Natal 2026', 'Casamento', 'Carro Novo', 'Festa de Aniversário'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
        
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
              {editingFolder ? 'Editar Pasta / Projeto' : 'Criar Nova Pasta'}
            </h3>
          </div>
          <button
            onClick={() => setFolderModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Folder Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Nome da Pasta / Evento *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Viagem para a Praia, Reforma do Quarto..."
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white transition-all font-medium"
              autoFocus
            />
            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
              {quickFolderNames.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setName(n)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Limit / Target */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Meta / Teto do Orçamento (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={targetBudgetStr}
                onChange={(e) => setTargetBudgetStr(e.target.value)}
                placeholder="Ex: 3000,00"
                className="w-full pl-12 pr-4 py-2.5 text-lg font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              O sistema alertará automaticamente quando os gastos atingirem 80% e 100% deste limite.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Descrição ou Objetivo (Opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Férias com a família no litoral norte em Novembro"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* Color Selection Palette */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Cor de Identificação
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c.value ? 'scale-125 ring-2 ring-offset-2 ring-emerald-500 shadow-md' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Icon Selection Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Ícone da Pasta
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 max-h-36 overflow-y-auto">
              {ICON_OPTIONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = icon.toLowerCase() === item.name.toLowerCase();
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    title={item.label}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status (Ativa vs Arquivada) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setStatus('active')}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                status === 'active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Ativa (Em andamento)
            </button>
            <button
              type="button"
              onClick={() => setStatus('archived')}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                status === 'archived'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Arquivada (Finalizada)
            </button>
          </div>

          {/* Date range (optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Data Inicial (Opcional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Data Limite / Fim (Opcional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setFolderModalOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : editingFolder ? 'Salvar Pasta' : 'Criar Pasta'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
