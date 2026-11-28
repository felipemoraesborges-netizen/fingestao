import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { ModeSwitch } from '../layout/ModeControls';

export const trailButton = 'inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-3 py-2 text-sm font-bold text-white hover:bg-violet-600 disabled:opacity-50';
export const trailSecondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 disabled:opacity-50';
export const trailInput = 'min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900';

export function TrailDialog({ title, onClose, children, wide = false, busy = false }: {
  title: string; onClose: () => void; children: ReactNode; wide?: boolean; busy?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={event => {
    event.preventDefault();
    if (!busy) onClose();
  }} className={'m-auto max-h-[90dvh] w-[calc(100%-2rem)] rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl backdrop:bg-slate-950/65 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:p-6 ' + (wide ? 'max-w-3xl' : 'max-w-lg')}>
    <div className="mb-4 flex items-start justify-between gap-3">
      <h2 id={titleId} className="text-xl font-black">{title}</h2>
      <button type="button" aria-label="Fechar" onClick={onClose} disabled={busy} className={trailSecondary}><X size={17} /></button>
    </div>
    {!busy && <div className="mb-4"><ModeSwitch /></div>}
    {children}
  </dialog>;
}
