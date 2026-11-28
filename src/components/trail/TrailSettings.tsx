import { useState } from 'react';
import type { FormEvent } from 'react';
import { unlockableItems } from '../../data/avatarOptions';
import type { Rank, TrailPreferences } from '../../types';
import { enableCelebrationSound } from './TrailCelebration';
import { TrailDialog, trailButton, trailInput, trailSecondary } from './TrailDialog';

export function TrailSettings({ preferences, ranks, onSave, onClose }: {
  preferences: TrailPreferences; ranks: Rank[]; onSave: (settings: TrailPreferences) => Promise<void>; onClose: () => void;
}) {
  const [draft, setDraft] = useState(preferences);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported');
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.limites.every((value, index) => Number.isFinite(value) && value >= (index ? draft.limites[index - 1] : 0))) {
      setError('Informe limites de raridade em ordem crescente.');
      return;
    }
    setBusy(true);
    try { await onSave(draft); onClose(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao salvar as preferências.'); }
    finally { setBusy(false); }
  };
  return <TrailDialog title="Preferências da Trilha" onClose={onClose} busy={busy}>
    <form onSubmit={event => void save(event)} className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={draft.som} onChange={event => {
            if (event.target.checked) enableCelebrationSound();
            setDraft({ ...draft, som: event.target.checked });
          }} /> Som de comemoração
        </label>
        {permission === 'default' ? <button type="button" className={trailSecondary} onClick={() => {
          void Notification.requestPermission().then(setPermission).catch(() => setPermission('unsupported'));
        }}>Ativar notificações do navegador</button> :
          <span className="text-xs text-slate-500">{permission === 'granted' ? 'Notificações permitidas' : 'Notificações indisponíveis no navegador'}</span>}
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-bold">Limites de raridade · R$</legend>
        {['Comum até', 'Rara até', 'Épica até'].map((label, index) => <label key={label} className="grid grid-cols-2 items-center gap-2 text-sm">{label}
          <input type="number" min={0} step=".01" required className={trailInput} value={draft.limites[index]} onChange={event => {
            const limits = [...draft.limites] as TrailPreferences['limites'];
            limits[index] = Number(event.target.value);
            setDraft({ ...draft, limites: limits });
          }} />
        </label>)}
        <p className="text-xs text-slate-500">Valores acima do limite épico são lendários. Os limites valem para novas conquistas.</p>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-bold">Itens do personagem por patente</legend>
        {Object.entries(unlockableItems).map(([id, title]) => <label key={id} className="grid grid-cols-2 items-center gap-2 text-sm">{title}
          <select className={trailInput} value={draft.itensPorPatente[id] ?? ''} onChange={event => {
            setDraft({ ...draft, itensPorPatente: { ...draft.itensPorPatente, [id]: event.target.value } });
          }}>
            <option value="">Disponível para todos</option>
            {ranks.filter(rank => !rank.arquivada).map(rank => <option value={rank.id} key={rank.id}>{rank.nome}</option>)}
          </select>
        </label>)}
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button className={trailButton} disabled={busy}>Salvar preferências</button>
    </form>
  </TrailDialog>;
}
