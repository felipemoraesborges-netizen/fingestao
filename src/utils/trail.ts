import type { Achievement, Goal, Rank, TrailMovement, TrailMovementInput, TrailPreferences } from '../types';

export const DEFAULT_HOUSE_VALUE = 100;
export const DEFAULT_PREFERENCES: TrailPreferences = { som: false, limites: [1000, 3000, 7000], itensPorPatente: {} };
export const MAX_MONEY = 999_999_999_999.99;
export const cents = (value: number) => Math.round(value * 100);

const dayMilliseconds = 86_400_000;
const historyWindow = 90;
const minimumSampleDays = 30;

export function trailToday(now = new Date()) {
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
}

export function trailEpochDay(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  const utc = new Date(date + 'T00:00:00.000Z');
  return Number.isFinite(utc.valueOf()) && utc.toISOString().slice(0, 10) === date
    ? utc.valueOf() / dayMilliseconds : undefined;
}

export function signedTrailCents(movement?: Pick<TrailMovementInput, 'tipo' | 'valor'>) {
  if (!movement) return 0;
  return cents(movement.valor) * (movement.tipo === 'retirada' ? -1 : 1);
}

export function trailRhythm(movements: TrailMovement[], today = trailToday()) {
  const end = trailEpochDay(today);
  if (end === undefined) return undefined;
  const start = end - historyWindow + 1;
  let firstDay = end;
  let net = 0;
  for (const movement of movements) {
    const day = trailEpochDay(movement.data);
    if (day === undefined || day < start || day > end) continue;
    net += signedTrailCents(movement);
    firstDay = Math.min(firstDay, day);
  }
  return net > 0 ? { today: end, dailyCents: net / Math.max(minimumSampleDays, end - firstDay + 1) } : undefined;
}

export function trailForecast(missingCents: number, rhythm?: ReturnType<typeof trailRhythm>) {
  if (!rhythm || missingCents <= 0) return undefined;
  const estimatedDay = rhythm.today + Math.ceil(missingCents / rhythm.dailyCents);
  const date = new Date(estimatedDay * dayMilliseconds);
  return Number.isFinite(date.valueOf()) && date.getUTCFullYear() <= 9999 ? date.toISOString().slice(0, 10) : undefined;
}

export interface TrailProduct {
  goal: Goal;
  house: number;
  target: number;
  achievement?: Achievement;
  expectedOn?: string;
}

export function orderedPurchaseGoals(goals: Goal[]) {
  return [...goals].sort((left, right) => left.preco - right.preco ||
    left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id));
}

export function calculateTrail(goals: Goal[], achievements: Achievement[], total: number, houseValue: number, rhythm?: ReturnType<typeof trailRhythm>) {
  const step = cents(houseValue);
  const balance = Math.max(0, cents(total));
  const house = Math.floor(balance / step);
  const byGoal = new Map(achievements.filter(item => item.desbloqueadaEm && item.goalId).map(item => [item.goalId, item]));
  let cumulative = 0;
  let previous = 0;
  const products: TrailProduct[] = orderedPurchaseGoals(goals)
    .map(goal => {
      cumulative += Math.max(0, cents(goal.preco));
      previous = Math.max(previous + 1, Math.ceil(cumulative / step));
      const achievement = byGoal.get(goal.id);
      return {
        goal, house: previous, target: previous * step / 100, achievement,
        expectedOn: achievement ? undefined : trailForecast(previous * step - balance, rhythm),
      };
    });
  return { house, products, next: products.find(item => !item.achievement && item.house > house), nextHouseAmount: (step - balance % step) / 100 };
}

export function rarityFor(price: number, limits: TrailPreferences['limites']): Achievement['raridade'] {
  if (price <= limits[0]) return 'comum';
  if (price <= limits[1]) return 'rara';
  if (price <= limits[2]) return 'epica';
  return 'lendaria';
}

export function countAchievements(achievements: Achievement[]) {
  return achievements.filter(item => item.desbloqueadaEm && !item.oculta && !item.excluida).length;
}

export function rankStatus(ranks: Rank[], currentId: string | undefined, count: number) {
  const ordered = [...ranks].sort((left, right) => left.ordem - right.ordem || left.id.localeCompare(right.id));
  const active = ordered.filter(rank => !rank.arquivada);
  const eligible = active.filter(rank => rank.conquistasNecessarias <= count).at(-1);
  const retained = ordered.find(rank => rank.id === currentId);
  const current = retained && (!eligible || retained.ordem >= eligible.ordem) ? retained : eligible;
  const next = active.find(rank => !current || rank.ordem > current.ordem);
  const required = next?.conquistasNecessarias ?? 0;
  const remaining = Math.max(0, required - count);
  const start = Math.min(current?.conquistasNecessarias ?? 0, required);
  const percent = !next || remaining === 0 ? 100 : Math.max(0, (count - start) / Math.max(1, required - start) * 100);
  return { current, retained, eligible, next, remaining, percent };
}
