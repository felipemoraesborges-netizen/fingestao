export type PlayAction =
  | { type: 'state' | 'reminded' }
  | { type: 'profile'; ranking?: boolean; alias?: string; reminder?: boolean; time?: string }
  | { type: 'invite'; code: string }
  | { type: 'friend'; id: string; decision: 'accept' | 'decline' | 'remove' }
  | { type: 'buy'; item: string; request: string }
  | { type: 'equip'; item: string }
  | { type: 'build'; item: string; row: number; col: number; request: string }
  | { type: 'move'; id: string; row: number; col: number; request: string }
  | { type: 'upgrade'; id: string; tier: number; request: string };

export interface PlayItem {
  item_id: string;
  titulo: string;
  descricao: string;
  tipo: 'construcao' | 'roupa' | 'cabelo' | 'acessorio' | 'congelamento' | 'pet';
  arte: string | null;
  licao_id: string | null;
  nivel: number;
  preco: number;
}

export interface Building {
  id: string;
  item_id: string;
  linha: number;
  coluna: number;
  melhoria: number;
}

export interface PlayState {
  moedas: number;
  nivel: number;
  arvore: number;
  congelamentos: number;
  pet: string;
  ranking: boolean;
  apelido: string | null;
  codigo: string | null;
  lembrete: boolean;
  horario: string;
  notificar: boolean;
  catalogo: PlayItem[];
  inventario: string[];
  construcoes: Building[];
  amigos: { id: string; estado: 'aceita' | 'pendente'; recebida: boolean; apelido: string }[];
  placar: { apelido: string; eu: boolean; xp: number }[];
}

export function citySize(level: number) {
  return level >= 75 ? 8 : level >= 50 ? 7 : level >= 25 ? 6 : level >= 10 ? 5 : 4;
}

export const houseStages = ['Pequena casa com jardim', 'Casa inicial ampliada', 'Casa moderna com energia solar',
  'Residência sustentável', 'Sobrado moderno', 'Sobrado avançado', 'Residência com piscina', 'Residência inteligente',
  'Mansão sustentável', 'Residência tecnológica'];

export const treeStages = ['Semente', 'Broto', 'Pequena planta', 'Árvore jovem', 'Árvore desenvolvida', 'Árvore florida',
  'Árvore frutífera', 'Árvore da prosperidade', 'Árvore dourada', 'Árvore lendária'];

export const cityStages = [
  { level: 100, name: 'Metrópole sustentável lendária' }, { level: 75, name: 'Cidade inteligente' }, { level: 50, name: 'Metrópole' },
  { level: 40, name: 'Cidade desenvolvida' }, { level: 25, name: 'Pequena cidade' },
  { level: 10, name: 'Vila' }, { level: 1, name: 'Pequena propriedade' },
];
