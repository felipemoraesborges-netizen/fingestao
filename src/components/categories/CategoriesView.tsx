import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { renderIcon } from '../../utils/iconMap';
import { 
  Tags, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  AlertCircle, 
  TrendingUp
} from 'lucide-react';

export const CategoriesView: React.FC = () => {
  const {
    categories,
    transactions,
    selectedMonth,
    setCategoryModalOpen,
    setEditingCategory,
    deleteCategory,
  } = useApp();

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const handleCreate = () => {
    setEditingCategory(null);
    setCategoryModalOpen(true);
  };

  const handleEdit = (cat: typeof categories[0]) => {
    setEditingCategory(cat);
    setCategoryModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) {
      deleteCategory(id);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Categorias & Tetos Mensais
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Defina limites de gastos para cada categoria do dia a dia e receba alertas automáticos.
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Expense Categories with Spending Ceiling Progress */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Categorias de Despesa ({expenseCategories.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Mês: {selectedMonth}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expenseCategories.map(cat => {
            const spent = transactions
              .filter(t => t.categoryId === cat.id && t.type === 'expense' && t.date.startsWith(selectedMonth))
              .reduce((sum, t) => sum + t.amount, 0);

            const hasLimit = cat.budgetLimit > 0;
            const percentage = hasLimit ? (spent / cat.budgetLimit) * 100 : 0;
            const isOver = percentage >= 100;
            const isNear = percentage >= 80 && !isOver;

            return (
              <div
                key={cat.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      {renderIcon(cat.icon, 'w-5 h-5')}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {cat.name}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Gasto no mês: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(spent)}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar categoria"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Excluir categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar and limit */}
                {hasLimit ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">
                        Teto: {formatCurrency(cat.budgetLimit)}
                      </span>
                      <span className={isOver ? 'text-rose-600 font-bold flex items-center gap-1' : isNear ? 'text-amber-600 font-bold flex items-center gap-1' : 'text-slate-500'}>
                        {isOver && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {isNear && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                        {percentage.toFixed(0)}% do teto
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{isOver ? 'Excedente:' : 'Disponível:'}</span>
                      <span className={`font-bold ${isOver ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatCurrency(Math.abs(cat.budgetLimit - spent))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Sem teto definido</span>
                    <button
                      onClick={() => handleEdit(cat)}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      + Definir teto
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* Income Categories */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Categorias de Receita ({incomeCategories.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {incomeCategories.map(cat => {
            const received = transactions
              .filter(t => t.categoryId === cat.id && t.type === 'income' && t.date.startsWith(selectedMonth))
              .reduce((sum, t) => sum + t.amount, 0);

            return (
              <div 
                key={cat.id} 
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    {renderIcon(cat.icon, 'w-4 h-4')}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {cat.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Entrou: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(received)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
