import React, { useState } from 'react';
import { X, Target, DollarSign, Link, Image, FileText, Layers } from 'lucide-react';
import type { Goal } from '../../types';

const CATEGORIAS = [
  'sala', 'quarto', 'cozinha', 'banheiro', 'escritório',
  'tecnologia', 'lazer', 'moda', 'viagem', 'saúde', 'outro',
];

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
  editingGoal?: Goal | null;
}

export const GoalFormModal: React.FC<GoalFormModalProps> = ({ isOpen, onClose, onSave, editingGoal }) => {
  const [nome, setNome] = useState(editingGoal?.nome ?? '');
  const [preco, setPreco] = useState(editingGoal ? String(editingGoal.preco) : '');
  const [categoria, setCategoria] = useState(editingGoal?.categoria ?? 'outro');
  const [imagemUrl, setImagemUrl] = useState(editingGoal?.imagemUrl ?? '');
  const [linkLoja, setLinkLoja] = useState(editingGoal?.linkLoja ?? '');
  const [observacao, setObservacao] = useState(editingGoal?.observacao ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroMsg, setErroMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return setErroMsg('Informe um nome para o objetivo.');
    const precoNum = parseFloat(preco.replace(',', '.'));
    if (isNaN(precoNum) || precoNum <= 0) return setErroMsg('Informe um preço válido maior que zero.');

    setIsSubmitting(true);
    setErroMsg('');
    try {
      await onSave({
        nome: nome.trim(),
        preco: precoNum,
        categoria,
        imagemUrl: imagemUrl.trim() || undefined,
        linkLoja: linkLoja.trim() || undefined,
        observacao: observacao.trim() || undefined,
        status: editingGoal?.status ?? 'bloqueada',
        valorAcumulado: editingGoal?.valorAcumulado ?? 0,
        conquistadoEm: editingGoal?.conquistadoEm,
      });
      onClose();
    } catch (err: unknown) {
      setErroMsg(err instanceof Error ? err.message : 'Erro ao salvar objetivo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
              <Target className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="font-bold text-slate-900 dark:text-white">
              {editingGoal ? 'Editar Objetivo' : 'Novo Objetivo'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {erroMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
              {erroMsg}
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              <Target className="w-3.5 h-3.5 inline mr-1" />Nome do Objetivo *
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="ex: Sofá de couro, iPhone 15..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
            />
          </div>

          {/* Preço */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              <DollarSign className="w-3.5 h-3.5 inline mr-1" />Preço-alvo (R$) *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={preco}
              onChange={e => setPreco(e.target.value)}
              placeholder="0,00"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              <Layers className="w-3.5 h-3.5 inline mr-1" />Categoria
            </label>
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
            >
              {CATEGORIAS.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Imagem URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              <Image className="w-3.5 h-3.5 inline mr-1" />URL da Imagem (opcional)
            </label>
            <input
              type="url"
              value={imagemUrl}
              onChange={e => setImagemUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
            />
          </div>

          {/* Link loja */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              <Link className="w-3.5 h-3.5 inline mr-1" />Link da Loja (opcional)
            </label>
            <input
              type="url"
              value={linkLoja}
              onChange={e => setLinkLoja(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
            />
          </div>

          {/* Observação */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              <FileText className="w-3.5 h-3.5 inline mr-1" />Observação
            </label>
            <textarea
              rows={2}
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Por que você quer isso?"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors shadow-md shadow-violet-600/20 disabled:opacity-50 cursor-pointer">
              {isSubmitting ? 'Salvando...' : editingGoal ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
