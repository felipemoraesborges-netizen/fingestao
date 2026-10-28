import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Palmtree,
  Hammer,
  Gift,
  Car,
  Plane,
  Home,
  Utensils,
  Sparkles,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  Tv,
  Briefcase,
  Laptop,
  TrendingUp,
  Folder,
  Coffee,
  Music,
  Gamepad2,
  Dumbbell,
  Wrench,
  Camera,
  CreditCard,
  Heart,
  Luggage,
  PartyPopper
} from 'lucide-react';

export const ICON_OPTIONS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: 'Folder', label: 'Pasta', icon: Folder },
  { name: 'Palmtree', label: 'Praia / Férias', icon: Palmtree },
  { name: 'Plane', label: 'Viagem / Voo', icon: Plane },
  { name: 'Hammer', label: 'Reforma / Obra', icon: Hammer },
  { name: 'Home', label: 'Casa / Moradia', icon: Home },
  { name: 'Gift', label: 'Presente / Natal', icon: Gift },
  { name: 'Car', label: 'Carro / Auto', icon: Car },
  { name: 'PartyPopper', label: 'Festa / Evento', icon: PartyPopper },
  { name: 'Utensils', label: 'Alimentação', icon: Utensils },
  { name: 'Coffee', label: 'Café / Bar', icon: Coffee },
  { name: 'Sparkles', label: 'Lazer', icon: Sparkles },
  { name: 'ShoppingBag', label: 'Compras', icon: ShoppingBag },
  { name: 'HeartPulse', label: 'Saúde', icon: HeartPulse },
  { name: 'GraduationCap', label: 'Educação', icon: GraduationCap },
  { name: 'Laptop', label: 'Tecnologia / Trabalho', icon: Laptop },
  { name: 'Briefcase', label: 'Negócios / Emprego', icon: Briefcase },
  { name: 'Tv', label: 'Assinaturas / Streaming', icon: Tv },
  { name: 'Dumbbell', label: 'Academia / Treino', icon: Dumbbell },
  { name: 'Music', label: 'Música / Shows', icon: Music },
  { name: 'Gamepad2', label: 'Games', icon: Gamepad2 },
  { name: 'Camera', label: 'Fotografia', icon: Camera },
  { name: 'Luggage', label: 'Bagagem', icon: Luggage },
  { name: 'Wrench', label: 'Manutenção', icon: Wrench },
  { name: 'Heart', label: 'Família / Casamento', icon: Heart },
  { name: 'CreditCard', label: 'Cartões', icon: CreditCard },
  { name: 'TrendingUp', label: 'Investimentos', icon: TrendingUp },
];

export const COLOR_OPTIONS = [
  { name: 'Ciano Oceano', value: '#06b6d4' },
  { name: 'Azul Real', value: '#3b82f6' },
  { name: 'Índigo Noturno', value: '#6366f1' },
  { name: 'Roxo Violeta', value: '#8b5cf6' },
  { name: 'Rosa Vibrante', value: '#ec4899' },
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Verde Oliva', value: '#84cc16' },
  { name: 'Âmbar Dourado', value: '#f59e0b' },
  { name: 'Laranja Quente', value: '#f97316' },
  { name: 'Vermelho Rubi', value: '#ef4444' },
  { name: 'Ardósia / Grafite', value: '#64748b' },
];

export function renderIcon(iconName: string, className: string = 'w-5 h-5'): React.ReactNode {
  const found = ICON_OPTIONS.find(i => i.name.toLowerCase() === (iconName || '').toLowerCase());
  const IconComponent = found ? found.icon : Folder;
  return <IconComponent className={className} />;
}
