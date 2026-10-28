import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate, getPaymentMethodLabel } from '../../utils/formatters';
import { renderIcon } from '../../utils/iconMap';
import { exportFolderToCSV, exportFolderToPDF } from '../../utils/exportUtils';
import { 
  ArrowLeft, 
  Plus, 
  FileSpreadsheet, 
  FileText, 
  Edit3, 
  Archive, 
  RotateCcw, 
  Search, 
  Trash2,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Receipt,
  PieChart
} from 'lucide-react';

export const FolderDetailsView: React.FC = () => {
  const {
    selectedFolderId,
    setSelectedFolderId,
    folders,
    transactions,
    categories,
    setTransactionModalOpen,
    setDefaultFolderForNewTx,
    setEditingTransaction,
    setFolderModalOpen,
    setEditingFolder,
    toggleFolderStatus,
    deleteTransaction,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const folder = folders.find(f => f.id === selectedFolderId);

  if (!folder) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Pasta não encontrada ou removida.</p>
        <button
          onClick={() => setSelectedFolderId(null)}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold"
        >
          Voltar para Pastas
        </button>
      </div>
    );
  }

  // Transactions exclusive to this folder
  const folderTransactions = transactions.filter(t => t.folderId === folder.id);

  // Filtered transactions for display
  const filteredTransactions = folderTransactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' || t.categoryId === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalSpent = folderTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const percentage = folder.targetBudget > 0 ? (totalSpent / folder.targetBudget) * 100 : 0;
  const remaining = folder.targetBudget - totalSpent;
  const isOverBudget = percentage >= 100;
  const isNearBudget = percentage >= 80 && !isOverBudget;

  const handleAddExpense = () => {
    setDefaultFolderForNewTx(folder.id);
    setEditingTransaction(null);
    setTransactionModalOpen(true);
  };

  const handleEditTx = (tx: typeof folderTransactions[0]) => {
    setDefaultFolderForNewTx(folder.id);
    setEditingTransaction(tx);
    setTransactionModalOpen(true);
  };

  const handleDeleteTx = (id: string, desc: string) => {
    if (confirm(`Deseja excluir a transação "${desc}"?`)) {
      deleteTransaction(id);
    }
  };

  // Group expenses by category inside this folder
  const expensesByCategory = categories
    .map(cat => {
      const spent = folderTransactions
        .filter(t => t.categoryId === cat.id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        ...cat,
        spent,
        percentage: totalSpent > 0 ? (spent / totalSpent) * 100 : 0,
      };
    })
    .filter(c => c.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => setSelectedFolderId(null)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para todas as pastas</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportFolderToCSV(folder, folderTransactions, categories)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
            title="Exportar dados para Excel/CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => exportFolderToPDF(folder, folderTransactions, categories)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
            title="Gerar relatório profissional em PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            <span>Exportar PDF</span>
          </button>

          <button
            onClick={() => {
              setEditingFolder(folder);
              setFolderModalOpen(true);
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors"
            title="Editar pasta"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => toggleFolderStatus(folder.id)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors"
            title={folder.status === 'active' ? 'Finalizar / Arquivar Projeto' : 'Reativar Projeto'}
          >
            {folder.status === 'active' ? <Archive className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Folder Hero Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Glow accent */}
        <div 
          className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: folder.color }}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div 
              className="w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-xl shrink-0"
              style={{ backgroundColor: folder.color }}
            >
              {renderIcon(folder.icon, 'w-8 h-8')}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {folder.name}
                </h1>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  folder.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {folder.status === 'active' ? '● Em Andamento' : '✓ Finalizada / Arquivada'}
                </span>
                {isOverBudget && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Teto Ultrapassado!
                  </span>
                )}
                {isNearBudget && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    80% do Orçamento Usado
                  </span>
                )}
              </div>

              {folder.description && (
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                  {folder.description}
                </p>
              )}

              {(folder.startDate || folder.endDate) && (
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {folder.startDate ? formatDate(folder.startDate) : 'Início'} 
                    {' até '} 
                    {folder.endDate ? formatDate(folder.endDate) : 'Em aberto'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Add Expense in Folder Button */}
          <button
            onClick={handleAddExpense}
            className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Adicionar Gasto Nesta Pasta</span>
          </button>
        </div>

        {/* Progress Bar & Visual Gauge */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-slate-600 dark:text-slate-400">Progresso do Orçamento do Projeto</span>
            <span className={isOverBudget ? 'text-rose-600 dark:text-rose-400 font-black' : isNearBudget ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
              {percentage.toFixed(1)}% ({formatCurrency(totalSpent)} de {formatCurrency(folder.targetBudget)})
            </span>
          </div>

          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                isOverBudget 
                  ? 'bg-rose-500 shadow-md shadow-rose-500/50' 
                  : isNearBudget 
                  ? 'bg-amber-500 shadow-md shadow-amber-500/50' 
                  : 'bg-emerald-500 shadow-md shadow-emerald-500/50'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Gasto */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Gasto</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalSpent)}
          </p>
          <span className="text-[11px] text-slate-400">Em {folderTransactions.length} lançamentos</span>
        </div>

        {/* Meta / Teto */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Meta / Teto Estipulado</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(folder.targetBudget)}
          </p>
          <span className="text-[11px] text-slate-400">Orçamento total planejado</span>
        </div>

        {/* Saldo Restante / Excedente */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {remaining >= 0 ? 'Saldo Restante' : 'Orçamento Excedido'}
          </span>
          <p className={`text-xl sm:text-2xl font-black mt-1 ${
            remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatCurrency(Math.abs(remaining))}
          </p>
          <span className="text-[11px] text-slate-400">
            {remaining >= 0 ? 'Disponível para gastar' : 'Passou do limite'}
          </span>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Média por Lançamento</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(folderTransactions.length > 0 ? totalSpent / folderTransactions.length : 0)}
          </p>
          <span className="text-[11px] text-slate-400">Por item registrado</span>
        </div>

      </div>

      {/* Category Breakdown in Folder */}
      {expensesByCategory.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Divisão de Gastos por Categoria nesta Pasta
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {expensesByCategory.map(cat => (
              <div key={cat.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{cat.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {formatCurrency(cat.spent)}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                  />
                </div>
                <div className="flex justify-end text-[10px] text-slate-400 font-semibold">
                  {cat.percentage.toFixed(1)}% do projeto
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exclusive Transaction History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-500" />
              <span>Histórico Exclusivo de Gastos</span>
              <span className="text-xs font-normal text-slate-400">({folderTransactions.length})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Apenas transações vinculadas à pasta "{folder.name}"
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar lançamento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white w-40 sm:w-48"
              />
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white font-medium"
            >
              <option value="all">Todas Categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Transactions Table / List */}
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Nenhuma transação encontrada nesta pasta.
            </p>
            <button
              onClick={handleAddExpense}
              className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar Primeiro Gasto</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.map(tx => {
              const cat = categories.find(c => c.id === tx.categoryId);
              return (
                <div 
                  key={tx.id}
                  className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: cat?.color || '#10b981' }}
                    >
                      {renderIcon(cat?.icon || 'Tag', 'w-5 h-5')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {tx.description}
                        </span>
                        {tx.isRecurring && (
                          <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-semibold">
                            Fixo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span>{cat?.name || 'Sem categoria'}</span>
                        <span>•</span>
                        <span>{getPaymentMethodLabel(tx.paymentMethod)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`font-black text-sm sm:text-base ${
                      tx.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditTx(tx)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar lançamento"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTx(tx.id, tx.description)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Excluir lançamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
