import { useState } from 'react';
import type { Achievement } from '../../types';
import type { useAchievements } from '../../hooks/useAchievements';
import { TrailDialog, trailButton, trailInput, trailSecondary } from '../trail/TrailDialog';
import { AchievementIconSelect } from './AchievementIconSelect';
import { rarityLabels } from './AchievementCard';

export function AchievementEditModal({ item, onClose, actions }: {
  item?: Achievement; onClose: () => void; actions: ReturnType<typeof useAchievements>;
}) {
  const [draft, setDraft] = useState<Omit<Achievement, 'id' | 'createdAt'>>(item ?? {
    titulo: '', raridade: 'comum', personalizada: true, oculta: false, iconeNome: 'Trophy',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const execute = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try { await action(); onClose(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao salvar a conquista.'); }
    finally { setBusy(false); }
  };
  return <TrailDialog title={item ? 'Editar conquista' : 'Conquista manual'} onClose={onClose} busy={busy}>
    <form className="space-y-3" onSubmit={event => {
      event.preventDefault();
      void execute(() => actions.save({ ...draft, desbloqueadaEm: item ? draft.desbloqueadaEm : new Date().toISOString() }, item?.id));
    }}>
      <label className="grid gap-1 text-sm font-semibold">Título<input required className={trailInput} value={draft.titulo} onChange={event => setDraft({ ...draft, titulo: event.target.value })} /></label>
      <label className="grid gap-1 text-sm font-semibold">Descrição<textarea className={trailInput} value={draft.descricao ?? ''} onChange={event => setDraft({ ...draft, descricao: event.target.value })} /></label>
      <label className="grid gap-1 text-sm font-semibold">Frase pessoal<input className={trailInput} value={draft.frasePessoal ?? ''} onChange={event => setDraft({ ...draft, frasePessoal: event.target.value })} /></label>
      <label className="grid gap-1 text-sm font-semibold">Raridade<select className={trailInput} value={draft.raridade} onChange={event => setDraft({ ...draft, raridade: event.target.value as Achievement['raridade'] })}>
        {Object.entries(rarityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select></label>
      <AchievementIconSelect value={draft.iconeNome ?? 'Trophy'} onChange={iconeNome => setDraft({ ...draft, iconeNome })} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.oculta} onChange={event => setDraft({ ...draft, oculta: event.target.checked })} /> Ocultar da galeria</label>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button className={trailButton} disabled={busy}>Salvar</button>
        {item && <button type="button" className={trailSecondary + ' text-red-700 dark:text-red-300'} disabled={busy} onClick={() => {
          if (window.confirm('Remover esta conquista da galeria e da contagem de patentes?')) void execute(() => actions.remove(item.id));
        }}>Excluir</button>}
      </div>
    </form>
  </TrailDialog>;
}
