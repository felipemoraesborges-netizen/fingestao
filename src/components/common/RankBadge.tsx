import React from 'react';
import type { Rank } from '../../types';
import { achievementIcon } from '../../data/achievementIcons';

interface RankBadgeProps {
  rank: Rank | null;
  xp?: number;
  nivel?: number;
  size?: 'sm' | 'md' | 'lg';
}

const RANK_ICONS: Record<string, string> = {
  'Bronze': '🥉',
  'Prata': '🥈',
  'Ouro': '🥇',
  'Platina': '💎',
  'Diamante': '💠',
  'Mestre': '👑',
  'Grão-Mestre': '🛡️',
  'Lendário': '🌟',
  'Mítico': '👑',
};

export const RankBadge: React.FC<RankBadgeProps> = ({ rank, xp, nivel, size = 'md' }) => {
  if (!rank) return null;

  const icon = RANK_ICONS[rank.nome] ?? '🏅';
  const customUrl = rank.iconeUrl && /^https?:\/\//i.test(rank.iconeUrl) ? rank.iconeUrl : undefined;
  const CustomIcon = achievementIcon(rank.iconeUrl);
  const sizeClass = size === 'sm'
    ? 'text-xs px-2 py-0.5 gap-1'
    : size === 'lg'
    ? 'text-sm px-3 py-1.5 gap-2'
    : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <div
      className={`inline-flex items-center rounded-full font-bold border ${sizeClass}`}
      style={{ backgroundColor: `${rank.cor}22`, borderColor: `${rank.cor}66` }}
      title={`Patente: ${rank.nome}${nivel ? ` | Nível ${nivel}` : ''}${xp !== undefined ? ` | ${xp} XP` : ''}`}
    >
      {customUrl ? <img src={customUrl} alt="" className="h-4 w-4 rounded object-contain" /> :
        rank.iconeUrl ? <CustomIcon size={15} style={{ color: rank.cor }} /> : <span aria-hidden="true">{icon}</span>}
      <span>{rank.nome}</span>
      {nivel !== undefined && (
        <span className="opacity-70">Nv.{nivel}</span>
      )}
    </div>
  );
};
