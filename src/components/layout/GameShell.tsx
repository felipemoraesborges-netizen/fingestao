import { Activity, lazy, Suspense, useEffect, useState } from 'react';
import { BookOpen, Building2, Calculator, Cloud, Compass, Flag, GitBranch, LogIn, ScrollText, Shield, ShoppingBag, Trophy, UserRound, UserSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useMode } from '../../context/ModeContext';
import { useAvatar } from '../../hooks/useAvatar';
import { usePlay } from '../../hooks/usePlay';
import { gamePaths, navigateApp } from '../../navigation/appRoutes';
import type { ClassicTab, GameTab, GameTrailTab } from '../../navigation/appRoutes';
import { GamificationView } from '../trail/GamificationView';
import { GamificationProvider, useGamification } from '../trail/GamificationProvider';
import { RankBadge } from '../common/RankBadge';
import { LearningView } from '../learning/LearningView';
import { PracticeView } from '../learning/PracticeView';
import { CityView } from '../play/CityView';
import { PlayProfile } from '../play/PlayProfile';
import { PlayShop } from '../play/PlayShop';
import { StoryView } from '../play/StoryView';
import { SkillView } from '../play/SkillView';
import { trailButton, trailSecondary } from '../trail/TrailDialog';

const menu = [
  { tab: 'learn', label: 'Aprender', Icon: BookOpen },
  { tab: 'city', label: 'Cidade', Icon: Building2 },
  { tab: 'simulators', label: 'Simuladores', Icon: Calculator },
  { tab: 'story', label: 'História', Icon: ScrollText },
  { tab: 'skills', label: 'Habilidades', Icon: GitBranch },
  { tab: 'practice', label: 'Praticar', Icon: Compass },
  { tab: 'trail', label: 'Metas', Icon: Flag },
  { tab: 'achievements', label: 'Conquistas', Icon: Trophy },
  { tab: 'avatar', label: 'Personagem', Icon: UserRound },
  { tab: 'shop', label: 'Loja', Icon: ShoppingBag },
  { tab: 'ranks', label: 'Patentes', Icon: Shield },
  { tab: 'profile', label: 'Perfil', Icon: UserSquare },
] as const;

const SimulatorsView = lazy(() => import('../play/SimulatorsView'));

const practiceOptions: { tab: ClassicTab; title: string; description: string }[] = [
  { tab: 'transactions', title: 'Registrar gastos', description: 'Anote rendas e despesas na tela de Transações.' },
  { tab: 'categories', title: 'Organizar o orçamento', description: 'Revise as categorias e os limites de gastos.' },
  { tab: 'savings', title: 'Planejar uma reserva', description: 'Acompanhe uma meta na área de Metas de Poupança.' },
  { tab: 'purchases', title: 'Organizar uma compra', description: 'Edite uma meta ou consulte quanto falta para ela.' },
  { tab: 'purchaseCheck', title: 'Vale a pena comprar?', description: 'Compare à vista, parcelado e o efeito sobre suas metas.' },
];

function goGame(tab: GameTab) {
  navigateApp(gamePaths[tab]);
}

function isTrailTab(tab: GameTab): tab is GameTrailTab {
  return tab === 'trail' || tab === 'movements' || tab === 'achievements' || tab === 'avatar' || tab === 'ranks';
}

function goStudy(lessonId: string) {
  navigateApp(gamePaths.learn, false, new URLSearchParams({ licao: lessonId }));
}

