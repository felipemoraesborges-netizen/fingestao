import { useState } from 'react';
import type { PlayAction, PlayState } from '../../learning/playContracts';
import { trailButton, trailSecondary } from '../trail/TrailDialog';

const panel = 'space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900';
const input = 'min-w-0 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950';
const codePattern = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
const leagues = ['Bronze', 'Prata', 'Ouro', 'Platina', 'Esmeralda', 'Rubi', 'Diamante', 'Lendária'];

export function PlayProfile({ state, busy, run }: {
  state: PlayState; busy: boolean; run: (action: PlayAction) => Promise<boolean>;
}) {
  const [alias, setAlias] = useState(state.apelido ?? '');
  const [friendCode, setFriendCode] = useState('');
  const [time, setTime] = useState(state.horario);
  const [message, setMessage] = useState('');
  const league = leagues[Math.min(leagues.length - 1, Math.floor((state.nivel - 1) / 13))];
  return <div className="grid gap-4 xl:grid-cols-2">
    <section className={panel}>
      <h2 className="text-lg font-bold">Ranking entre amigos</h2>
      <p className="text-sm">O placar semanal usa XP de estudo. Só amizades aceitas participam.</p>
      <form className="space-y-2" onSubmit={event => { event.preventDefault(); void run({ type: 'profile', ranking: true, alias }); }}>
        <label className="block text-sm font-semibold">Apelido opcional
          <input className={input} value={alias} minLength={3} maxLength={32} onChange={event => setAlias(event.currentTarget.value)} placeholder="Em branco para usar um pseudônimo" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={trailButton} disabled={busy}>{state.ranking ? 'Salvar apelido' : 'Participar do ranking'}</button>
          {state.ranking && <button type="button" className={trailSecondary} disabled={busy} onClick={() => void run({ type: 'profile', ranking: false })}>Sair do ranking</button>}
        </div>
      </form>
      {state.ranking && state.codigo && <>
        <p className="font-semibold">Liga {league}</p>
        <label className="block text-sm font-semibold">Seu código de amizade<input className={input} readOnly value={state.codigo} onFocus={event => event.currentTarget.select()} /></label>
        <form className="space-y-2" onSubmit={event => {
          event.preventDefault();
          void run({ type: 'invite', code: friendCode.trim() }).then(success => { if (success) { setFriendCode(''); setMessage('Solicitação registrada.'); } });
        }}>
          <label className="block text-sm font-semibold">Código de um amigo<input className={input} value={friendCode} pattern={codePattern}
            required maxLength={36} onChange={event => { setFriendCode(event.currentTarget.value); setMessage(''); }} /></label>
          <button type="submit" className={trailSecondary} disabled={busy}>Convidar</button>
        </form>
        {message && <p role="status" className="text-sm">{message}</p>}
        <h3 className="font-bold">Amizades e convites</h3>
        {state.amigos.length ? <ul className="space-y-2">{state.amigos.map(friend => <li className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-700" key={friend.id}>
          <span>{friend.apelido}{friend.estado === 'pendente' && (friend.recebida ? ' · convite recebido' : ' · enviado')}</span>
          <div className="flex gap-2">{friend.estado === 'pendente' && friend.recebida ? <>
            <button type="button" className={trailButton} disabled={busy} onClick={() => void run({ type: 'friend', id: friend.id, decision: 'accept' })}>Aceitar</button>
            <button type="button" className={trailSecondary} disabled={busy} onClick={() => void run({ type: 'friend', id: friend.id, decision: 'decline' })}>Recusar</button>
          </> : <button type="button" className={trailSecondary} disabled={busy} onClick={() => void run({ type: 'friend', id: friend.id, decision: 'remove' })}>{friend.estado === 'aceita' ? 'Remover amizade' : 'Cancelar convite'}</button>}</div>
        </li>)}</ul> : <p className="text-sm">Compartilhe seu código com alguém para começar.</p>}
        <h3 className="font-bold">XP de estudo da semana</h3>
        <ol className="list-decimal space-y-1 pl-5">{state.placar.map((line, index) => <li key={index}>{line.apelido}{line.eu ? ' (você)' : ''} · <strong>{line.xp} XP</strong></li>)}</ol>
      </>}
    </section>
    <section className={panel}>
      <h2 className="text-lg font-bold">Lembrete de estudo</h2>
      <p className="text-sm">O lembrete aparece dentro do FinGestão Play, no horário de São Paulo, se você ainda não tiver estudado no dia.</p>
      <form className="space-y-2" onSubmit={event => { event.preventDefault(); if (time) void run({ type: 'profile', reminder: true, time }); }}>
        <label className="block text-sm font-semibold">Horário do lembrete
          <input type="time" className={input} value={time} required onChange={event => setTime(event.currentTarget.value)} />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={trailButton} disabled={busy}>{state.lembrete ? 'Salvar horário' : 'Ativar lembrete'}</button>
          {state.lembrete && <button type="button" className={trailSecondary} disabled={busy} onClick={() => void run({ type: 'profile', reminder: false })}>Desativar lembrete</button>}
        </div>
      </form>
    </section>
  </div>;
}
