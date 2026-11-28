import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Calculator, ChartNoAxesCombined, Check, Coins, Compass, CreditCard, Flame, Heart, List, Lock, Medal, PiggyBank, Shield, ShieldCheck, ShoppingBag, Snowflake, Star, Zap } from 'lucide-react';
import { educationNotice } from '../../learning/contracts';
import type { ActiveLesson, LearningAction, LearningSnapshot, LessonCard, PracticeTool, StudyMode } from '../../learning/contracts';
import { sendLearningAction } from '../../services/learningService';
import type { AvatarConfig } from '../../data/avatarOptions';
import { useAppSearch } from '../../navigation/appRoutes';
import { Personagem } from '../trail/Personagem';
import { trailButton, trailSecondary } from '../trail/TrailDialog';
import { StudyStep } from './StudyStep';

const panel = 'rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5';
const muted = 'text-sm text-slate-600 dark:text-slate-300';
const progressTrack = 'h-2 w-full appearance-none overflow-hidden rounded-full bg-slate-200 align-middle dark:bg-slate-700 [&::-moz-progress-bar]:bg-violet-700 [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:bg-violet-700 dark:[&::-moz-progress-bar]:bg-violet-400 dark:[&::-webkit-progress-value]:bg-violet-400';
const modeName: Record<StudyMode, string> = { normal: 'Lição', treinar: 'Treinar', revisar: 'Revisão' };
const worldIcons = { compass: Compass, calculator: Calculator, list: List, shield: Shield, 'credit-card': CreditCard,
  'piggy-bank': PiggyBank, 'chart-no-axes-combined': ChartNoAxesCombined, 'shield-check': ShieldCheck, 'shopping-bag': ShoppingBag };
type Command = Exclude<LearningAction, { action: 'expense' }>;

function Stars({ count }: { count: number }) {
  return <span role="img" aria-label={`${count} de 3 estrelas`} className="inline-flex shrink-0 gap-1 text-amber-700 dark:text-amber-300">
    {Array.from({ length: 3 }, (_, index) => <Star key={index} size={17} fill={index < count ? 'currentColor' : 'none'} aria-hidden="true" />)}
  </span>;
}

