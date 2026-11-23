import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Rank } from '../../types';

interface RankPromotionModalProps {
  rank: Rank | null;
  onDismiss: () => void;
}

const RANK_ICONS: Record<string, string> = {
  'Bronze': '🥉', 'Prata': '🥈', 'Ouro': '🥇',
  'Platina': '💎', 'Diamante': '💠', 'Mestre': '👑', 'Lendário': '🌟',
};

export const RankPromotionModal: React.FC<RankPromotionModalProps> = ({ rank, onDismiss }) => {
  useEffect(() => {
    if (!rank) return;
    // Celebration burst
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: [rank.cor, '#fff', '#ffd700'] });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: [rank.cor, '#fff', '#ffd700'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🎉 Nova Patente!', {
        body: `Parabéns! Você alcançou a patente ${rank.nome} no FinGestão!`,
        icon: '/vite.svg',
      });
    }
  }, [rank]);

  if (!rank) return null;

  const icon = RANK_ICONS[rank.nome] ?? '🏅';

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onDismiss}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl border-2 animate-bounce-in"
        style={{ borderColor: rank.cor }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="text-7xl mb-4 select-none">{icon}</div>

        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">PROMOÇÃO DE PATENTE</div>

        <h2 className="text-3xl font-black mb-2" style={{ color: rank.cor }}>
          {rank.nome}
        </h2>

        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
          Parabéns! 🎉 Você desbloqueou a patente <strong>{rank.nome}</strong>!<br />
          Continue conquistando objetivos para subir ainda mais!
        </p>

        <button
          onClick={onDismiss}
          className="w-full py-3 rounded-2xl text-white font-black text-base transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
          style={{ backgroundColor: rank.cor }}
        >
          Incrível! Continuar 🚀
        </button>
      </div>
    </div>
  );
};
