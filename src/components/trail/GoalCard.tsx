import React from 'react';
import { CheckCircle2, Lock, Zap, ExternalLink, Pencil, Trash2, PlusCircle, MinusCircle, TrendingUp } from 'lucide-react';
import type { Goal } from '../../types';

interface GoalCardProps {
  goal: Goal;
  index: number;
  onAddContribution: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
}

const STATUS_ICONS: Record<Goal['status'], React.ReactNode> = {
  concluida: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  em_andamento: <Zap className="w-5 h-5 text-violet-500 animate-pulse" />,
  bloqueada: <Lock className="w-5 h-5 text-slate-400" />,
};

function estimarMeses(falta: number, mediaMensal: number): string {
  if (falta <= 0) return 'Concluído!';
  if (mediaMensal <= 0) return '—';
  const meses = Math.ceil(falta / mediaMensal);
  if (meses === 1) return '~1 mês';
  if (meses < 12) return `~${meses} meses`;
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  return `~${anos}a ${resto > 0 ? resto + 'm' : ''}`;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, index, onAddContribution, onEdit, onDelete }) => {
  const pct = goal.preco > 0 ? Math.min(100, (goal.valorAcumulado / goal.preco) * 100) : 0;
  const falta = Math.max(0, goal.preco - goal.valorAcumulado);
  const isConcluida = goal.status === 'concluida';
  const isEmAndamento = goal.status === 'em_andamento';
  const isBloqueada = goal.status === 'bloqueada';

  const barColor = isConcluida ? '#10b981' : pct >= 80 ? '#f59e0b' : '#8b5cf6';

  return (
    <div className={`relative rounded-3xl border transition-all duration-300 overflow-hidden ${
      isEmAndamento
        ? 'border-violet-400 dark:border-violet-600 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-slate-900 shadow-lg shadow-violet-500/10'
        : isConcluida
        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10'
        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-70'
    }`}>
      {/* Phase badge */}
      <div className={`absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
        isConcluida ? 'bg-emerald-500 text-white'
        : isEmAndamento ? 'bg-violet-600 text-white'
        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
      }`}>
        {index + 1}
      </div>

      {/* Status icon */}
      <div className="absolute top-3 right-3">
        {STATUS_ICONS[goal.status]}
      </div>

      <div className="pt-10 pb-4 px-4">
        {/* Image */}
        {goal.imagemUrl ? (
          <div className="w-full h-32 rounded-2xl overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800">
            <img src={goal.imagemUrl} alt={goal.nome} className={`w-full h-full object-cover ${isBloqueada ? 'grayscale opacity-50' : ''}`} />
          </div>
        ) : (
          <div className={`w-full h-20 rounded-2xl mb-3 flex items-center justify-center ${
            isBloqueada ? 'bg-slate-100 dark:bg-slate-800' : 'bg-violet-100 dark:bg-violet-950/40'
          }`}>
            <TrendingUp className={`w-8 h-8 ${isBloqueada ? 'text-slate-300 dark:text-slate-600' : 'text-violet-400'}`} />
          </div>
        )}

        {/* Name & Category */}
        <div className="mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500 dark:text-violet-400">
            {goal.categoria}
          </span>
          <h3 className={`font-bold text-sm leading-tight mt-0.5 ${
            isBloqueada ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
          }`}>
            {goal.nome}
          </h3>
        </div>

        {/* Price */}
        <p className={`text-lg font-black mb-3 ${
          isConcluida ? 'text-emerald-600 dark:text-emerald-400'
          : isEmAndamento ? 'text-violet-700 dark:text-violet-300'
          : 'text-slate-400 dark:text-slate-500'
        }`}>
          R$ {goal.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>

        {/* Progress bar */}
        <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>

        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
          <span>R$ {goal.valorAcumulado.toFixed(2)} guardado</span>
          <span className="font-semibold" style={{ color: barColor }}>{pct.toFixed(0)}%</span>
        </div>

        {!isConcluida && falta > 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
            Falta <span className="font-semibold text-slate-600 dark:text-slate-300">R$ {falta.toFixed(2)}</span>
            {' '}&bull;{' '}
            {estimarMeses(falta, 500)} {/* TODO: use actual monthly savings */}
          </p>
        )}

        {isConcluida && goal.conquistadoEm && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-3">
            🎉 Conquistado em {new Date(goal.conquistadoEm).toLocaleDateString('pt-BR')}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {!isBloqueada && !isConcluida && (
            <button
              onClick={() => onAddContribution(goal)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors shadow-sm shadow-violet-600/20 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Guardar
            </button>
          )}
          {isConcluida && (
            <button
              onClick={() => onAddContribution(goal)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <MinusCircle className="w-3.5 h-3.5" />
              Retirada
            </button>
          )}
          {goal.linkLoja && (
            <a href={goal.linkLoja} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">
              <ExternalLink className="w-3.5 h-3.5" />
              Loja
            </a>
          )}
          <button onClick={() => onEdit(goal)}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(goal.id)}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
