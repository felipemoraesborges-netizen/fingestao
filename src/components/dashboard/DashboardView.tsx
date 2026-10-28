import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { renderIcon } from '../../utils/iconMap';
import { AlertBanner } from '../common/AlertBanner';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  FolderKanban, 
  Plus, 
  FolderPlus, 
  ArrowRight, 
  ReceiptText, 
  Sparkles, 
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

export const DashboardView: React.FC = () => {
  const {
    transactions,
    folders,
    categories,
    selectedMonth,
    setActiveTab,
    setSelectedFolderId,
    setTransactionModalOpen,
    setDefaultFolderForNewTx,
    setEditingTransaction,
    setFolderModalOpen,
    setEditingFolder,
  } = useApp();

  // Transactions in the selected month
  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));

  // KPI Calculations
  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Expenses specifically linked to folders in this month
  const folderExpensesThisMonth = monthTransactions
    .filter(t => t.type === 'expense' && t.folderId)
    .reduce((sum, t) => sum + t.amount, 0);

  // General routine expenses (no folder)
  const regularExpensesThisMonth = totalExpense - folderExpensesThisMonth;

  // Active Folders
  const activeFolders = folders.filter(f => f.status === 'active');

  // Donut Chart: Expense by Category
  const categoryData = categories
    .filter(c => c.type === 'expense')
    .map(cat => {
      const value = monthTransactions
        .filter(t => t.categoryId === cat.id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        name: cat.name,
        value,
        color: cat.color,
      };
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // Bar Chart: Entradas vs Saídas & Pastas
  const cashflowData = [
    {
      name: 'Entradas',
      valor: totalIncome,
      fill: '#10b981',
    },
    {
      name: 'Saídas Gerais',
      valor: regularExpensesThisMonth,
      fill: '#f43f5e',
    },
    {
      name: 'Pastas / Projetos',
      valor: folderExpensesThisMonth,
      fill: '#3b82f6',
    },
  ];

  // Recent transactions (last 5)
  const recentTransactions = [...monthTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const handleOpenNewExpense = () => {
    setDefaultFolderForNewTx(null);
    setEditingTransaction(null);
    setTransactionModalOpen(true);
  };

  const handleOpenNewFolder = () => {
    setEditingFolder(null);
    setFolderModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Alert Banners (80% and 100% notifications) */}
      <AlertBanner />

      {/* Main KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Saldo Líquido do Mês */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Saldo do Mês</span>
            <div className={`p-2 rounded-xl ${netBalance >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-black ${netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(netBalance)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {netBalance >= 0 ? 'Superávit no período' : 'Déficit no período'}
          </span>
        </div>

        {/* Total Receitas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Receitas</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalIncome)}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
            Salário, extras e rendas
          </span>
        </div>

        {/* Total Despesas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Despesas</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalExpense)}
          </p>
          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1 block">
            Rotina + Pastas
          </span>
        </div>

        {/* Total em Pastas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs bg-linear-to-br from-white via-white to-blue-50/50 dark:from-slate-900 dark:to-blue-950/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gasto em Pastas</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
            {formatCurrency(folderExpensesThisMonth)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {totalExpense > 0 ? `${((folderExpensesThisMonth / totalExpense) * 100).toFixed(0)}% das saídas do mês` : '0%'}
          </span>
        </div>

      </div>

      {/* Quick Actions Strip */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Ações Rápidas</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Lançamento com 1 clique</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleOpenNewExpense}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Despesa</span>
          </button>

          <button
            onClick={handleOpenNewFolder}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-blue-500" />
            <span>Nova Pasta</span>
          </button>
        </div>
      </div>

      {/* Active Folders Section on Dashboard */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Minhas Pastas & Projetos Ativos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhe o orçamento individual de cada projeto
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('folders')}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>Ver todas as pastas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeFolders.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Você ainda não tem nenhuma pasta ativa.
            </p>
            <button
              onClick={handleOpenNewFolder}
              className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
            >
              + Criar uma pasta agora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {activeFolders.map(folder => {
              const spent = transactions
                .filter(t => t.folderId === folder.id && t.type === 'expense')
                .reduce((acc, t) => acc + t.amount, 0);

              const pct = folder.targetBudget > 0 ? (spent / folder.targetBudget) * 100 : 0;
              const isOver = pct >= 100;
              const isNear = pct >= 80 && !isOver;

              return (
                <div
                  key={folder.id}
                  onClick={() => {
                    setSelectedFolderId(folder.id);
                    setActiveTab('folders');
                  }}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer transition-all hover:shadow-xs group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs shrink-0"
                        style={{ backgroundColor: folder.color }}
                      >
                        {renderIcon(folder.icon, 'w-4 h-4')}
                      </div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {folder.name}
                      </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  <div className="space-y-1.5 mt-3">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Gasto: <strong className="text-slate-900 dark:text-white">{formatCurrency(spent)}</strong></span>
                      <span className="text-slate-400">Meta: {formatCurrency(folder.targetBudget)}</span>
                    </div>

                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isOver ? 'text-rose-600 font-bold' : isNear ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                        {pct.toFixed(0)}% utilizado
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {folder.targetBudget - spent >= 0 ? `Restam ${formatCurrency(folder.targetBudget - spent)}` : `Estourou ${formatCurrency(Math.abs(folder.targetBudget - spent))}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Visual Charts: Donut Categories & Cashflow Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Expenses Donut Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Gastos por Categoria
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Distribuição percentual das despesas no mês
              </p>
            </div>
            <button
              onClick={() => setActiveTab('categories')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Ver Tetos
            </button>
          </div>

          {categoryData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              Nenhuma despesa registrada neste mês.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Total']}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Cashflow Bar Chart: Entradas vs Saídas vs Pastas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Fluxo de Caixa do Mês
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparativo entre Entradas, Gastos Gerais e Pastas
              </p>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Relatórios
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#94a3b8' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Valor']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                  {cashflowData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Transactions List on Dashboard */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Últimas Transações do Mês
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Ver extrato completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            Nenhuma transação registrada para o mês selecionado.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.map(tx => {
              const cat = categories.find(c => c.id === tx.categoryId);
              const folder = folders.find(f => f.id === tx.folderId);
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: cat?.color || '#10b981' }}
                    >
                      {renderIcon(cat?.icon || 'Tag', 'w-4 h-4')}
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
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: `${folder.color}20`, color: folder.color }}
                          >
                            📁 {folder.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span>{cat?.name || 'Sem categoria'}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`font-black text-sm sm:text-base ${
                    tx.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
