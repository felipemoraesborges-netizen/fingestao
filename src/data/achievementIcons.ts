import { Armchair, Award, BedDouble, Car, CookingPot, Gift, Headphones, Laptop, Medal, Monitor, Plane, Refrigerator, Shirt, Star, Trophy, Utensils } from 'lucide-react';

export const achievementIcons = {
  Trophy: { label: 'Troféu', Icon: Trophy },
  Medal: { label: 'Medalha', Icon: Medal },
  Award: { label: 'Distintivo', Icon: Award },
  Star: { label: 'Estrela', Icon: Star },
  Gift: { label: 'Presente', Icon: Gift },
  Refrigerator: { label: 'Geladeira', Icon: Refrigerator },
  Armchair: { label: 'Sofá', Icon: Armchair },
  BedDouble: { label: 'Cama', Icon: BedDouble },
  Monitor: { label: 'TV', Icon: Monitor },
  CookingPot: { label: 'Fogão', Icon: CookingPot },
  Utensils: { label: 'Cozinha', Icon: Utensils },
  Car: { label: 'Carro', Icon: Car },
  Plane: { label: 'Viagem', Icon: Plane },
  Laptop: { label: 'Computador', Icon: Laptop },
  Shirt: { label: 'Roupa', Icon: Shirt },
  Headphones: { label: 'Fone', Icon: Headphones },
};

export type AchievementIconName = keyof typeof achievementIcons;

export function productIcon(name: string, category: string): AchievementIconName {
  const words = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/geladeira|refrigerador|freezer/.test(words)) return 'Refrigerator';
  if (/sofa|poltrona/.test(words)) return 'Armchair';
  if (/cama|colchao/.test(words)) return 'BedDouble';
  if (/\btv\b|televisao|monitor/.test(words)) return 'Monitor';
  if (/fogao|cooktop|forno/.test(words)) return 'CookingPot';
  if (/carro|veiculo|automovel/.test(words)) return 'Car';
  if (/viagem|passagem/.test(words)) return 'Plane';
  const categories: Record<string, AchievementIconName> = {
    cozinha: 'Utensils', quarto: 'BedDouble', sala: 'Armchair', viagem: 'Plane',
    tecnologia: 'Laptop', escritório: 'Laptop', moda: 'Shirt', lazer: 'Gift',
  };
  return categories[category.toLowerCase()] ?? 'Trophy';
}

export function achievementIcon(name?: string) {
  return name && Object.hasOwn(achievementIcons, name) ? achievementIcons[name as AchievementIconName].Icon : Trophy;
}
