import { Lock, Pencil } from 'lucide-react';
import { achievementIcon } from '../../data/achievementIcons';
import type { Achievement, Rank } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ProductArt } from '../trail/ProductArt';

export const rarityLabels = { comum: 'Comum', rara: 'Rara', epica: 'Épica', lendaria: 'Lendária' };
const rarityColors = { comum: '#64748b', rara: '#2563eb', epica: '#7c3aed', lendaria: '#b86612' };

export function AchievementCard({ item, rank, highlight, missing, onEdit }: {
  item: Achievement; rank?: Rank; highlight?: boolean; missing?: string; onEdit?: () => void;
}) {
  const unlocked = Boolean(item.desbloqueadaEm);
  const Icon = achievementIcon(item.iconeNome);
  const color = rarityColors[item.raridade];
  return <article id={'ach-' + item.id} className={'relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 ' + (highlight ? 'trail-gallery-new' : '')}
    style={{ borderColor: unlocked ? rank?.cor ?? color : '#8e8b9b55', borderWidth: unlocked && rank ? 2 : 1 }}>
    <div className={'relative h-28 bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 ' + (unlocked ? '' : 'grayscale opacity-60')}>
      <ProductArt url={item.produto?.imagemUrl ?? item.iconeUrl} icon={item.iconeNome} />
      {!unlocked && <span className="absolute inset-0 grid place-items-center"><Lock size={26} className="drop-shadow-md" /></span>}
    </div>
    <div className="relative space-y-1 p-3">
      <span className="absolute -top-5 right-3 grid h-10 w-10 place-items-center rounded-full border-2 bg-white text-violet-800 dark:bg-slate-900 dark:text-violet-200" style={{ borderColor: color }}>
        <Icon size={20} />
      </span>
      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{rarityLabels[item.raridade]}{item.oculta ? ' · Oculta' : ''}</p>
      <h3 className="pr-6 font-black">{item.titulo}</h3>
      {item.produto && <p className="text-sm font-semibold">{formatCurrency(item.produto.preco)}</p>}
      {item.descricao && <p className="text-sm text-slate-600 dark:text-slate-400">{item.descricao}</p>}
      {item.frasePessoal && <p className="text-sm italic text-violet-700 dark:text-violet-300">“{item.frasePessoal}”</p>}
      {item.desbloqueadaEm && <p className="text-xs text-slate-600 dark:text-slate-400">{new Date(item.desbloqueadaEm).toLocaleDateString('pt-BR')}</p>}
      {missing && <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{missing}</p>}
      {onEdit && <button type="button" aria-label={'Editar ' + item.titulo} className="absolute bottom-2 right-2 rounded-lg p-2 hover:bg-violet-100 dark:hover:bg-violet-950" onClick={onEdit}><Pencil size={17} /></button>}
    </div>
  </article>;
}
