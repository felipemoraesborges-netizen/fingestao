import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Plus, Settings } from 'lucide-react';
import type { AvatarConfig } from '../../data/avatarOptions';
import type { useGoals } from '../../hooks/useGoals';
import type { useRanks } from '../../hooks/useRanks';
import type { ContributionType, Goal, UserProgress } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { calculateTrail, MAX_MONEY } from '../../utils/trail';
import { RankBadge } from '../common/RankBadge';
import { ContributionModal } from './ContributionModal';
import { GoalCard } from './GoalCard';
import { GoalFormModal } from './GoalFormModal';
import { Personagem } from './Personagem';
import { TrailBoard } from './TrailBoard';
import { trailButton, trailInput, trailSecondary } from './TrailDialog';

interface Props {
  goals: Goal[];
  progress: UserProgress;
  rank: ReturnType<typeof useRanks>;
  trail: ReturnType<typeof calculateTrail>;
  total: number | null;
  displayedHouse: number;
  avatar: AvatarConfig;
  actions: ReturnType<typeof useGoals>;
  onValue: (value: number) => Promise<void>;
  onAvatar: () => void;
  onSettings: () => void;
  onMovement: (kind: ContributionType) => void;
  onHistory: () => void;
  highlight?: string;
}

export function TrailView({ goals, progress, rank, trail, total, displayedHouse, avatar, actions, onValue, onAvatar, onSettings, onMovement, onHistory, highlight }: Props) {
  const [form, setForm] = useState<Goal | 'new'>();
  const [contribution, setContribution] = useState<Goal>();
  const [draft, setDraft] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const next = trail.next;
  const deleteGoal = async (id: string) => {
    if (!window.confirm('Excluir este produto e seus movimentos manuais? A conquista já registrada permanece na galeria.')) return;
    try { await actions.remove(id); setError(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao excluir o produto.'); }
  };

  return <div className="space-y-5">
    <header className="flex flex-wrap justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">Metas</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">O dinheiro que você guarda aqui move o personagem.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className={trailSecondary} onClick={onAvatar}><span className="grid h-6 items-center"><Personagem config={avatar} tamanho={21} /></span> Meu Personagem</button>
        <button className={trailSecondary} onClick={onSettings} aria-label="Preferências da Trilha" title="Preferências da Trilha"><Settings size={18} /></button>
        <button className={trailButton} onClick={() => setForm('new')}><Plus size={17} /> Novo produto</button>
      </div>
    </header>
    <section className="sticky top-[var(--app-mode-offset,0px)] z-10 rounded-2xl border border-violet-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur dark:border-violet-900 dark:bg-slate-900/95 sm:px-4">
      <div className="grid grid-cols-2 items-center gap-x-3 gap-y-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total guardado</p>
          <p className="text-base font-black text-violet-800 dark:text-violet-300 sm:text-xl">{total === null ? 'Indisponível' : formatCurrency(total)}</p>
        </div>
        <div>
          <p className="text-sm font-black">Casa {trail.house.toLocaleString('pt-BR')}</p>
          {total !== null && <p className="text-xs text-slate-600 dark:text-slate-400">Mais {formatCurrency(trail.nextHouseAmount)} para a próxima</p>}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Próximo produto</p>
          <p className="truncate text-sm font-bold" title={next?.goal.nome}>{next?.goal.nome ?? 'Sem produto pendente'}</p>
          {next && total !== null && <p className="text-xs text-slate-600 dark:text-slate-400">
            {(next.house - trail.house).toLocaleString('pt-BR')} casas · {formatCurrency(Math.max(0, next.target - total))}
            {next.expectedOn && <span className="block" title="Projeção pelo ritmo líquido de aportes da Trilha">Previsão {formatDate(next.expectedOn)}</span>}
          </p>}
        </div>
        <div className="min-w-0">
          <RankBadge rank={rank.current ?? null} size="sm" />
          {rank.next && <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            <progress value={rank.percent} max={100} className="block h-1.5 w-full accent-violet-600" aria-label="Progresso da patente" />
            {rank.remaining === 1 ? 'Falta 1 conquista' : 'Faltam ' + rank.remaining + ' conquistas'} para {rank.next.nome}
          </div>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={trailButton} disabled={total === null} onClick={() => onMovement('aporte')}>
          <ArrowDownToLine size={16} /> Guardar dinheiro
        </button>
        <button type="button" className={trailSecondary} disabled={total === null || total <= 0} onClick={() => onMovement('retirada')}>
          <ArrowUpFromLine size={16} /> Retirar
        </button>
        <button type="button" className={trailSecondary} onClick={onHistory}>Histórico de aportes</button>
      </div>
    </section>
    <div className="flex flex-wrap items-end justify-between gap-2">
      <form className="flex flex-wrap items-end gap-2" onSubmit={event => {
        event.preventDefault();
        setBusy(true);
        setError('');
        void onValue(Number(draft ?? progress.valorCasa)).then(() => setDraft(undefined))
          .catch(reason => setError(reason instanceof Error ? reason.message : 'Falha ao salvar o valor.')).finally(() => setBusy(false));
      }}>
        <label className="grid gap-1 text-xs font-semibold">Valor por casa · R$
          <input aria-label="Valor por casa em reais" className={trailInput + ' w-32'} type="number" min=".01" max={MAX_MONEY} step=".01"
            required value={draft ?? progress.valorCasa} onChange={event => setDraft(event.target.value)} />
        </label>
        <button className={trailSecondary} disabled={busy || draft === undefined}>Salvar valor</button>
      </form>
    </div>
    {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    {total === 0 && <p role="status" className="rounded-2xl border border-dashed border-violet-300 p-4 text-sm font-semibold dark:border-violet-800">
      Faça seu primeiro aporte para começar a andar
    </p>}
    <TrailBoard products={trail.products} house={displayedHouse} target={trail.house} avatar={avatar} onAvatar={onAvatar}
      onProduct={item => setForm(item.goal)} highlight={highlight} />
    {!goals.length && <div className="rounded-2xl border border-dashed border-violet-300 p-4 text-sm dark:border-violet-800">
      <button className="font-bold text-violet-700 underline dark:text-violet-300" onClick={() => setForm('new')}>Cadastre o primeiro produto</button>
      {' '}para colocá-lo no tabuleiro.
    </div>}
    {goals.length > 0 && <details className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <summary className="cursor-pointer text-sm font-bold">Gerenciar produtos e movimentos por meta ({goals.length})</summary>
      <p className="my-3 text-sm text-slate-600 dark:text-slate-400">Os movimentos por produto mantêm seu histórico nas metas de compra. Use Guardar dinheiro para movimentar o saldo do tabuleiro.</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {trail.products.map(({ goal, expectedOn }, index) => <GoalCard key={goal.id} goal={goal} index={index} expectedOn={expectedOn} onAddContribution={setContribution} onEdit={setForm} onDelete={id => void deleteGoal(id)} />)}
      </div>
    </details>}
    {form && <GoalFormModal isOpen onClose={() => setForm(undefined)} editingGoal={form === 'new' ? undefined : form}
      onSave={data => actions.save(data, form === 'new' ? undefined : form.id)} />}
    {contribution && <ContributionModal isOpen goal={contribution} onClose={() => setContribution(undefined)}
      onSave={(goalId, valor, tipo, data, nota) => actions.contribute({ goalId, valor, tipo, data, nota })} />}
  </div>;
}
