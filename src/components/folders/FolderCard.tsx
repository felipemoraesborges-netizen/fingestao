import React from 'react';
import { useApp } from '../../context/AppContext';
import type { Folder } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { renderIcon } from '../../utils/iconMap';
import { 
  ArrowRight, 
  Plus, 
  Archive, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  AlertCircle
} from 'lucide-react';

interface FolderCardProps {
  folder: Folder;
}

export const FolderCard: React.FC<FolderCardProps> = ({ folder }) => {
  const { 
    transactions, 
    setSelectedFolderId, 
    setTransactionModalOpen, 
    setDefaultFolderForNewTx,
    setEditingTransaction,
    setFolderModalOpen,
    setEditingFolder,
    toggleFolderStatus,
    deleteFolder,
  } = useApp();

  const folderTransactions = transactions.filter(t => t.folderId === folder.id);
  const totalSpent = folderTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const percentage = folder.targetBudget > 0 ? (totalSpent / folder.targetBudget) * 100 : 0;
  const remaining = folder.targetBudget - totalSpent;
  const isOverBudget = percentage >= 100;
  const isNearBudget = percentage >= 80 && !isOverBudget;

  const handleOpenDetails = () => {
    setSelectedFolderId(folder.id);
  };

  const handleAddExpenseInFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDefaultFolderForNewTx(folder.id);
    setEditingTransaction(null);
    setTransactionModalOpen(true);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setFolderModalOpen(true);
  };

  const handleToggleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFolderStatus(folder.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja excluir a pasta "${folder.name}"? As transações não serão apagadas, mas perderão o vínculo com a pasta.`)) {
      deleteFolder(folder.id);
    }
  };

  return (
    <div 
      onClick={handleOpenDetails}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/40 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      {/* Top Banner Accent */}
      <div 
        className="absolute top-0 inset-x-0 h-1.5 rounded-t-3xl transition-opacity group-hover:opacity-100 opacity-80"
        style={{ backgroundColor: folder.color }}
      />

      <div>
        {/* Header: Icon, Name, and Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: folder.color }}
            >
              {renderIcon(folder.icon, 'w-5 h-5')}
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                {folder.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {folder.description || `${folderTransactions.length} lançamentos`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isOverBudget && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                <AlertCircle className="w-3 h-3" />
                Estourou
              </span>
            )}
            {isNearBudget && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                <AlertTriangle className="w-3 h-3" />
                80%+
              </span>
            )}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              folder.status === 'active'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {folder.status === 'active' ? 'Ativa' : 'Arquivada'}
            </span>
          </div>
        </div>

        {/* Financial Numbers: Gasto vs Meta */}
        <div className="my-4 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Gasto:</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {formatCurrency(totalSpent)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700/60 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverBudget 
                    ? 'bg-rose-500' 
                    : isNearBudget 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className={isOverBudget ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>
                {percentage.toFixed(0)}% da meta
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                Meta: {formatCurrency(folder.targetBudget)}
              </span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs border-t border-slate-200/60 dark:border-slate-700/40">
            <span className="text-slate-500 dark:text-slate-400">
              {remaining >= 0 ? 'Restante disponível:' : 'Excedido em:'}
            </span>
            <span className={`font-bold ${remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(Math.abs(remaining))}
            </span>
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={handleAddExpenseInFolder}
            className="p-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center gap-1"
            title="Lançar gasto nesta pasta"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gasto</span>
          </button>

          <button
            onClick={handleEdit}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Editar pasta"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleToggleArchive}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={folder.status === 'active' ? 'Arquivar pasta' : 'Reativar pasta'}
          >
            {folder.status === 'active' ? <Archive className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Excluir pasta"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={handleOpenDetails}
          className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <span>Ver Detalhes</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

    </div>
  );
};
