import { useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useGoals } from '../../hooks/useGoals';
import { useAchievements } from '../../hooks/useAchievements';
import { useAvatar } from '../../hooks/useAvatar';
import { GamificationService } from '../../services/gamificationService';
import { PurchaseGoalsService } from '../../services/purchaseGoalsService';
import type { Achievement, ContributionType, RankHistory, TrailMovement, UserProgress } from '../../types';
import { AchievementsGallery } from '../achievements/AchievementsGallery';
import { RanksView } from '../ranks/RanksView';
import { EditorPersonagem } from './EditorPersonagem';
import { useGamification } from './GamificationProvider';
import { TrailView } from './TrailView';
import { TrailMovementHistory } from './TrailMovementHistory';
import { TrailMovementModal } from './TrailMovementModal';
import { TrailSettings } from './TrailSettings';
import { enableCelebrationSound, TrailCelebration } from './TrailCelebration';
import { trailButton, trailSecondary } from './TrailDialog';
import { Personagem } from './Personagem';
import type { GameTrailTab } from '../../navigation/appRoutes';
import './trail.css';

type Event = { achievement: Achievement; promotion?: never } | { promotion: RankHistory; achievement?: never };
type Connected = NonNullable<ReturnType<typeof useGamification>>;

interface Navigation {
  tab: GameTrailTab;
  onTabChange: (tab: GameTrailTab) => void;
  inventory?: string[];
}

