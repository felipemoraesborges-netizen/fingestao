import { useEffect, useState } from 'react';
import { Plus, Trophy } from 'lucide-react';
import type { Achievement, Rank, TrailPreferences } from '../../types';
import type { useAchievements } from '../../hooks/useAchievements';
import { productIcon } from '../../data/achievementIcons';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { rarityFor } from '../../utils/trail';
import type { TrailProduct } from '../../utils/trail';
import { trailButton, trailInput, trailSecondary } from '../trail/TrailDialog';
import { AchievementCard, rarityLabels } from './AchievementCard';
import { AchievementEditModal } from './AchievementEditModal';

export function AchievementsGallery({ achievements, products, house, total, limits, rank, highlights, actions }: {
  achievements: Achievement[]; products: TrailProduct[]; house: number; total: number | null; limits: TrailPreferences['limites'];
  rank?: Rank; highlights: string[]; actions: ReturnType<typeof useAchievements>;
}) {
  const [editing, setEditing] = useState<Achievement | 'new'>();
  const [rarity, setRarity] = useState('all');
  const [showLocked, setShowLocked] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const visible = achievements.filter(item => !item.excluida && item.oculta === showHidden);
  const unlocked = visible.filter(item => item.desbloqueadaEm).sort((left, right) => (right.desbloqueadaEm ?? '').localeCompare(left.desbloqueadaEm ?? ''));
  const map = new Map(products.map(item => [item.goal.id, item]));
  const lockedByGoal = new Map(visible.filter(item => !item.desbloqueadaEm && item.goalId).map(item => [item.goalId, item]));
  const suppressed = new Set(achievements.filter(item => item.oculta || item.excluida).map(item => item.goalId));
  const candidates = products.filter(item => !item.achievement && (!suppressed.has(item.goal.id) || lockedByGoal.has(item.goal.id)));
  const last = highlights.at(-1);
  useEffect(() => {
    if (!last) return;
    const frame = requestAnimationFrame(() => document.getElementById('ach-' + last)?.scrollIntoView({ block: 'center', behavior: 'auto' }));
    return () => cancelAnimationFrame(frame);
  }, [last]);

  const matches = (item: Achievement) => rarity === 'all' || item.raridade === rarity;
  const unlockedCards = unlocked.filter(matches).map(item => {
    const product = item.goalId ? map.get(item.goalId) : undefined;
    const art = product ? { nome: product.goal.nome, preco: product.goal.preco, categoria: product.goal.categoria, imagemUrl: product.goal.imagemUrl, casa: product.house } : undefined;
    return <AchievementCard key={item.id} item={{ ...item, produto: item.produto ?? art, iconeNome: item.iconeNome ?? (art && productIcon(art.nome, art.categoria)) }}
      rank={rank} highlight={highlights.includes(item.id)} onEdit={() => setEditing(item)} />;
  });
  const lockedCards = showLocked ? [
    ...candidates.filter(product => !showHidden || lockedByGoal.has(product.goal.id)).map(({ goal, house: goalHouse, target, expectedOn }) => {
      const record = lockedByGoal.get(goal.id);
      const item: Achievement = {
        id: goal.id, titulo: goal.nome, raridade: rarityFor(goal.preco, limits), personalizada: false, oculta: false, createdAt: goal.createdAt,
        ...record, iconeNome: record?.iconeNome ?? productIcon(goal.nome, goal.categoria),
        produto: { nome: goal.nome, preco: goal.preco, categoria: goal.categoria, imagemUrl: goal.imagemUrl, casa: goalHouse },
      };
      const missing = total === null ? 'Saldo da Trilha indisponível' :
        'Faltam ' + formatCurrency(Math.max(0, target - total)) + ' · ' + Math.max(0, goalHouse - house).toLocaleString('pt-BR') +
        ' casas' + (expectedOn ? ' · Previsão ' + formatDate(expectedOn) : '');
      return matches(item) && <AchievementCard key={item.id} item={item} missing={missing} onEdit={record ? () => setEditing(record) : undefined} />;
    }),
    ...visible.filter(item => !item.desbloqueadaEm && (!item.goalId || !map.has(item.goalId)) && matches(item)).map(item =>
      <AchievementCard key={item.id} item={item} onEdit={() => setEditing(item)} />),
  ].filter(Boolean) : [];

  return <section className="space-y-4">
    <div className="flex flex-wrap justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black"><Trophy size={23} className="text-amber-600" /> Galeria de Conquistas</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{unlocked.length} desbloqueadas {showHidden ? 'e ocultas' : 'e visíveis'}</p>
      </div>
      <button className={trailButton} onClick={() => setEditing('new')}><Plus size={16} /> Conquista manual</button>
    </div>
    <div className="flex flex-wrap gap-2">
      <select value={rarity} onChange={event => setRarity(event.target.value)} aria-label="Filtrar por raridade" className={trailInput}>
        <option value="all">Todas as raridades</option>
        {Object.entries(rarityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
      <button type="button" className={trailSecondary} onClick={() => setShowLocked(!showLocked)} aria-pressed={showLocked}>{showLocked ? 'Ocultar bloqueadas' : 'Ver bloqueadas'}</button>
      <button type="button" className={trailSecondary} onClick={() => setShowHidden(!showHidden)} aria-pressed={showHidden}>{showHidden ? 'Ver visíveis' : 'Gerenciar ocultas'}</button>
    </div>
    {unlockedCards.length + lockedCards.length
      ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{unlockedCards}{lockedCards}</div>
      : <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm dark:border-slate-700">Nenhuma conquista com estes filtros.</p>}
    {editing && <AchievementEditModal item={editing === 'new' ? undefined : editing} onClose={() => setEditing(undefined)} actions={actions} />}
  </section>;
}