function ConnectedGame() {
  const { currentUser } = useApp();
  const { gameTab, openPractice } = useMode();
  const game = useGamification();
  const { state, error: playError, busy, reload, run } = usePlay(currentUser?.id);
  const avatar = useAvatar(game?.snapshot?.progress, game?.snapshot?.ranks ?? [], game?.snapshot?.history ?? [], state?.inventario);
  const [visitedLearn, setVisitedLearn] = useState(gameTab === 'learn');
  const [lastTrail, setLastTrail] = useState<GameTrailTab>();
  const visibleTrail = isTrailTab(gameTab);
  if (visibleTrail && lastTrail !== gameTab) setLastTrail(gameTab);
  if (gameTab === 'learn' && !visitedLearn) setVisitedLearn(true);
  useEffect(() => {
    reload();
  }, [gameTab, reload]);

  useEffect(() => {
    if (!state?.lembrete) return;
    const interval = window.setInterval(() => { if (!document.hidden) reload(); }, 60_000);
    return () => window.clearInterval(interval);
  }, [reload, state?.lembrete]);

  return <>
    {state?.notificar && <div role="status" className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-violet-100 p-3 text-violet-950 dark:bg-violet-950 dark:text-violet-100">
      <p>Você ainda pode fazer uma lição hoje.</p>
      <button className={trailButton} type="button" disabled={busy} onClick={() => { void run({ type: 'reminded' }); goGame('learn'); }}>Abrir Aprender</button>
      <button className={trailSecondary} type="button" disabled={busy} onClick={() => void run({ type: 'reminded' })}>Dispensar hoje</button>
    </div>}
    {visitedLearn && <Activity mode={gameTab === 'learn' ? 'visible' : 'hidden'}>
      <LearningView key={currentUser?.id} avatar={avatar.config} pet={state?.pet} onPractice={openPractice} onProgress={() => { void game?.refresh(); reload(); }} />
    </Activity>}
    {gameTab === 'practice' && <section className="space-y-4">
      <h1 className="text-2xl font-black">Praticar</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">Escolha uma ferramenta. Você pode voltar a esta tela pelo topo.</p>
      <div className="grid gap-3 sm:grid-cols-2">{practiceOptions.map(item =>
        <button key={item.tab} type="button" onClick={() => openPractice(item.tab)}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-violet-400 dark:border-slate-800 dark:bg-slate-900">
          <span className="block font-bold">{item.title}</span>
          <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">{item.description}</span>
        </button>)}</div>
      <PracticeView onPractice={openPractice} onStudy={goStudy} />
    </section>}
    {(['city', 'shop', 'profile'].includes(gameTab) || state?.notificar) && playError && <div role="alert" className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-rose-500 p-3">
      {playError}<button className={trailSecondary} type="button" disabled={busy} onClick={reload}>Tentar novamente</button>
    </div>}
    {['city', 'shop', 'profile'].includes(gameTab) && !state && !playError && <p role="status">Carregando FinGestão Play…</p>}
    {gameTab === 'city' && state && <CityView state={state} busy={busy} run={run} onStudy={goStudy} />}
    {gameTab === 'simulators' && <Suspense fallback={<p role="status">Carregando simuladores…</p>}><SimulatorsView /></Suspense>}
    {gameTab === 'story' && currentUser && <StoryView key={currentUser.id} userId={currentUser.id} />}
    {gameTab === 'skills' && <SkillView onStudy={goStudy} />}
    {gameTab === 'shop' && state && <PlayShop state={state} busy={busy} run={run} openAvatar={() => goGame('avatar')} />}
    {gameTab === 'profile' && <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-2xl font-black">Perfil</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">{currentUser?.email ?? 'Conta conectada'}</p>
      {game?.rank.current && <RankBadge rank={game.rank.current} nivel={game.snapshot?.progress.nivel} />}
      <button type="button" className={trailSecondary} onClick={() => openPractice('settings')}>Abrir configurações da conta</button>
      {state && <PlayProfile state={state} busy={busy} run={run} />}
    </section>}
    {lastTrail && <Activity mode={visibleTrail ? 'visible' : 'hidden'}>
      <div><GamificationView tab={lastTrail} onTabChange={goGame} inventory={state?.inventario} /></div>
    </Activity>}
  </>;
}

export default function GameShell() {
  const { currentUser, setAuthModalOpen, toggleDarkMode } = useApp();
  const { gameTab, openPractice } = useMode();
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem('fingestao:reduzir-movimento') === '1');
  return <div className="mx-auto w-full max-w-7xl space-y-5 px-3 py-4 sm:px-6" data-play-motion={reduceMotion ? 'reduced' : undefined}>
    <header className="flex flex-wrap items-center justify-between gap-2">
      <div><p className="font-black text-violet-800 dark:text-violet-300">FinGestão Play</p><p className="text-sm">Seu dinheiro. Seu jogo. Seu futuro.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={reduceMotion} onChange={event => {
          setReduceMotion(event.currentTarget.checked);
          localStorage.setItem('fingestao:reduzir-movimento', event.currentTarget.checked ? '1' : '0');
        }} />Reduzir movimento</label>
        <button type="button" className={trailSecondary} onClick={toggleDarkMode}>Alternar tema</button>
      </div>
    </header>
    <nav aria-label="Menu do Modo Jogo" className="flex flex-wrap gap-2">
      {menu.map(({ tab, label, Icon }) => {
        const active = gameTab === tab || (tab === 'trail' && gameTab === 'movements');
        return <button key={tab} type="button" aria-current={active ? 'page' : undefined}
          className={active ? trailButton : trailSecondary} onClick={() => goGame(tab)}><Icon size={16} />{label}</button>;
      })}
    </nav>
    <main aria-label="Conteúdo do Modo Jogo">
      {currentUser ? <GamificationProvider><ConnectedGame /></GamificationProvider> :
        <section className="mx-auto grid max-w-lg justify-items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <Cloud size={36} className="text-violet-600" aria-hidden="true" />
          <h1 className="text-xl font-black">Conecte sua conta</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">Entre para usar o Modo Jogo e salvar seu progresso.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className={trailButton} onClick={() => setAuthModalOpen(true)}><LogIn size={16} />Entrar ou cadastrar conta</button>
            <button type="button" className={trailSecondary} onClick={() => openPractice('settings')}>Configurações e nuvem</button>
          </div>
        </section>}
    </main>
  </div>;
}
