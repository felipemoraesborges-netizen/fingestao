import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate, getPaymentMethodLabel, formatMonthName } from '../../utils/formatters';
import { renderIcon } from '../../utils/iconMap';
import { exportMonthlyReportToCSV, exportMonthlyReportToPDF } from '../../utils/exportUtils';
import { 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  FileText, 
  Edit3, 
  Trash2, 
  RotateCw
} from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    categories,
    folders,
    selectedMonth,
    setTransactionModalOpen,
    setDefaultFolderForNewTx,
    setEditingTransaction,
    deleteTransaction,
    setSelectedFolderId,
    setActiveTab,
  } = useApp();

  // Filters state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [folderFilter, setFolderFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [recurringFilter, setRecurringFilter] = useState<'all' | 'recurring' | 'regular'>('all');

  // Filter transactions
  const filtered = transactions.filter(tx => {
    // Month filter
    if (!tx.date.startsWith(selectedMonth)) return false;

    // Search query
    if (search && !tx.description.toLowerCase().includes(search.toLowerCase()) && !tx.notes?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    // Type filter
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

    // Category filter
    if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;

    // Folder filter
    if (folderFilter === 'none' && tx.folderId) return false;
    if (folderFilter !== 'all' && folderFilter !== 'none' && tx.folderId !== folderFilter) return false;

    // Method filter
    if (methodFilter !== 'all' && tx.paymentMethod !== methodFilter) return false;

    // Recurring filter
    if (recurringFilter === 'recurring' && !tx.isRecurring) return false;
    if (recurringFilter === 'regular' && tx.isRecurring) return false;

    return true;
  });

  // Calculate totals of filtered results
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const folderExpense = filtered.filter(t => t.type === 'expense' && t.folderId).reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleOpenNew = () => {
    setDefaultFolderForNewTx(null);
    setEditingTransaction(null);
    setTransactionModalOpen(true);
  };

  const handleEdit = (tx: typeof transactions[0]) => {
    setEditingTransaction(tx);
    setTransactionModalOpen(true);
  };

  const handleDelete = (id: string, desc: string) => {
    if (confirm(`Deseja realmente excluir a transação "${desc}"?`)) {
      deleteTransaction(id);
    }
  };

  const handleExportCSV = () => {
    exportMonthlyReportToCSV(selectedMonth, filtered, categories, folders);
  };

  const handleExportPDF = () => {
    exportMonthlyReportToPDF(
      selectedMonth,
      formatMonthName(selectedMonth),
      filtered,
      categories,
      folders,
      totalIncome,
      totalExpense,
      folderExpense
    );
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Transações & Extrato
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gerencie todas as despesas diárias, receitas e gastos vinculados a projetos.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 shadow-xs"
            title="Exportar para Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 shadow-xs"
            title="Exportar Extrato em PDF"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>

          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Filtered Summary Card */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Entradas</span>
          <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            +{formatCurrency(totalIncome)}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Saídas</span>
          <p className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
            -{formatCurrency(totalExpense)}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Em Pastas</span>
          <p className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">
            {formatCurrency(folderExpense)}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Saldo Filtrado</span>
          <p className={`text-base sm:text-lg font-black mt-0.5 ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por descrição ou observação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* Quick Type Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-rose-500'
              }`}
            >
              Despesas
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'income'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500'
              }`}
            >
              Receitas
            </button>
          </div>

        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Categoria
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Folder Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Pasta / Projeto
            </label>
            <select
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">Todas as Pastas & Rotina</option>
              <option value="none">Apenas Rotina (Sem Pasta)</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>📁 {f.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Pagamento
            </label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">Todas Formas</option>
              <option value="pix">PIX</option>
              <option value="credit_card">Cartão de Crédito</option>
              <option value="debit_card">Cartão de Débito</option>
              <option value="cash">Dinheiro</option>
              <option value="bank_slip">Boleto</option>
              <option value="transfer">Transferência</option>
            </select>
          </div>

          {/* Recurring */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Recorrência
            </label>
            <select
              value={recurringFilter}
              onChange={(e) => setRecurringFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">Todos os Lançamentos</option>
              <option value="recurring">Apenas Fixos / Recorrentes</option>
              <option value="regular">Apenas Pontuais / Normais</option>
            </select>
          </div>

        </div>

      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Filter className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">
              Nenhuma transação encontrada com os filtros selecionados.
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Tente alterar os filtros ou adicione um novo lançamento.
            </p>
            <button
              onClick={handleOpenNew}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lançamento</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map(tx => {
              const cat = categories.find(c => c.id === tx.categoryId);
              const folder = folders.find(f => f.id === tx.folderId);
              return (
                <div 
                  key={tx.id}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: cat?.color || '#10b981' }}
                    >
                      {renderIcon(cat?.icon || 'Tag', 'w-5 h-5')}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {tx.description}
                        </span>
                        {folder && (
                          <span
                            onClick={() => {
                              setSelectedFolderId(folder.id);
                              setActiveTab('folders');
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: `${folder.color}20`, color: folder.color }}
                            title="Ver pasta deste gasto"
                          >
                            📁 {folder.name}
                          </span>
                        )}
                        {tx.isRecurring && (
                          <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-0.5">
                            <RotateCw className="w-2.5 h-2.5" />
                            Fixo
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span>{cat?.name || 'Sem categoria'}</span>
                        <span>•</span>
                        <span>{getPaymentMethodLabel(tx.paymentMethod)}</span>
                        {tx.notes && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-400 truncate max-w-xs">{tx.notes}</span>
                          </>
                        )}
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
                        onClick={() => handleEdit(tx)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar lançamento"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id, tx.description)}
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