function ActiveTrail({ game, userId, tab, onTabChange, inventory }: { game: Connected; userId: string } & Navigation) {
  const { snapshot, refresh, trail, rank, house, error, setPaused } = game;
  const goals = useGoals(userId, refresh);
  const achievements = useAchievements(userId, refresh);
  const avatar = useAvatar(snapshot?.progress, snapshot?.ranks ?? [], snapshot?.history ?? [], inventory);
  const [panel, setPanel] = useState<'avatar' | 'settings'>();
  const [movement, setMovement] = useState<{ kind: ContributionType; original?: TrailMovement }>();
  const [presented, setPresented] = useState<Event>();
  const [highlights, setHighlights] = useState<string[]>([]);
  const [claimError, setClaimError] = useState('');
  const [actionError, setActionError] = useState('');
  const claiming = useRef(false);
  const [locallyClaimed, setLocallyClaimed] = useState<string[]>([]);
  const dialogOpen = Boolean(panel || movement);

  const pending = (snapshot?.achievements ?? []).filter(item => item.produto && item.desbloqueadaEm &&
    !item.comemorada && !item.oculta && !item.excluida && !locallyClaimed.includes(item.id))
    .sort((left, right) => (left.desbloqueadaEm ?? '').localeCompare(right.desbloqueadaEm ?? '') ||
      (left.produto?.casa ?? 0) - (right.produto?.casa ?? 0));
  const first = pending[0];
  const destination = first ? trail.products.find(item => item.goal.id === first.goalId)?.house ?? first.produto?.casa ?? 0 : 0;
  const readyAchievement = first && (house >= destination || house === trail.house) ? first : undefined;
  const readyPromotion = !first ? snapshot?.history.find(item => !item.comemorada && !locallyClaimed.includes(item.id) &&
    snapshot.ranks.some(candidate => candidate.id === item.rankId)) : undefined;
  const readyId = readyAchievement?.id ?? readyPromotion?.id;

  useEffect(() => () => setPaused(false), [setPaused]);
  useEffect(() => {
    setPaused(Boolean(presented || (readyAchievement && !dialogOpen && !claimError)));
  }, [readyAchievement, presented, dialogOpen, claimError, setPaused]);
  useEffect(() => {
    if (presented || dialogOpen || !readyId || claimError || claiming.current) return;
    claiming.current = true;
    if (readyAchievement) onTabChange('trail');
    void GamificationService.claimCelebration(userId, readyId, Boolean(readyPromotion)).then(claimed => {
      setLocallyClaimed(items => [...items, readyId]);
      if (claimed && readyAchievement) setPresented({ achievement: readyAchievement });
      if (claimed && readyPromotion) setPresented({ promotion: readyPromotion });
    }).catch(reason => setClaimError(reason instanceof Error ? reason.message : 'Falha ao carregar a comemoração.'))
      .finally(() => { claiming.current = false; });
  }, [presented, dialogOpen, readyId, claimError, userId, readyAchievement, readyPromotion, onTabChange]);

  const sound = snapshot?.progress.preferencias.som ?? false;
  useEffect(() => {
    if (!sound) return;
    document.addEventListener('pointerdown', enableCelebrationSound, { once: true });
    document.addEventListener('keydown', enableCelebrationSound, { once: true });
    return () => {
      document.removeEventListener('pointerdown', enableCelebrationSound);
      document.removeEventListener('keydown', enableCelebrationSound);
    };
  }, [sound]);

  if (!snapshot) {
    return error
      ? <div role="alert" className="space-y-3 rounded-2xl border border-red-300 p-5 dark:border-red-900"><p>{error}</p><button className={trailSecondary} onClick={() => void refresh()}>Tentar novamente</button></div>
      : <p role="status" className="flex items-center justify-center gap-2 py-14"><LoaderCircle className="animate-spin" size={20} /> Carregando Trilha de Conquistas…</p>;
  }

  const { progress, ledger, ledgerError } = snapshot;
  const total = ledger?.total ?? 0;
  const saveSettings = async (fields: Partial<Pick<UserProgress, 'valorCasa' | 'avatarConfig' | 'avataresSalvos' | 'preferencias'>>) => {
    await GamificationService.saveSettings(userId, fields, total);
    await refresh();
  };
  const closeCelebration = () => {
    if (presented?.achievement) {
      const id = presented.achievement.id;
      setHighlights(items => [...items, id]);
      if (!pending.length) onTabChange('achievements');
    }
    setPresented(undefined);
  };
  const [currentRank, previousRank] = presented?.promotion
    ? [snapshot.ranks.find(item => item.id === presented.promotion?.rankId), snapshot.ranks.find(item => item.id === presented.promotion?.anteriorId)]
    : [];
  return <div className="space-y-4">
    {(error || claimError || actionError || ledgerError) && <div role="alert" className="flex flex-wrap items-center gap-2 rounded-xl border border-red-300 p-3 text-sm dark:border-red-900">
      {error || claimError || actionError || ledgerError}
      <button type="button" className={trailSecondary} onClick={() => { setClaimError(''); setActionError(''); void refresh(); }}>Atualizar</button>
    </div>}
    {tab === 'trail' && <TrailView goals={snapshot.goals} progress={progress} rank={rank} trail={trail} total={ledger?.total ?? null}
      displayedHouse={house} avatar={avatar.config} actions={goals} onValue={valorCasa => saveSettings({ valorCasa })}
      onAvatar={() => { if (sound) enableCelebrationSound(); setPanel('avatar'); }}
      onSettings={() => { if (sound) enableCelebrationSound(); setPanel('settings'); }} onMovement={kind => setMovement({ kind })}
      onHistory={() => onTabChange('movements')}
      highlight={presented?.achievement?.goalId ?? readyAchievement?.goalId} />}
    {tab === 'movements' && <><button type="button" className={trailSecondary} onClick={() => onTabChange('trail')}>Voltar ao tabuleiro</button>
      <TrailMovementHistory ledger={ledger} onAdd={() => setMovement({ kind: 'aporte' })}
      onEdit={original => setMovement({ kind: original.tipo, original })}
      onRemove={async original => { await PurchaseGoalsService.deleteTrailMovement(userId, original); await refresh(); }} /></>}
    {tab === 'achievements' && <AchievementsGallery achievements={snapshot.achievements} products={trail.products} house={trail.house}
      total={ledger?.total ?? null} limits={progress.preferencias.limites} rank={rank.current} highlights={highlights} actions={achievements} />}
    {tab === 'ranks' && <RanksView ranks={snapshot.ranks} rank={rank} progress={progress} history={snapshot.history} avatar={avatar.config}
      onSave={async (value, id) => {
        await GamificationService.saveRank(userId, value, snapshot.ranks, id);
        await refresh();
      }}
      onArchive={async id => {
        await GamificationService.archiveRank(userId, id);
        await refresh(id === rank.current?.id);
      }}
      onDowngrade={() => refresh(true)} />}
    {tab === 'avatar' && <section className="flex flex-wrap items-center gap-5 rounded-2xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-900 dark:bg-violet-950/40">
      <Personagem config={avatar.config} tamanho={88} />
      <div className="space-y-3">
        <h1 className="text-2xl font-black">Meu Personagem</h1>
        <button type="button" className={trailButton} onClick={() => setPanel('avatar')}>Personalizar personagem</button>
      </div>
    </section>}
    {panel === 'avatar' && <EditorPersonagem initial={avatar.config} saved={avatar.looks} locks={avatar.locks}
      onClose={() => setPanel(undefined)} onSave={(avatarConfig, avataresSalvos) => saveSettings({ avatarConfig, avataresSalvos })} />}
    {panel === 'settings' && <TrailSettings preferences={progress.preferencias} ranks={snapshot.ranks}
      onClose={() => setPanel(undefined)} onSave={preferencias => saveSettings({ preferencias })} />}
    {movement && <TrailMovementModal kind={movement.kind} original={movement.original} total={total}
      onClose={() => setMovement(undefined)} onSave={async (value, original) => {
        const balanceChanged = !original || value.valor !== original.valor || value.tipo !== original.tipo;
        await PurchaseGoalsService.saveTrailMovement(userId, value, original);
        await refresh();
        if (balanceChanged) onTabChange('trail');
      }} />}
    {presented && <TrailCelebration key={presented.achievement?.id ?? presented.promotion?.id} achievement={presented.achievement}
      rank={currentRank} previous={previousRank} avatar={avatar.config} sound={sound} onClose={closeCelebration}
      onSound={() => {
        if (!sound) enableCelebrationSound();
        void saveSettings({ preferencias: { ...progress.preferencias, som: !sound } })
          .catch(reason => setActionError(reason instanceof Error ? reason.message : 'Falha ao salvar o som.'));
      }} />}
  </div>;
}

export function GamificationView({ tab, onTabChange, inventory }: Navigation) {
  const game = useGamification();
  const { currentUser } = useApp();
  return game && currentUser
    ? <ActiveTrail game={game} userId={currentUser.id} tab={tab} onTabChange={onTabChange} inventory={inventory} />
    : <p role="status" className="p-6">Carregando sua conta…</p>;
}
