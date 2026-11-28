import { useSyncExternalStore } from 'react';

export const classicPaths = {
  dashboard: '/classico/visao-geral',
  folders: '/classico/pastas',
  transactions: '/classico/transacoes',
  categories: '/classico/categorias',
  investments: '/classico/investimentos',
  savings: '/classico/metas-de-poupanca',
  purchases: '/classico/metas-de-compra',
  reports: '/classico/relatorios',
  settings: '/classico/configuracoes',
  library: '/classico/biblioteca',
  progress: '/classico/progresso-financeiro',
  simulators: '/classico/simuladores',
  purchaseCheck: '/classico/vale-a-pena',
} as const;

export const gamePaths = {
  learn: '/jogo/aprender',
  practice: '/jogo/praticar',
  trail: '/jogo/metas',
  movements: '/jogo/metas/historico',
  achievements: '/jogo/conquistas',
  avatar: '/jogo/personagem',
  ranks: '/jogo/patentes',
  profile: '/jogo/perfil',
  shop: '/jogo/loja',
  city: '/jogo/cidade',
  story: '/jogo/historia',
  skills: '/jogo/habilidades',
  simulators: '/jogo/simuladores',
} as const;

export type AppMode = 'classico' | 'jogo';
export type ClassicTab = keyof typeof classicPaths;
export type GameTab = keyof typeof gamePaths;
export type GameTrailTab = Extract<GameTab, 'trail' | 'movements' | 'achievements' | 'avatar' | 'ranks'>;
type AppPath = typeof classicPaths[ClassicTab] | typeof gamePaths[GameTab];

const routeChange = 'fingestao:navegacao';

function subscribe(listener: () => void) {
  window.addEventListener('popstate', listener);
  window.addEventListener(routeChange, listener);
  return () => {
    window.removeEventListener('popstate', listener);
    window.removeEventListener(routeChange, listener);
  };
}

export function useAppPath() {
  return useSyncExternalStore(subscribe, () => window.location.pathname, () => '/');
}

export function resolveAppRoute(pathname: string) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const classicTab = (Object.keys(classicPaths) as ClassicTab[]).find(tab => classicPaths[tab] === path);
  if (classicTab) return { mode: 'classico' as const, tab: classicTab };
  const gameTab = (Object.keys(gamePaths) as GameTab[]).find(tab => gamePaths[tab] === path);
  if (gameTab) return { mode: 'jogo' as const, tab: gameTab };
  if (path === '/classico') return { mode: 'classico' as const, tab: 'dashboard' as const };
  if (path === '/jogo') return { mode: 'jogo' as const, tab: 'learn' as const };
  return null;
}

export function navigateApp(path: AppPath, replace = false, query?: URLSearchParams) {
  const target = path + (query?.size ? '?' + query.toString() : replace ? window.location.search + window.location.hash : '');
  if (window.location.pathname + window.location.search + window.location.hash === target) return;
  if (replace) window.history.replaceState(window.history.state, '', target);
  else window.history.pushState(null, '', target);
  window.dispatchEvent(new Event(routeChange));
}

export function useAppSearch() {
  return useSyncExternalStore(subscribe, () => window.location.search, () => '');
}
