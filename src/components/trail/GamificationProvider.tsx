import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useApp } from '../../context/AppContext';
import { useMode } from '../../context/ModeContext';
import { useTrailGame } from '../../hooks/useTrailGame';
import { useRanks } from '../../hooks/useRanks';
import { calculateTrail, DEFAULT_HOUSE_VALUE, trailRhythm } from '../../utils/trail';

function useConnectedGame(userId: string) {
  const { gameTab } = useMode();
  const game = useTrailGame(userId);
  const { snapshot } = game;
  const value = snapshot?.progress.valorCasa ?? DEFAULT_HOUSE_VALUE;
  const trail = useMemo(() => {
    const ledger = snapshot?.ledger;
    return calculateTrail(snapshot?.goals ?? [], snapshot?.achievements ?? [], ledger?.total ?? 0, value,
      ledger ? trailRhythm(ledger.movements) : undefined);
  }, [snapshot, value]);
  const rank = useRanks(snapshot?.ranks ?? [], snapshot?.progress, snapshot?.achievements ?? []);
  const [location, setLocation] = useState<{ value: number; house: number }>();
  const [paused, setPaused] = useState(false);
  const last = useRef<number | undefined>(undefined);
  const house = location?.value === value ? location.house : trail.house;

  useEffect(() => {
    if (!snapshot) return;
    if (!location || location.value !== value || !snapshot.ledger) {
      last.current = trail.house;
      if (location?.value !== value || location.house !== trail.house) setLocation({ value, house: trail.house });
      return;
    }
    if (gameTab !== 'trail' || paused || house === trail.house) return;
    const difference = trail.house - house;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || localStorage.getItem('fingestao:reduzir-movimento') === '1';
    const distance = Math.abs((last.current ?? house) - trail.house);
    const step = Math.max(1, Math.ceil(distance / 130));
    const proposed = house + Math.sign(difference) * Math.min(step, Math.abs(difference));
    const stop = difference > 0 ? trail.products.find(item => item.house > house && item.house < proposed) : undefined;
    const next = reduced ? trail.house : stop?.house ?? proposed;
    const timer = window.setTimeout(() => {
      setLocation({ value, house: next });
      if (next === trail.house) last.current = next;
    }, reduced ? 0 : distance > 70 ? 45 : 95);
    return () => clearTimeout(timer);
  }, [gameTab, house, location, paused, snapshot, trail, value]);

  return { ...game, rank, trail, house, setPaused };
}

const TrailGameContext = createContext<ReturnType<typeof useConnectedGame> | null>(null);

function Connected({ userId, children }: { userId: string; children: ReactNode }) {
  const game = useConnectedGame(userId);
  return <TrailGameContext.Provider value={game}>{children}</TrailGameContext.Provider>;
}

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { currentUser, isCloudActive } = useApp();
  return currentUser && isCloudActive ? <Connected key={currentUser.id} userId={currentUser.id}>{children}</Connected> :
    <TrailGameContext.Provider value={null}>{children}</TrailGameContext.Provider>;
}

export const useGamification = () => useContext(TrailGameContext);