function Stats({ player }: { player: LearningSnapshot['player'] }) {
  return <section aria-label="Seu progresso" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <div className={panel}><p className="flex items-center gap-2 font-bold"><Zap size={18} className="text-violet-700 dark:text-violet-400" aria-hidden="true" />{player.xpToday} XP hoje</p>
      <p className={muted}>Nível {player.level} · {player.xp.toLocaleString('pt-BR')} XP total</p></div>
    <div className={panel}><p className="flex items-center gap-2 font-bold"><Flame size={18} className="text-orange-700 dark:text-orange-400" aria-hidden="true" />{player.streak} {player.streak === 1 ? 'dia seguido' : 'dias seguidos'}</p>
      <p className={muted}>Recorde de {player.bestStreak} dias</p>
      <p className={'flex items-center gap-1 ' + muted} title="Protege a sequência quando você deixa passar um dia"><Snowflake size={16} aria-hidden="true" />{player.freezes} {player.freezes === 1 ? 'congelamento' : 'congelamentos'}</p></div>
    <div className={panel}><p className="flex items-center gap-2 font-bold"><Coins size={18} className="text-amber-700 dark:text-amber-300" aria-hidden="true" />{player.coins.toLocaleString('pt-BR')} fincoins</p></div>
    <div className={panel}>
      <div className="flex gap-1 text-rose-700 dark:text-rose-400" role="img" aria-label={`${player.lives} de 5 vidas`}>
        {Array.from({ length: 5 }, (_, index) => <Heart key={index} size={20} fill={index < player.lives ? 'currentColor' : 'none'} aria-hidden="true" />)}
      </div>
      <p className={'mt-1 ' + muted}>{player.nextLifeAt ? <>Próxima vida às <time dateTime={player.nextLifeAt}>{new Date(player.nextLifeAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time></> : 'Vidas completas'}</p>
    </div>
  </section>;
}

function LessonTile({ lesson, lives, busy, onStart }: {
  lesson: LessonCard; lives: number; busy: boolean; onStart: (mode: StudyMode) => void;
}) {
  const Icon = lesson.locked ? Lock : lesson.exam ? Medal : BookOpen;
  return <li className={panel}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <h3 className="flex items-center gap-2 text-lg font-bold"><Icon className="shrink-0 text-violet-700 dark:text-violet-300" size={19} aria-hidden="true" />{lesson.title}</h3>
      {lesson.stars > 0 && <Stars count={lesson.stars} />}
    </div>
    <p className={'mt-1 ' + muted}>{lesson.objective}</p>
    <p className={'mt-2 ' + muted}>{lesson.minutes} min{lesson.reviewDue > 0 ? ` · ${lesson.reviewDue} para revisar` : ''}</p>
    {lesson.locked ? <p className={'mt-3 ' + muted}>Complete {lesson.exam ? 'as lições do mundo' : 'a lição anterior'} para liberar.</p> :
      <div className="mt-3 flex flex-wrap gap-2">
        {lesson.resumable ? <button type="button" className={trailButton} disabled={busy} onClick={() => onStart('normal')}>Continuar</button> : <>
          {lives > 0 && <button type="button" className={trailButton} disabled={busy} onClick={() => onStart('normal')}>{lesson.stars ? 'Refazer lição' : 'Começar'}</button>}
          <button type="button" className={lives ? trailSecondary : trailButton} disabled={busy} onClick={() => onStart('treinar')}>Treinar</button>
          {lesson.stars > 0 && (!lesson.exam || lesson.score >= 60) && <button type="button" className={trailSecondary} disabled={busy} onClick={() => onStart('revisar')}>Revisar</button>}
        </>}
      </div>}
  </li>;
}

function LessonScreen({ active, avatar, pet, lives, busy, onAction, onBack, onPractice }: {
  active: ActiveLesson; avatar: AvatarConfig; pet: string; lives: number; busy: boolean;
  onAction: (action: Command) => void; onBack: () => void; onPractice: (tool: PracticeTool) => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const { lesson, mode, step, feedback, cursor, length, done, passed, retry, sessionId } = active;
  const position = { lessonId: lesson.id, sessionId, cursor };
  const blocked = mode === 'normal' && lives === 0;
  useEffect(() => { heading.current?.focus(); }, [sessionId, done, cursor]);

  return <section className={'mx-auto w-full max-w-3xl space-y-5 ' + panel}>
    <button type="button" className={trailSecondary} disabled={busy} onClick={onBack}><ArrowLeft size={17} aria-hidden="true" />Voltar ao mapa</button>
    <div>
      <p className={muted}>{modeName[mode]}</p>
      <h2 ref={heading} tabIndex={-1} className="text-2xl font-black outline-none">{lesson.title}</h2>
      <p className={muted}>{lesson.objective}</p>
    </div>
    <div className="flex items-center gap-3">
      <div className="relative shrink-0" aria-hidden="true"><Personagem config={feedback && !feedback.correct ? { ...avatar, rosto: 'tranquilo' } : avatar} tamanho={48}
        animacao={feedback?.correct || (done && passed) ? 'comemorando' : 'nenhuma'} />
        <img src={'/companheiros/' + pet + '.webp'} alt="" className="-mt-5 ml-4 h-10 w-10 object-contain" /></div>
      <div className="rounded-xl bg-violet-50 p-3 text-sm text-violet-950 dark:bg-violet-950 dark:text-violet-100" aria-live="polite" aria-atomic="true">
        {feedback ? <><p className="font-bold">{feedback.correct ? 'Você acertou!' : 'Quase lá!'}</p><p>{feedback.explanation}</p></> :
          done ? passed ? 'Lição concluída! Que tal usar o que aprendeu?' : 'Revise os conceitos e tente a prova de novo. Você precisa de 60% para passar.' :
          retry ? 'Hora de tentar esta pergunta de novo.' : step?.kind === 'note' ? 'Leia o exemplo antes de continuar.' : 'Use o que aprendeu para responder.'}
      </div>
    </div>
    {done ? <div className="space-y-3">
      <p className="flex flex-wrap items-center gap-2 font-bold"><Stars count={active.stars} />{active.score}% de acertos na primeira tentativa</p>
      <div className="flex flex-wrap gap-2">
        {passed ? <button type="button" className={trailButton} onClick={() => onPractice(lesson.practice)}>Praticar agora</button> :
          <button type="button" className={trailButton} disabled={busy} onClick={() => onAction({ action: 'start', lessonId: lesson.id, mode: lives ? 'normal' : 'treinar' })}>Tentar a prova de novo</button>}
      </div>
    </div> : <>
      <div>
        <p className={'mb-1 ' + muted}>Etapa {cursor + 1} de {length}{retry ? ' · Nova tentativa' : ''}</p>
        <progress aria-label="Progresso na lição" max={length} value={cursor + 1} className={progressTrack} />
      </div>
      {blocked && <div className="space-y-2 rounded-xl bg-amber-50 p-3 text-amber-950 dark:bg-amber-950 dark:text-amber-100">
        <p>Suas vidas acabaram. Você pode continuar daqui sem gastar vidas.</p>
        <button type="button" className={trailSecondary} disabled={busy} onClick={() => onAction({ action: 'train', lessonId: lesson.id, sessionId })}>Continuar no Treinar</button>
      </div>}
      {step?.kind === 'note' && <div className="space-y-2"><h3 className="text-xl font-bold">{step.prompt}</h3><p>{step.body}</p><p className={muted}>{step.example}</p></div>}
      {step && step.kind !== 'note' && !feedback && <StudyStep key={`${sessionId}:${cursor}`} step={step} busy={busy || blocked}
        onAnswer={answer => onAction({ action: 'answer', ...position, answer })} />}
      {(feedback || step?.kind === 'note') && <button type="button" className={trailButton} disabled={busy} onClick={() => onAction({ action: 'next', ...position })}>Continuar</button>}
    </>}
  </section>;
}

export function LearningView({ avatar, pet = 'finny', onPractice, onProgress }: {
  avatar: AvatarConfig; pet?: string; onPractice: (tool: PracticeTool) => void; onProgress: () => void;
}) {
  const [snapshot, setSnapshot] = useState<LearningSnapshot>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const selected = useRef<string>(undefined);
  const selectedWorld = useRef<string>(undefined);
  const requested = new URLSearchParams(useAppSearch()).get('licao') ?? undefined;
  const lastRequested = useRef<string>(undefined);
  const loading = useRef<AbortController>(undefined);
  const WorldIcon = snapshot?.world.icon && Object.hasOwn(worldIcons, snapshot.world.icon) ? worldIcons[snapshot.world.icon as keyof typeof worldIcons] : Compass;

  const load = useCallback(() => {
    if (running.current) return;
    if (lastRequested.current !== requested) {
      lastRequested.current = requested;
      if (requested) selected.current = requested;
    }
    loading.current?.abort();
    const controller = new AbortController();
    loading.current = controller;
    void sendLearningAction({ action: 'state', lessonId: selected.current, worldId: selectedWorld.current }, controller.signal).then(result => {
      if (!controller.signal.aborted) {
        setSnapshot(result);
        selectedWorld.current = result.world.id;
        setError('');
      }
    }, (reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o progresso.');
    });
  }, [requested]);

  useEffect(() => {
    load();
    return () => loading.current?.abort();
  }, [load]);

  const nextLife = snapshot?.player.nextLifeAt;
  useEffect(() => {
    if (!nextLife || error) return;
    const timer = window.setTimeout(load, Math.max(1_000, Date.parse(nextLife) - Date.now() + 500));
    return () => window.clearTimeout(timer);
  }, [error, load, nextLife]);

  async function command(action: Command) {
    if (running.current) return;
    loading.current?.abort();
    running.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await sendLearningAction(action);
      selected.current = result.active?.lesson.id;
      selectedWorld.current = result.world.id;
      setSnapshot(result);
      if (result.active?.done && action.action === 'next') onProgress();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o progresso.');
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  return <div className="space-y-4">
    <header><h1 className="text-2xl font-black sm:text-3xl">Aprender</h1><p className={muted}>{educationNotice}</p></header>
    {error && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-700 p-3 text-rose-900 dark:text-rose-200">
      <p>{error}</p><button type="button" className={trailSecondary} disabled={busy} onClick={load}>Tentar novamente</button>
    </div>}
    {!snapshot && !error && <p role="status" className={panel}>Carregando seu progresso…</p>}
    {snapshot && <>
      <Stats player={snapshot.player} />
      {snapshot.active ? <LessonScreen active={snapshot.active} avatar={avatar} pet={pet} lives={snapshot.player.lives} busy={busy}
        onAction={action => void command(action)} onPractice={onPractice} onBack={() => {
          selected.current = undefined;
          setSnapshot({ ...snapshot, active: null });
          load();
        }} /> : <>
        {snapshot.rewards.length > 0 && <section className={panel} aria-labelledby="study-rewards">
          <h2 id="study-rewards" className="mb-2 text-lg font-bold">Recompensas recebidas</h2>
          <ul className="mb-3 space-y-1">{snapshot.rewards.map(reward => <li key={reward.id}>{reward.title}
            <span className={'ml-2 ' + muted}>+{reward.xp} XP · +{reward.coins} fincoins</span>
            {reward.lessonId && <button type="button" className="ml-2 text-sm font-semibold underline" disabled={busy}
              onClick={() => void command({ action: 'state', lessonId: reward.lessonId })}>Planejando grandes compras</button>}</li>)}</ul>
          <button type="button" className={trailSecondary} disabled={busy} onClick={() => void command({ action: 'acknowledge', ids: snapshot.rewards.map(reward => reward.id), worldId: snapshot.world.id })}>Marcar como vistas</button>
        </section>}
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(15rem,1fr)]">
          <section aria-labelledby="study-world" className="space-y-3">
            <label className={'grid gap-1 ' + muted}>Mundo de aprendizagem
              <select className="max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold dark:border-slate-700 dark:bg-slate-900" disabled={busy}
                value={snapshot.world.id} onChange={event => void command({ action: 'state', worldId: event.currentTarget.value })}>
                {snapshot.worlds.map(world => <option key={world.id} value={world.id}>{world.title}{world.completed ? ' · concluído' : world.locked ? ' · bloqueado' : ''}</option>)}
              </select>
            </label>
            <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: snapshot.world.color }}>
              <h2 id="study-world" className="flex items-center gap-2 text-2xl font-black"><WorldIcon size={24} aria-hidden="true" />{snapshot.world.title}</h2>
              <p className="mt-1">{snapshot.world.description}</p>
              <p className="mt-2 text-sm">{snapshot.world.completed ? 'Selo conquistado' : 'Selo do mundo'} · {snapshot.world.badge}</p>
              {snapshot.world.locked && <p className="mt-1 text-sm">Conclua a prova do mundo anterior para iniciar estas lições.</p>}
            </div>
            <ol className="grid gap-3 sm:grid-cols-2">{snapshot.lessons.map(lesson => <LessonTile key={lesson.id} lesson={lesson} lives={snapshot.player.lives} busy={busy} onStart={mode => {
              void command(lesson.resumable ? { action: 'state', lessonId: lesson.id } : { action: 'start', lessonId: lesson.id, mode });
            }} />)}</ol>
          </section>
          <section className={panel} aria-labelledby="study-missions">
            <h2 id="study-missions" className="text-lg font-bold">Missões</h2>
            <ul className="mt-3 space-y-4">{snapshot.missions.map(mission => <li key={mission.id} className="space-y-1">
              <p className={muted}>{mission.period === 'diaria' ? 'Diária' : mission.period === 'semanal' ? 'Semanal' : 'Mensal'}</p>
              <p className="flex items-start gap-2 font-bold">{mission.done && <Check size={18} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />}{mission.title}</p>
              <p className={muted}>{mission.done ? 'Concluída' : `${mission.progress} de ${mission.target}`}</p>
              <progress aria-label={mission.title} max={mission.target} value={mission.progress} className={progressTrack} />
            </li>)}</ul>
          </section>
        </div>
      </>}
    </>}
  </div>;
}
