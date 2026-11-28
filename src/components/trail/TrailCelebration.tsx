import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, VolumeX } from 'lucide-react';
import type { Achievement, Rank } from '../../types';
import type { AvatarConfig } from '../../data/avatarOptions';
import { formatCurrency } from '../../utils/formatters';
import { RankBadge } from '../common/RankBadge';
import { Personagem } from './Personagem';
import { ProductArt } from './ProductArt';
import { TrailDialog, trailButton, trailSecondary } from './TrailDialog';

let audio: AudioContext | undefined;

export function enableCelebrationSound() {
  try {
    if (typeof AudioContext !== 'undefined') {
      audio ??= new AudioContext();
      void audio.resume().catch(() => {});
    }
  } catch { }
}

function playSound() {
  if (!audio || audio.state !== 'running') return;
  const context = audio;
  const notes = [523, 659, 784].map((frequency, index) => {
    const note = context.createOscillator();
    const volume = context.createGain();
    const start = context.currentTime + index * .105;
    note.frequency.value = frequency;
    volume.gain.setValueAtTime(.075, start);
    volume.gain.exponentialRampToValueAtTime(.001, start + .23);
    note.connect(volume).connect(context.destination);
    note.start(start);
    note.stop(start + .25);
    return note;
  });
  return () => notes.forEach(note => note.disconnect());
}

export function TrailCelebration({ achievement, rank, previous, avatar, sound, onSound, onClose }: {
  achievement?: Achievement; rank?: Rank; previous?: Rank; avatar: AvatarConfig; sound: boolean;
  onSound: () => void; onClose: () => void;
}) {
  const performed = useRef(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const name = achievement?.produto?.nome ?? achievement?.titulo ?? rank?.nome ?? '';
  const title = achievement ? 'Você conquistou: ' + name + '!' : 'Promoção de patente!';
  useEffect(() => {
    if (performed.current) return;
    let fx: ReturnType<typeof confetti.create> | undefined;
    let stopSound: (() => void) | undefined;
    let notice: Notification | undefined;
    const start = window.setTimeout(() => {
      performed.current = true;
      if (canvas.current && localStorage.getItem('fingestao:reduzir-movimento') !== '1') {
        fx = confetti.create(canvas.current);
        void fx({ particleCount: 85, spread: 78, origin: { y: .65 }, disableForReducedMotion: true });
      }
      if (sound) stopSound = playSound();
      if ('Notification' in window && Notification.permission === 'granted') {
        try { notice = new Notification(title, { body: achievement ? 'Disponível na Galeria de Conquistas.' : 'Sua nova patente é ' + name + '.' }); }
        catch { }
      }
    }, 0);
    return () => {
      window.clearTimeout(start);
      fx?.reset();
      stopSound?.();
      notice?.close();
    };
  }, [achievement, title, name, sound]);
  return <TrailDialog title={title} onClose={onClose}>
    <div className="trail-enter relative mb-4 flex min-h-40 items-center justify-center gap-4 rounded-3xl bg-violet-100 p-4 dark:bg-violet-950/60">
      <canvas ref={canvas} width={500} height={280} className="pointer-events-none absolute inset-0 z-10 h-full w-full" aria-hidden="true" />
      <Personagem config={avatar} tamanho={88} animacao="comemorando" />
      {achievement && <div className="h-32 w-32 overflow-hidden rounded-2xl bg-white text-violet-700 shadow-md dark:bg-slate-800 dark:text-violet-200">
        <ProductArt url={achievement.produto?.imagemUrl} icon={achievement.iconeNome} />
      </div>}
      {rank && <div className="flex flex-wrap items-center justify-center gap-2">
        {previous && <><RankBadge rank={previous} /> <span aria-hidden="true">→</span></>}
        <RankBadge rank={rank} size="lg" />
      </div>}
    </div>
    {achievement && <p className="mb-3 text-sm">
      {achievement.produto && <strong>{formatCurrency(achievement.produto.preco)} · </strong>}
      {achievement.desbloqueadaEm && new Date(achievement.desbloqueadaEm).toLocaleDateString('pt-BR')}
    </p>}
    {rank && <p className="mb-3 text-sm font-semibold">+150 XP pela promoção</p>}
    <div className="flex flex-wrap justify-between gap-2">
      <button type="button" className={trailSecondary} onClick={onSound} aria-pressed={sound}>
        {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}{sound ? 'Silenciar' : 'Ativar som'}
      </button>
      <button type="button" className={trailButton} onClick={onClose}>Continuar</button>
    </div>
  </TrailDialog>;
}
