import { useState } from 'react';
import { Lock, Pencil, Plus, Shield } from 'lucide-react';
import type { AvatarConfig } from '../../data/avatarOptions';
import type { useRanks } from '../../hooks/useRanks';
import type { Rank, RankHistory, UserProgress } from '../../types';
import { RankBadge } from '../common/RankBadge';
import { AchievementIconSelect } from '../achievements/AchievementIconSelect';
import { Personagem } from '../trail/Personagem';
import { TrailDialog, trailButton, trailInput, trailSecondary } from '../trail/TrailDialog';

type RankDraft = Pick<Rank, 'nome' | 'cor' | 'iconeUrl' | 'conquistasNecessarias'>;

function RankEditor({ rank, onClose, onSave }: {
  rank?: Rank; onClose: () => void; onSave: (value: RankDraft, id?: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<RankDraft>(rank ?? { nome: '', cor: '#7254c7', conquistasNecessarias: 1 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const color = /^#[0-9a-f]{6}$/i.test(draft.cor) ? draft.cor : '#7254c7';
  return <TrailDialog title={rank ? 'Editar patente' : 'Nova patente'} onClose={onClose} busy={busy}>
    <form className="space-y-4" onSubmit={event => {
      event.preventDefault();
      setBusy(true);
      void onSave({ ...draft, cor: color }, rank?.id).then(onClose)
        .catch(reason => setError(reason instanceof Error ? reason.message : 'Falha ao salvar.')).finally(() => setBusy(false));
    }}>
      <label className="grid gap-1 text-sm font-semibold">Nome<input required className={trailInput} value={draft.nome} onChange={event => setDraft({ ...draft, nome: event.target.value })} /></label>
      <label className="flex items-center gap-2 text-sm font-semibold">Cor <input type="color" value={color} onChange={event => setDraft({ ...draft, cor: event.target.value })} /></label>
      <label className="grid gap-1 text-sm font-semibold">Conquistas necessárias<input required type="number" min={0} step={1} max={2_147_483_647} className={trailInput}
        value={draft.conquistasNecessarias} onChange={event => setDraft({ ...draft, conquistasNecessarias: event.target.valueAsNumber })} /></label>
      <AchievementIconSelect value={draft.iconeUrl ?? ''} onChange={iconeUrl => setDraft({ ...draft, iconeUrl })} />
      {draft.iconeUrl && <button type="button" className={trailSecondary} onClick={() => setDraft({ ...draft, iconeUrl: undefined })}>Usar emblema padrão</button>}
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div><button className={trailButton} disabled={busy}>Salvar patente</button></div>
    </form>
  </TrailDialog>;
}

export function RanksView({ ranks, rank, progress, history, avatar, onSave, onArchive, onDowngrade }: {
  ranks: Rank[]; rank: ReturnType<typeof useRanks>; progress: UserProgress; history: RankHistory[]; avatar: AvatarConfig;
  onSave: (value: RankDraft, id?: string) => Promise<void>; onArchive: (id: string) => Promise<void>; onDowngrade: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<Rank | 'new'>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const reached = new Set(history.map(item => item.rankId));
  const status = rank.current;
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try { await action(); setError(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao atualizar a patente.'); }
    finally { setBusy(false); }
  };

  return <section className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <h1 className="flex items-center gap-2 text-2xl font-black"><Shield size={25} className="text-violet-600" /> Patentes</h1>
      <button type="button" className={trailButton} onClick={() => setEditing('new')}><Plus size={17} /> Nova patente</button>
    </div>
    <div className="flex flex-wrap items-center gap-5 rounded-3xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-900 dark:bg-violet-950/35">
      <Personagem config={avatar} tamanho={68} />
      <div className="min-w-0 grow space-y-2">
        <RankBadge rank={status ?? null} size="lg" nivel={progress.nivel} xp={progress.xp} />
        <p className="text-sm font-semibold">{rank.count} conquistas visíveis · {progress.xp.toLocaleString('pt-BR')} XP</p>
        {rank.next && <>
          <progress value={rank.percent} max={100} className="block h-2 w-full accent-violet-600" aria-label="Progresso da próxima patente" />
          <p className="text-sm">{rank.remaining === 1 ? 'Falta 1 conquista' : 'Faltam ' + rank.remaining + ' conquistas'} para {rank.next.nome}.</p>
        </>}
        {status && status.id !== rank.eligible?.id && <button type="button" className={trailSecondary} disabled={busy} onClick={() => {
          if (window.confirm('Deseja ajustar sua patente atual à contagem de conquistas? O histórico será preservado.')) void run(onDowngrade);
        }}>Confirmar rebaixamento</button>}
      </div>
    </div>
    {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    {ranks.every(item => item.arquivada) && <p className="text-sm">Adicione uma patente ou cadastre as patentes padrão no Supabase.</p>}
    <ol className="grid gap-2">
      {ranks.filter(item => !item.arquivada).map((item, index) => {
        const unlocked = reached.has(item.id) || Boolean(status && item.ordem <= status.ordem);
        return <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-white p-3 dark:bg-slate-900"
          style={{ marginInlineStart: Math.min(index, 7) * 5, borderColor: unlocked ? item.cor : '#94a3b855' }}>
          <div className="flex flex-wrap items-center gap-2">
            {!unlocked && <Lock size={16} aria-label="Bloqueada" />}
            <RankBadge rank={item} />
            <span className="text-sm">{item.conquistasNecessarias} conquistas{item.id === status?.id ? ' · Atual' : ''}</span>
          </div>
          <div className="flex gap-2">
            <button type="button" className={trailSecondary} onClick={() => setEditing(item)} aria-label={'Editar ' + item.nome}><Pencil size={16} /></button>
            <button type="button" className={trailSecondary} disabled={busy} onClick={() => {
              const message = item.id === status?.id ? 'Remover a patente atual e recalcular sua classificação? O histórico será preservado.' : 'Remover esta patente da escada? O histórico será preservado.';
              if (window.confirm(message)) void run(() => onArchive(item.id));
            }}>Remover</button>
          </div>
        </li>;
      })}
    </ol>
    {history.length > 0 && <details className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      <summary className="cursor-pointer font-bold">Histórico de patentes</summary>
      <ul className="mt-3 space-y-2 text-sm">{[...history].reverse().map(entry => <li key={entry.id}>
        {ranks.find(item => item.id === entry.rankId)?.nome ?? 'Patente anterior'} · {new Date(entry.alcancadaEm).toLocaleDateString('pt-BR')}
      </li>)}</ul>
    </details>}
    {editing && <RankEditor rank={editing === 'new' ? undefined : editing} onClose={() => setEditing(undefined)} onSave={onSave} />}
  </section>;
}
