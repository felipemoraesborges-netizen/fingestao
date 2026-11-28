import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { classicPaths, gamePaths, navigateApp, resolveAppRoute, useAppPath } from '../navigation/appRoutes';
import type { AppMode, ClassicTab, GameTab } from '../navigation/appRoutes';
import { defaultModePreferences, readModePreferences, writeModePreferences } from '../services/appModeService';
import type { ModePreferences } from '../services/appModeService';
import { learningActivityEvent, sendLearningAction } from '../services/learningService';
import { useApp } from './AppContext';

type RemotePreferences = Awaited<ReturnType<typeof readModePreferences>>;
type Loaded = RemotePreferences & { userId: string; failed?: boolean };

function useModeState() {
  const { activeTab, currentUser, authReady } = useApp();
  const path = useAppPath();
  const route = resolveAppRoute(path);
  const userId = currentUser?.id;
  const [loaded, setLoaded] = useState<Loaded>();
  const [visitor, setVisitor] = useState(defaultModePreferences);
  const [lastGameTab, setLastGameTab] = useState<GameTab>('learn');
  const [practiceReturn, setPracticeReturn] = useState<GameTab>();
  const [saveError, setSaveError] = useState<{ userId: string; message: string }>();
  const writes = useRef(Promise.resolve());
  const enteredAtHome = useRef(path === '/');
  const account = loaded && loaded.userId === userId ? loaded : undefined;
  const preferences = userId ? account?.preferences ?? defaultModePreferences : visitor;
  const ready = authReady && (!userId || Boolean(account));
  const mode: AppMode = route?.mode === 'jogo' && ready && preferences.gameEnabled ? 'jogo' : 'classico';
  const gameTab = route?.mode === 'jogo' ? route.tab : lastGameTab;

  if (mode === 'jogo' && route?.mode === 'jogo' && lastGameTab !== route.tab) setLastGameTab(route.tab);

  useEffect(() => {
    if (!userId) {
      setLoaded(undefined);
      return;
    }
    let current = true;
    void readModePreferences(userId).then(result => {
      if (current) setLoaded({ ...result, userId });
    }, () => {
      if (current) setLoaded({ userId, preferences: { ...defaultModePreferences, gameEnabled: false }, schema: 'basic', failed: true });
    });
    return () => { current = false; };
  }, [userId]);

  useEffect(() => {
    if (!ready || !userId || !preferences.gameEnabled) return;
    const onExpense = () => { void sendLearningAction({ action: 'expense' }).catch(() => undefined); };
    window.addEventListener(learningActivityEvent, onExpense);
    return () => window.removeEventListener(learningActivityEvent, onExpense);
  }, [ready, userId, preferences.gameEnabled]);

  useEffect(() => {
    if (!ready) return;
    const current = resolveAppRoute(path);
    if (!preferences.gameEnabled && current?.mode === 'jogo') {
      navigateApp(classicPaths[activeTab], true);
    } else if (current?.mode === 'classico' && current.tab === 'library' && !preferences.libraryVisible) {
      navigateApp(classicPaths.settings, true);
    } else if (!current) {
      const home = path === '/' && preferences.gameEnabled && preferences.mode === 'jogo' ? gamePaths.learn : classicPaths.dashboard;
      navigateApp(home, true);
    }
  }, [ready, path, activeTab, preferences.gameEnabled, preferences.mode, preferences.libraryVisible]);

  function update(patch: Partial<ModePreferences>) {
    if (!userId || !account) {
      setVisitor(value => ({ ...value, ...patch }));
      return;
    }
    setLoaded(value => value?.userId === userId ? { ...value, preferences: { ...value.preferences, ...patch } } : value);
    setSaveError(undefined);
    writes.current = writes.current.then(() => writeModePreferences(userId, patch, account.schema)).catch((reason: unknown) => {
      setSaveError({ userId, message: reason instanceof Error ? reason.message : 'Não foi possível salvar a preferência.' });
    });
  }

  function chooseMode(next: AppMode) {
    if (!ready || (next === 'jogo' && !preferences.gameEnabled)) return;
    setPracticeReturn(undefined);
    update({ mode: next, chosenAt: preferences.chosenAt ?? new Date().toISOString() });
    navigateApp(next === 'jogo' ? gamePaths[lastGameTab] : classicPaths[activeTab]);
  }

  function setGameEnabled(enabled: boolean) {
    if (!ready) return;
    setPracticeReturn(undefined);
    update({ gameEnabled: enabled, ...(enabled ? {} : { mode: 'classico' as const, chosenAt: preferences.chosenAt ?? new Date().toISOString() }) });
    if (!enabled && route?.mode === 'jogo') navigateApp(classicPaths.settings, true);
  }

  function openPractice(tab: ClassicTab) {
    setPracticeReturn(gameTab);
    navigateApp(classicPaths[tab]);
  }

  function returnToGame() {
    if (practiceReturn && preferences.gameEnabled) navigateApp(gamePaths[practiceReturn]);
    setPracticeReturn(undefined);
  }

  const showOnboarding = ready && enteredAtHome.current && preferences.gameEnabled && preferences.mode === 'classico' &&
    preferences.chosenAt === null && (!userId || account?.schema === 'complete');

  return {
    mode, gameTab, ready, preferences, showOnboarding, chooseMode, setGameEnabled, openPractice, returnToGame,
    canReturnToGame: Boolean(practiceReturn && preferences.gameEnabled && mode === 'classico'),
    canSaveLibrary: !userId || account?.schema === 'complete',
    setLibraryVisible: (visible: boolean) => update({ libraryVisible: visible }),
    preferencesError: saveError?.userId === userId ? saveError?.message : account?.failed ? 'Preferências da conta indisponíveis.' : undefined,
  };
}

const ModeContext = createContext<ReturnType<typeof useModeState> | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const state = useModeState();
  return <ModeContext.Provider value={state}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) throw new Error('Use o seletor dentro do FinGestão.');
  return context;
}
