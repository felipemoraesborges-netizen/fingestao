import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { TransactionType, PaymentMethod } from '../../types';
import { X, Check, ArrowDownRight, ArrowUpRight, FolderKanban, RotateCw } from 'lucide-react';

export const TransactionModal: React.FC = () => {
  const {
    transactionModalOpen,
    setTransactionModalOpen,
    editingTransaction,
    setEditingTransaction,
    defaultFolderForNewTx,
    categories,
    folders,
    addTransaction,
    updateTransaction,
  } = useApp();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [folderId, setFolderId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when modal opens
  useEffect(() => {
    if (!transactionModalOpen) return;

    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmountStr(editingTransaction.amount.toString());
      setDescription(editingTransaction.description);
      setCategoryId(editingTransaction.categoryId);
      setFolderId(editingTransaction.folderId || '');
      setPaymentMethod(editingTransaction.paymentMethod);
      setDate(editingTransaction.date);
      setIsRecurring(editingTransaction.isRecurring);
      setNotes(editingTransaction.notes || '');
    } else {
      setType('expense');
      setAmountStr('');
      setDescription('');
      const defaultCat = categories.find(c => c.type === 'expense');
      setCategoryId(defaultCat ? defaultCat.id : (categories[0]?.id || ''));
      setFolderId(defaultFolderForNewTx || '');
      setPaymentMethod('pix');
      setDate(new Date().toISOString().split('T')[0]);
      setIsRecurring(false);
      setNotes('');
    }
  }, [transactionModalOpen, editingTransaction, defaultFolderForNewTx, categories]);

  if (!transactionModalOpen) return null;

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      alert('Por favor, informe um valor numérico válido maior que zero.');
      return;
    }

    if (!description.trim()) {
      alert('Por favor, insira uma descrição para a transação.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTransaction) {
        await updateTransaction({
          ...editingTransaction,
          type,
          amount: cleanAmount,
          description: description.trim(),
          categoryId,
          folderId: folderId || null,
          paymentMethod,
          date,
          isRecurring,
          notes: notes.trim() || undefined,
        });
      } else {
        await addTransaction({
          type,
          amount: cleanAmount,
          description: description.trim(),
          categoryId,
          folderId: folderId || null,
          paymentMethod,
          date,
          isRecurring,
          notes: notes.trim() || undefined,
        });
      }

      setTransactionModalOpen(false);
      setEditingTransaction(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickDescriptionsExpense = ['Supermercado', 'Almoço', 'Combustível', 'Farmácia', 'Uber', 'Padaria', 'Lanche'];
  const quickDescriptionsIncome = ['Salário', 'Freelance', 'Rendimento', 'Venda', 'Reembolso'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
          </h3>
          <button
            onClick={() => setTransactionModalOpen(false)}
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
              onClick={() => {
                setType('expense');
                const firstExp = categories.find(c => c.type === 'expense');
                if (firstExp) setCategoryId(firstExp.id);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Despesa (Gasto)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('income');
                const firstInc = categories.find(c => c.type === 'income');
                if (firstInc) setCategoryId(firstInc.id);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Receita (Ganho)</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Valor (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                className="w-full pl-12 pr-4 py-3.5 text-2xl font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Descrição / Título *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Almoço de Domingo..."
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white transition-all"
            />
            {/* Quick tags */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
              {(type === 'expense' ? quickDescriptionsExpense : quickDescriptionsIncome).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setDescription(tag)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Vínculo a Pasta / Projeto (Destaque Principal) */}
          <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/50 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <FolderKanban className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Vincular a uma Pasta / Projeto?</span>
              </label>
              <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                Opcional
              </span>
            </div>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700/60 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white font-medium"
            >
              <option value="">Nenhum (Gasto comum do dia a dia)</option>
              {folders
                .filter(f => f.status === 'active')
                .map(folder => (
                  <option key={folder.id} value={folder.id}>
                    📁 {folder.name} (Meta: R$ {folder.targetBudget.toFixed(2)})
                  </option>
                ))}
            </select>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400/80">
              Isola este gasto dentro do orçamento específico do projeto (ex: Viagem, Reforma, Evento).
            </p>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Categoria *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white font-medium"
            >
              {filteredCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} {cat.budgetLimit > 0 ? `(Teto: R$ ${cat.budgetLimit})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method & Date (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              >
                <option value="pix">PIX</option>
                <option value="credit_card">Cartão de Crédito</option>
                <option value="debit_card">Cartão de Débito</option>
                <option value="cash">Dinheiro em Espécie</option>
                <option value="bank_slip">Boleto Bancário</option>
                <option value="transfer">Transferência / TED</option>
                <option value="other">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Data do Lançamento
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Recurring Expense Switch */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <RotateCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Gasto Fixo / Recorrente Mensal
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ex: Aluguel, assinaturas (Netflix, academia)
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Observações (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações adicionais, parcelas, etc..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setTransactionModalOpen(false)}
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
              <span>{isSubmitting ? 'Salvando...' : editingTransaction ? 'Salvar Alterações' : 'Adicionar Transação'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
