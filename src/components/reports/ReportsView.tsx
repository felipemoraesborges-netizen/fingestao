import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatMonthName, getPaymentMethodLabel } from '../../utils/formatters';
import { exportMonthlyReportToCSV, exportMonthlyReportToPDF } from '../../utils/exportUtils';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  FolderKanban, 
  FileSpreadsheet, 
  FileText,
  Calendar,
  CreditCard
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const ReportsView: React.FC = () => {
  const {
    transactions,
    categories,
    folders,
    selectedMonth,
  } = useApp();

  // Current month transactions
  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
  const totalIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const folderExpense = monthTransactions.filter(t => t.type === 'expense' && t.folderId).reduce((sum, t) => sum + t.amount, 0);
  const regularExpense = totalExpense - folderExpense;
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Month-over-month comparative (last 6 months)
  const [currY, currM] = selectedMonth.split('-').map(Number);
  const lastMonths: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currY, currM - 1 - i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    lastMonths.push(mStr);
  }

  const comparisonData = lastMonths.map(mStr => {
    const txs = transactions.filter(t => t.date.startsWith(mStr));
    const inc = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const exp = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const foldExp = txs.filter(t => t.type === 'expense' && t.folderId).reduce((acc, t) => acc + t.amount, 0);

    const [y, m] = mStr.split('-');
    const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pt-BR', { month: 'short' });

    return {
      monthKey: mStr,
      label: label.toUpperCase(),
      Receitas: inc,
      Despesas: exp,
      Pastas: foldExp,
      Saldo: inc - exp,
    };
  });

  // Spending by payment method
  const paymentMethodsData = [
    'pix',
    'credit_card',
    'debit_card',
    'cash',
    'bank_slip',
    'transfer'
  ].map(method => {
    const total = monthTransactions
      .filter(t => t.type === 'expense' && t.paymentMethod === method)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      name: getPaymentMethodLabel(method),
      value: total,
    };
  }).filter(item => item.value > 0);

  const paymentColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

  const handleExportCSV = () => {
    exportMonthlyReportToCSV(selectedMonth, monthTransactions, categories, folders);
  };

  const handleExportPDF = () => {
    exportMonthlyReportToPDF(
      selectedMonth,
      formatMonthName(selectedMonth),
      monthTransactions,
      categories,
      folders,
      totalIncome,
      totalExpense,
      folderExpense
    );
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Relatórios & Comparativo
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Análise aprofundada da evolução financeira e taxa de economia mês a mês.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 shadow-xs"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>Relatório em PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Taxa de Poupança</span>
            <PiggyBank className="w-4 h-4 text-emerald-500" />
          </div>
          <p className={`text-2xl font-black ${savingsRate >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {savingsRate.toFixed(1)}%
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {savingsRate >= 20 ? 'Excelente reserva!' : savingsRate >= 0 ? 'Positiva no mês' : 'Gastos acima da renda'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Poupado</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className={`text-2xl font-black ${netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(netSavings)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Saldo líquido do mês
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gastos em Pastas</span>
            <FolderKanban className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {formatCurrency(folderExpense)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {totalExpense > 0 ? `${((folderExpense / totalExpense) * 100).toFixed(0)}% do total gasto` : '0%'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gastos Rotineiros</span>
            <TrendingDown className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(regularExpense)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Despesas sem pasta vinculada
          </span>
        </div>

      </div>

      {/* Main Month-Over-Month Comparison Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Evolução Comparativa Mês a Mês (Últimos 6 Meses)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Acompanhe o crescimento das suas receitas contra despesas gerais e projetos
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis 
                tick={{ fontSize: 10, fill: '#94a3b8' }} 
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} 
              />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val) || 0)]}
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend 
                verticalAlign="top" 
                align="right"
                formatter={(val) => <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{val}</span>} 
              />
              <Bar dataKey="Receitas" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Despesas" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Pastas" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid: Payment Methods & Month-by-Month Data Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Methods Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Formas de Pagamento
            </h3>
          </div>

          {paymentMethodsData.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">
              Sem dados de despesas neste mês.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {paymentMethodsData.map((_, index) => (
                        <Cell key={`pm-${index}`} fill={paymentColors[index % paymentColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [formatCurrency(Number(v) || 0), 'Total']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {paymentMethodsData.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: paymentColors[idx % paymentColors.length] }}
                      />
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Month-over-Month Detailed Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Extrato Comparativo por Mês
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2.5 px-3">Mês</th>
                  <th className="py-2.5 px-3 text-right">Receitas</th>
                  <th className="py-2.5 px-3 text-right">Despesas</th>
                  <th className="py-2.5 px-3 text-right">Em Pastas</th>
                  <th className="py-2.5 px-3 text-right">Saldo Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {comparisonData.map((row) => (
                  <tr key={row.monthKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {formatMonthName(row.monthKey)}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(row.Receitas)}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-rose-600 dark:text-rose-400">
                      {formatCurrency(row.Despesas)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-blue-600 dark:text-blue-400">
                      {formatCurrency(row.Pastas)}
                    </td>
                    <td className={`py-3 px-3 text-right font-black ${row.Saldo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {formatCurrency(row.Saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
