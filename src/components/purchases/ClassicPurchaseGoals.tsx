import { Activity, useCallback, useEffect, useState } from 'react';
import { Cloud, Pencil, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PurchaseGoalsService } from '../../services/purchaseGoalsService';
import type { ContributionType, Goal, TrailLedger } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cents, orderedPurchaseGoals, trailForecast, trailRhythm } from '../../utils/trail';
import { GoalFormModal } from '../trail/GoalFormModal';
import { TrailMovementModal } from '../trail/TrailMovementModal';

const primary = 'inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50';
const secondary = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 disabled:opacity-50';

type Snapshot = { goals: Goal[]; ledger: TrailLedger | null };

function PurchaseImage({ url }: { url?: string }) {
  const [failed, setFailed] = useState<string>();
  if (!url || failed === url || !/^https?:\/\//i.test(url)) return <ShoppingBag size={22} aria-hidden="true" />;
  return <img alt="" loading="lazy" src={url} className="h-full w-full object-cover" onError={() => setFailed(url)} />;
}

function PurchaseList({ userId, visible }: { userId: string; visible: boolean }) {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [error, setError] = useState('');
  const [ledgerUnavailable, setLedgerUnavailable] = useState(false);
  const [goalForm, setGoalForm] = useState<Goal | 'new'>();
  const [movement, setMovement] = useState<ContributionType>();
  const [removing, setRemoving] = useState<string>();
  const load = useCallback(async () => {
    setError('');
    try {
      const [goals, ledger] = await Promise.all([
        PurchaseGoalsService.getGoals(userId),
        PurchaseGoalsService.getTrailLedger(userId).catch(() => null),
      ]);
      setSnapshot({ goals, ledger });
      setLedgerUnavailable(!ledger);
    } catch {
      setError('Não foi possível carregar as metas de compra.');
    }
  }, [userId]);

  useEffect(() => {
    if (visible) void load();
  }, [load, visible]);

  const ledger = snapshot?.ledger;
  const rhythm = ledger ? trailRhythm(ledger.movements) : undefined;
  let needed = 0;
  const products = orderedPurchaseGoals(snapshot?.goals ?? []).map(goal => {
    const price = Math.max(0, cents(goal.preco));
    const available = ledger ? Math.max(0, cents(ledger.total) - needed) : null;
    const saved = available === null ? null : Math.min(price, available);
    needed += price;
    return {
      goal, saved, remaining: saved === null ? null : price - saved,
      estimate: ledger ? trailForecast(needed - cents(ledger.total), rhythm) : undefined,
    };
  });

  async function remove(goal: Goal) {
    if (removing || !window.confirm('Excluir a meta ' + goal.nome + '?')) return;
    setRemoving(goal.id);
    try {
      await PurchaseGoalsService.deleteGoal(goal.id, userId);
      await load();
    } catch {
      setError('Não foi possível excluir a meta.');
    } finally {
      setRemoving(undefined);
    }
  }

  return <section className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">Metas de compra</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Planeje compras e acompanhe o dinheiro reservado para elas.</p>
      </div>
      <button type="button" className={primary} onClick={() => setGoalForm('new')}><Plus size={16} />Nova meta</button>
    </div>
    {error && <div role="alert" className="flex flex-wrap items-center gap-2 rounded-xl border border-red-200 p-3 text-sm dark:border-red-900">
      {error}<button type="button" className={secondary} onClick={() => void load()}>Tentar novamente</button>
    </div>}
    {!snapshot && !error && <p role="status" className="text-sm">Carregando metas de compra…</p>}
    {snapshot && <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Saldo reservado para compras</p>
          <p className="text-xl font-bold">{ledger ? formatCurrency(ledger.total) : 'Indisponível'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={primary} disabled={!ledger} onClick={() => setMovement('aporte')}>Guardar dinheiro</button>
          <button type="button" className={secondary} disabled={!ledger || ledger.total <= 0} onClick={() => setMovement('retirada')}>Retirar</button>
        </div>
      </div>
      {ledgerUnavailable && <p role="status" className="rounded-xl border border-amber-200 p-3 text-sm dark:border-amber-900">
        O saldo das metas está indisponível. O cadastro de metas continua disponível.
      </p>}
      {products.length ? <ul className="space-y-3">
        {products.map(({ goal, saved, remaining, estimate }) => <li key={goal.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <PurchaseImage url={goal.imagemUrl} />
              </span>
              <div className="min-w-0 break-words">
                <h2 className="font-bold">{goal.nome}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">{formatCurrency(goal.preco)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" className={secondary} onClick={() => setGoalForm(goal)} aria-label={'Editar ' + goal.nome}><Pencil size={16} /></button>
              <button type="button" className={secondary} disabled={Boolean(removing)} onClick={() => void remove(goal)}
                aria-label={'Excluir ' + goal.nome}><Trash2 size={16} /></button>
            </div>
          </div>
          {saved !== null && remaining !== null && <div className="mt-3 space-y-2">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span>{formatCurrency(saved / 100)} guardados</span>
              <span>{remaining === 0 ? 'Valor completo' : 'Faltam ' + formatCurrency(remaining / 100)}</span>
            </div>
            <progress className="block h-2 w-full accent-emerald-700" max={Math.max(1, cents(goal.preco))}
              value={saved} aria-label={'Valor guardado para ' + goal.nome} />
            {remaining > 0 && <p className="text-xs text-slate-600 dark:text-slate-400">{estimate ? 'Previsão · ' + formatDate(estimate) : 'Previsão disponível após registrar aportes suficientes.'}</p>}
          </div>}
        </li>)}
      </ul> : <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm dark:border-slate-700">Nenhuma meta de compra cadastrada.</p>}
    </>}
    {goalForm && <GoalFormModal isOpen editingGoal={goalForm === 'new' ? undefined : goalForm} onClose={() => setGoalForm(undefined)}
      onSave={async goal => {
        await PurchaseGoalsService.saveGoal(userId, goal, goalForm === 'new' ? undefined : goalForm.id);
        await load();
      }} />}
    {movement && ledger && <Activity mode={visible ? 'visible' : 'hidden'}>
      <TrailMovementModal classic kind={movement} total={ledger.total} onClose={() => setMovement(undefined)}
        onSave={async value => { await PurchaseGoalsService.saveTrailMovement(userId, value); await load(); }} />
    </Activity>}
  </section>;
}

export function ClassicPurchaseGoals({ visible }: { visible: boolean }) {
  const { currentUser, authReady, setAuthModalOpen } = useApp();
  if (!authReady) return <p role="status">Carregando sua conta…</p>;
  if (currentUser) return <PurchaseList key={currentUser.id} userId={currentUser.id} visible={visible} />;
  return <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <Cloud size={26} aria-hidden="true" />
    <h1 className="text-2xl font-bold">Metas de compra</h1>
    <p className="text-sm text-slate-600 dark:text-slate-300">Conecte sua conta para consultar e registrar metas de compra.</p>
    <button type="button" className={primary} onClick={() => setAuthModalOpen(true)}>Conectar conta</button>
  </section>;
}
