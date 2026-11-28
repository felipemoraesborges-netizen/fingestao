import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { SavingsGoal } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { readSavingsMovements, recordSavingsMovement } from '../../services/savingsLedger';
import type { SavingsMovement, SavingsMovementType } from '../../services/savingsLedger';

const control = 'rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900';

export function SavingsLedger({ goal, userId }: { goal: SavingsGoal; userId: string }) {
  const { refreshData } = useApp();
  const [entries, setEntries] = useState<SavingsMovement[]>();
  const [kind, setKind] = useState<SavingsMovementType>('aporte');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const attempt = useRef<{ kind: SavingsMovementType; amount: number; id: string }>(undefined);
  useEffect(() => {
    const controller = new AbortController();
    void readSavingsMovements(userId, goal.id, controller.signal).then(result => {
      if (!controller.signal.aborted) setEntries(result);
    }, (reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Histórico indisponível.');
    });
    return () => controller.abort();
  }, [goal.id, userId]);

  async function submit() {
    const amount = Number(value.replace(',', '.'));
    if (busy || !Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) return;
    if (kind === 'retirada' && amount > goal.savedAmount) { setError('O valor ultrapassa o saldo guardado.'); return; }
    if (attempt.current?.kind !== kind || attempt.current.amount !== amount) attempt.current = { kind, amount, id: crypto.randomUUID() };
    setBusy(true);
    setError('');
    try {
      const saved = await recordSavingsMovement(goal.id, kind, amount, attempt.current.id);
      if (!saved) throw new Error('Aplique a atualização do Supabase para usar o cofrinho.');
      attempt.current = undefined;
      setValue('');
      await refreshData();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao registrar movimento.'); }
    finally { setBusy(false); }
  }

  return <section className="mt-3 space-y-3 border-t border-slate-200 pt-3 text-sm dark:border-slate-800" aria-label={'Cofrinho de ' + goal.name}>
    <p>O cofrinho registra o que você guardou ou retirou. O app não movimenta dinheiro.</p>
    <form className="flex flex-wrap items-end gap-2" onSubmit={event => { event.preventDefault(); void submit(); }}>
      <label className="grid gap-1 font-semibold">Tipo de movimento
        <select className={control} value={kind} onChange={event => setKind(event.currentTarget.value as SavingsMovementType)}>
          <option value="aporte">Aporte</option><option value="retirada">Retirada</option>
        </select>
      </label>
      <label className="grid min-w-24 flex-1 gap-1 font-semibold">Valor (R$)
        <input className={control + ' min-w-0'} type="number" min=".01" max="100000000" step=".01" required value={value} onChange={event => setValue(event.currentTarget.value)} />
      </label>
      <button type="submit" className={control + ' font-semibold disabled:opacity-50'} disabled={busy || !entries}>Registrar movimento</button>
    </form>
    {error && <p role="alert" className="text-rose-700 dark:text-rose-300">{error}</p>}
    {!entries && !error && <p role="status">Carregando histórico…</p>}
    {entries && (entries.length ? <ul className="space-y-1">{entries.map(entry =>
      <li className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-1 dark:border-slate-800" key={entry.id}>
        <span>{entry.tipo === 'aporte' ? 'Aporte' : 'Retirada'} · {new Date(entry.criada_em).toLocaleDateString('pt-BR')}</span>
        <strong>{formatCurrency(Number(entry.valor))}</strong>
      </li>)}</ul> : <p>Nenhum movimento registrado desde a atualização.</p>)}
  </section>;
}
