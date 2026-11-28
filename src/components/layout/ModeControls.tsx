import { useEffect, useId, useRef } from 'react';
import { useMode } from '../../context/ModeContext';

const neutralButton = 'rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800';

export function ModeSwitch() {
  const { mode, ready, preferences, chooseMode } = useMode();
  if (!ready || !preferences.gameEnabled) return null;
  return <div role="group" aria-label="Modo de uso" className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
    {([{ id: 'classico', label: 'Profissional' }, { id: 'jogo', label: 'Jogo' }] as const).map(({ id, label }) =>
      <button key={id} type="button" aria-pressed={mode === id} onClick={() => chooseMode(id)}
        className={'rounded-md px-3 py-1.5 text-xs font-bold ' + (mode === id
          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
          : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white')}>
        {label}
      </button>)}
  </div>;
}

export function ModeBar() {
  const { ready, preferences, canReturnToGame, returnToGame } = useMode();
  if (!ready || !preferences.gameEnabled) return null;
  return <div className="sticky top-0 z-[65] h-12 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
      <ModeSwitch />
      {canReturnToGame && <button type="button" onClick={returnToGame} className={neutralButton}>Voltar ao Jogo</button>}
    </div>
  </div>;
}

export function ModeOnboarding() {
  const { chooseMode } = useMode();
  const ref = useRef<HTMLDialogElement>(null);
  const title = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} aria-labelledby={title} onCancel={event => {
    event.preventDefault();
    chooseMode('classico');
  }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-950/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
    <h1 id={title} className="text-xl font-bold">Como você quer usar o FinGestão?</h1>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Você pode mudar de modo quando quiser.</p>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={() => chooseMode('classico')} className={neutralButton + ' p-3 text-left'}>
        <span className="block font-bold">Modo Profissional</span>
        <span className="mt-1 block text-xs font-normal">Organize gastos, orçamentos e metas de forma direta.</span>
      </button>
      <button type="button" onClick={() => chooseMode('jogo')} className={neutralButton + ' p-3 text-left'}>
        <span className="block font-bold">Modo Jogo</span>
        <span className="mt-1 block text-xs font-normal">Explore metas em tabuleiro e aprenda no seu ritmo.</span>
      </button>
    </div>
    <button type="button" onClick={() => chooseMode('classico')} className="mt-4 text-sm font-semibold underline">Pular e continuar no Profissional</button>
  </dialog>;
}

export function ModeSettings() {
  const { ready, preferences, canSaveLibrary, setGameEnabled, setLibraryVisible, preferencesError } = useMode();
  return <section aria-labelledby="preferencias-exibicao" className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <h2 id="preferencias-exibicao" className="font-bold">Preferências de exibição</h2>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={!ready} className={neutralButton + ' disabled:opacity-50'}
        onClick={() => setGameEnabled(!preferences.gameEnabled)}>
        {preferences.gameEnabled ? 'Desativar o Modo Jogo' : 'Ativar o Modo Jogo'}
      </button>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={preferences.libraryVisible} disabled={!ready || !canSaveLibrary}
          onChange={event => setLibraryVisible(event.target.checked)} />
        Mostrar biblioteca de educação financeira
      </label>
    </div>
    {!canSaveLibrary && ready && <p className="text-sm text-slate-600 dark:text-slate-300">A preferência da biblioteca requer a atualização do Supabase.</p>}
    {preferencesError && <p role="status" className="text-sm text-amber-800 dark:text-amber-300">{preferencesError}</p>}
  </section>;
}
