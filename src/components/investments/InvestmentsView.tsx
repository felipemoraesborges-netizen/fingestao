import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { exportInvestmentsToCSV } from '../../utils/exportUtils';
import type { Investment, InvestmentType } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Pencil,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  PieChart as PieChartIcon,
  Loader2,
  Search,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  renda_fixa: 'Renda Fixa',
  tesouro_direto: 'Tesouro Direto',
  acoes: 'Ações',
  fiis: 'FIIs',
  cripto: 'Cripto',
  poupanca: 'Poupança',
  outro: 'Outro',
};

const INVESTMENT_TYPE_COLORS: Record<InvestmentType, string> = {
  renda_fixa: '#10b981',
  tesouro_direto: '#3b82f6',
  acoes: '#8b5cf6',
  fiis: '#f59e0b',
  cripto: '#ec4899',
  poupanca: '#06b6d4',
  outro: '#64748b',
};

export const InvestmentsView: React.FC = () => {
  const {
    investments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    isLoadingData,
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<InvestmentType>('renda_fixa');
  const [amountInvestedStr, setAmountInvestedStr] = useState('');
  const [currentValueStr, setCurrentValueStr] = useState('');
  const [notes, setNotes] = useState('');

  // Aporte/Resgate modal
  const [aporteModalOpen, setAporteModalOpen] = useState(false);
  const [aporteTarget, setAporteTarget] = useState<Investment | null>(null);
  const [aporteType, setAporteType] = useState<'aporte' | 'resgate'>('aporte');
  const [aporteValueStr, setAporteValueStr] = useState('');

  // KPIs
  const totalInvested = investments.reduce((sum, i) => sum + i.amountInvested, 0);
  const totalCurrentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
  const totalProfit = totalCurrentValue - totalInvested;
  const profitPct = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  // Donut data by type
  const typeData = Object.keys(INVESTMENT_TYPE_LABELS)
    .map(key => {
      const t = key as InvestmentType;
      const value = investments
        .filter(i => i.type === t)
        .reduce((sum, i) => sum + i.currentValue, 0);
      return {
        name: INVESTMENT_TYPE_LABELS[t],
        value,
        color: INVESTMENT_TYPE_COLORS[t],
      };
    })
    .filter(d => d.value > 0);

  // Filtered investments
  const filtered = investments.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const openNewModal = () => {
    setEditing(null);
    setName('');
    setType('renda_fixa');
    setAmountInvestedStr('');
    setCurrentValueStr('');
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (inv: Investment) => {
    setEditing(inv);
    setName(inv.name);
    setType(inv.type);
    setAmountInvestedStr(inv.amountInvested.toString());
    setCurrentValueStr(inv.currentValue.toString());
    setNotes(inv.notes || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Informe o nome do investimento.');
      return;
    }
    const amountInvested = parseFloat(amountInvestedStr.replace(',', '.')) || 0;
    const currentValue = parseFloat(currentValueStr.replace(',', '.')) || 0;

    setIsSubmitting(true);
    try {
      if (editing) {
        await updateInvestment({
          ...editing,
          name: name.trim(),
          type,
          amountInvested,
          currentValue,
          notes: notes.trim() || undefined,
        });
      } else {
        await addInvestment({
          name: name.trim(),
          type,
          amountInvested,
          currentValue,
          notes: notes.trim() || undefined,
        });
      }
      setModalOpen(false);
    } catch {
      // Error already handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este investimento?')) return;
    try {
      await deleteInvestment(id);
    } catch {
      // handled
    }
  };

  const openAporteModal = (inv: Investment, kind: 'aporte' | 'resgate') => {
    setAporteTarget(inv);
    setAporteType(kind);
    setAporteValueStr('');
    setAporteModalOpen(true);
  };

  const handleAporteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aporteTarget) return;
    const val = parseFloat(aporteValueStr.replace(',', '.')) || 0;
    if (val <= 0) {
      alert('Informe um valor maior que zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (aporteType === 'aporte') {
        await updateInvestment({
          ...aporteTarget,
          amountInvested: aporteTarget.amountInvested + val,
          currentValue: aporteTarget.currentValue + val,
        });
      } else {
        const newCurrent = Math.max(0, aporteTarget.currentValue - val);
        const newInvested = Math.max(0, aporteTarget.amountInvested - val);
        await updateInvestment({
          ...aporteTarget,
          amountInvested: newInvested,
          currentValue: newCurrent,
        });
      }
      setAporteModalOpen(false);
    } catch {
      // handled
    } finally {
      setIsSubmitting(false);
    }
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
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Investimentos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Acompanhe sua carteira de investimentos</p>
        </div>
        <div className="flex items-center gap-2">
          {investments.length > 0 && (
            <button
              onClick={() => exportInvestmentsToCSV(investments)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
              title="Exportar Investimentos em CSV"
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
            <span>Novo Investimento</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Investido */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Investido</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalInvested)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Capital aportado</span>
        </div>

        {/* Valor Atual */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Valor Atual</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalCurrentValue)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Patrimônio atual</span>
        </div>

        {/* Lucro / Prejuízo */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lucro / Prejuízo</span>
            <div className={`p-2 rounded-xl ${totalProfit >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'}`}>
              {totalProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-black ${totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
          </p>
          <span className={`text-[11px] font-semibold mt-1 block ${totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {profitPct >= 0 ? '+' : ''}{profitPct.toFixed(2)}% de rentabilidade
          </span>
        </div>
      </div>

      {/* Donut Chart */}
      {typeData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Distribuição por Tipo</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Valor atual por classe de ativo</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Valor Atual']}
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
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar investimento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
      </div>

      {/* Investments List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Wallet className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {investments.length === 0 ? 'Nenhum investimento cadastrado.' : 'Nenhum resultado encontrado.'}
            </p>
            {investments.length === 0 && (
              <button onClick={openNewModal} className="mt-2 text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
                + Cadastrar primeiro investimento
              </button>
            )}
          </div>
        ) : (
          filtered.map(inv => {
            const profit = inv.currentValue - inv.amountInvested;
            const pct = inv.amountInvested > 0 ? (profit / inv.amountInvested) * 100 : 0;
            return (
              <div
                key={inv.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: INVESTMENT_TYPE_COLORS[inv.type] }}
                    >
                      {INVESTMENT_TYPE_LABELS[inv.type].substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{inv.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{INVESTMENT_TYPE_LABELS[inv.type]}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-black text-sm text-slate-900 dark:text-white">{formatCurrency(inv.currentValue)}</p>
                    <p className={`text-xs font-semibold ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {profit >= 0 ? '+' : ''}{formatCurrency(profit)} ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                  <button
                    onClick={() => openAporteModal(inv, 'aporte')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer"
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    Aporte
                  </button>
                  <button
                    onClick={() => openAporteModal(inv, 'resgate')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors cursor-pointer"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    Resgate
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => openEditModal(inv)}
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(inv.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============= INVESTMENT MODAL ============= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editing ? 'Editar Investimento' : 'Novo Investimento'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Nome *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: CDB Banco Inter, PETR4..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  required
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Tipo de Investimento</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as InvestmentType)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  {Object.entries(INVESTMENT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Amount Invested */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Valor Investido (R\$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountInvestedStr}
                  onChange={e => setAmountInvestedStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              {/* Current Value */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Valor Atual (R\$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={currentValueStr}
                  onChange={e => setCurrentValueStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              {/* Notes */}
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

              {/* Footer */}
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
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Salvando...' : editing ? 'Salvar' : 'Cadastrar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============= APORTE/RESGATE MODAL ============= */}
      {aporteModalOpen && aporteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {aporteType === 'aporte' ? 'Registrar Aporte' : 'Registrar Resgate'}
              </h3>
              <button onClick={() => setAporteModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleAporteSubmit} className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>{aporteTarget.name}</strong> — Valor atual: {formatCurrency(aporteTarget.currentValue)}
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Valor do {aporteType === 'aporte' ? 'Aporte' : 'Resgate'} (R\$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={aporteValueStr}
                  onChange={e => setAporteValueStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  required
                  autoFocus
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAporteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer ${
                    aporteType === 'aporte'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25'
                  }`}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : aporteType === 'aporte' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Salvando...' : 'Confirmar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
