import { useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import type { TrailLedger, TrailMovement } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { trailButton, trailSecondary } from './TrailDialog';

const pageSize = 20;

export function TrailMovementHistory({ ledger, onAdd, onEdit, onRemove }: {
  ledger: TrailLedger | null;
  onAdd: () => void;
  onEdit: (movement: TrailMovement) => void;
  onRemove: (movement: TrailMovement) => Promise<void>;
}) {
  const [limit, setLimit] = useState(pageSize);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const entries = ledger?.movements ?? [];
  const remove = async (movement: TrailMovement) => {
    if (busy || !window.confirm('Excluir este lançamento de ' + formatCurrency(movement.valor) + ' do histórico da Trilha?')) return;
    setBusy(true);
    setError('');
    try { await onRemove(movement); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível excluir o lançamento.'); }
    finally { setBusy(false); }
  };

  return <section className="space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black">Histórico de aportes</h1>
        {ledger && <p className="text-sm text-slate-600 dark:text-slate-400">Saldo da Trilha · {formatCurrency(ledger.total)}</p>}
      </div>
      <button type="button" className={trailButton} disabled={!ledger || busy} onClick={onAdd}>Guardar dinheiro</button>
    </header>
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
    {entries.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm dark:border-slate-700">
      {ledger ? 'Nenhum aporte ou retirada registrado.' : 'Histórico indisponível.'}
    </p> : <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
      {entries.slice(0, limit).map(movement => {
        const deposit = movement.tipo === 'aporte';
        const label = deposit ? 'Aporte' : 'Retirada';
        const when = formatDate(movement.data);
        return <li key={movement.id} className="flex flex-wrap items-start justify-between gap-3 p-3" aria-label={label + ' de ' + when}>
          <div className="flex min-w-0 items-start gap-3">
            <span className={'rounded-xl p-2 ' + (deposit ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300')}>
              {deposit ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
            </span>
            <div className="min-w-0">
              <p className="font-bold">{label} · {formatCurrency(movement.valor)}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400"><time dateTime={movement.data}>{when}</time></p>
              {movement.observacao && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600 dark:text-slate-400">{movement.observacao}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className={trailSecondary} disabled={busy} onClick={() => { setError(''); onEdit(movement); }} aria-label={'Editar ' + label.toLowerCase() + ' de ' + when}><Pencil size={16} /></button>
            <button type="button" className={trailSecondary} disabled={busy} onClick={() => void remove(movement)} aria-label={'Excluir ' + label.toLowerCase() + ' de ' + when}><Trash2 size={16} /></button>
          </div>
        </li>;
      })}
    </ul>}
    {entries.length > limit && <button type="button" className={trailSecondary} onClick={() => setLimit(value => value + pageSize)}>Mostrar mais lançamentos</button>}
  </section>;
}
