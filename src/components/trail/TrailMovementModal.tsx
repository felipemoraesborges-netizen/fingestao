import { useState } from 'react';
import type { FormEvent } from 'react';
import type { ContributionType, TrailMovement, TrailMovementInput } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { MAX_MONEY, signedTrailCents, trailToday } from '../../utils/trail';
import { TrailDialog, trailButton, trailInput, trailSecondary } from './TrailDialog';

export function TrailMovementModal({ kind, original, total, onSave, onClose, classic = false }: {
  kind: ContributionType;
  original?: TrailMovement;
  total: number;
  onSave: (value: TrailMovementInput, original?: TrailMovement) => Promise<void>;
  onClose: () => void;
  classic?: boolean;
}) {
  const [amount, setAmount] = useState(original ? String(original.valor) : '');
  const [type, setType] = useState(kind);
  const [date, setDate] = useState(original?.data ?? trailToday);
  const [note, setNote] = useState(original?.observacao ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const title = original ? 'Editar lançamento' : kind === 'aporte' ? 'Guardar dinheiro' : 'Retirar dinheiro';
  const account = classic ? 'das metas de compra' : 'da Trilha';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const value: TrailMovementInput = { valor: Number(amount), tipo: type, data: date, observacao: note.trim() || null };
    const delta = signedTrailCents(value) - signedTrailCents(original);
    if (delta < 0 && !window.confirm('Confirma reduzir o saldo ' + account + ' em ' + formatCurrency(-delta / 100) + '?')) return;
    setError('');
    setBusy(true);
    try {
      await onSave(value, original);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o lançamento.');
    } finally {
      setBusy(false);
    }
  }

  return <TrailDialog title={title} onClose={onClose} busy={busy}>
    <form className="space-y-3" onSubmit={event => void submit(event)}>
      <p className="text-sm text-slate-600 dark:text-slate-400">Saldo {account} · {formatCurrency(total)}</p>
      {original && <label className="grid gap-1 text-sm font-semibold">Tipo do lançamento
        <select className={trailInput} value={type} onChange={event => setType(event.target.value === 'retirada' ? 'retirada' : 'aporte')}>
          <option value="aporte">Aporte</option>
          <option value="retirada">Retirada</option>
        </select>
      </label>}
      <label className="grid gap-1 text-sm font-semibold">Valor em reais
        <input type="number" inputMode="decimal" required min=".01" max={MAX_MONEY} step=".01" className={trailInput}
          value={amount} onChange={event => setAmount(event.target.value)} />
      </label>
      <label className="grid gap-1 text-sm font-semibold">Data do lançamento
        <input type="date" required className={trailInput} value={date} onChange={event => setDate(event.target.value)} />
      </label>
      <label className="grid gap-1 text-sm font-semibold">Observação (opcional)
        <textarea className={trailInput} rows={2} value={note} onChange={event => setNote(event.target.value)} />
      </label>
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <button className={trailSecondary} type="button" disabled={busy} onClick={onClose}>Cancelar</button>
        <button className={classic ? 'rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50' : trailButton}
          disabled={busy}>{busy ? 'Salvando…' : original ? 'Salvar alterações' : kind === 'aporte' ? 'Confirmar aporte' : 'Confirmar retirada'}</button>
      </div>
    </form>
  </TrailDialog>;
}
