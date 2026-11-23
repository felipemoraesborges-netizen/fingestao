export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 
  | 'pix' 
  | 'credit_card' 
  | 'debit_card' 
  | 'cash' 
  | 'bank_slip' 
  | 'transfer' 
  | 'other';

export type FolderStatus = 'active' | 'archived';

export interface Folder {
  id: string;
  name: string;
  description?: string;
  targetBudget: number; // Teto ou meta de gastos (ex: R$ 3.000)
  color: string;
  icon: string;
  status: FolderStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  budgetLimit: number; // Teto mensal de gastos (ex: R$ 600 em Lazer)
  type: TransactionType;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  categoryId: string;
  folderId?: string | null; // Vinculado a uma pasta opcional
  paymentMethod: PaymentMethod;
  isRecurring: boolean; // Despesa fixa ou recorrente mensal
  notes?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  monthlyExpenseBudget?: number;
}

export interface BudgetAlert {
  id: string;
  type: 'folder_80' | 'folder_100' | 'category_80' | 'category_100';
  severity: 'warning' | 'danger';
  title: string;
  message: string;
  percentage: number;
  currentAmount: number;
  limitAmount: number;
  folderId?: string;
  categoryId?: string;
}

export interface FilterOptions {
  month: string; // YYYY-MM
  search: string;
  type: 'all' | 'income' | 'expense';
  categoryId: string;
  folderId: string;
  paymentMethod: string;
  isRecurring: 'all' | 'recurring' | 'regular';
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}
export type InvestmentType = 'renda_fixa' | 'tesouro_direto' | 'acoes' | 'fiis' | 'cripto' | 'poupanca' | 'outro';

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  amountInvested: number;
  currentValue: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────────
// GAMIFICAÇÃO — Trilha de Conquistas
// ─────────────────────────────────────────────

export type GoalStatus = 'bloqueada' | 'em_andamento' | 'concluida';
export type ContributionType = 'aporte' | 'retirada';
export type AchievementRarity = 'comum' | 'rara' | 'epica' | 'lendaria';

export interface Goal {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  imagemUrl?: string;
  linkLoja?: string;
  prioridade?: number;
  ordemManual?: number;
  status: GoalStatus;
  valorAcumulado: number;
  conquistadoEm?: string;
  observacao?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Contribution {
  id: string;
  goalId: string;
  valor: number;
  tipo: ContributionType;
  data: string; // YYYY-MM-DD
  nota?: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  goalId?: string;
  titulo: string;
  descricao?: string;
  iconeUrl?: string;
  raridade: AchievementRarity;
  desbloqueadaEm?: string;
  personalizada: boolean;
  oculta: boolean;
  frasePessoal?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProgress {
  userId: string;
  xp: number;
  nivel: number;
  sequenciaMeses: number;
  rankAtualId?: string;
  updatedAt: string;
}

export interface Rank {
  id: string;
  nome: string;
  cor: string;
  iconeUrl?: string;
  conquistasNecessarias: number;
  ordem: number;
  padrao: boolean;
  createdAt: string;
}

export interface RankHistory {
  id: string;
  rankId: string;
  alcancadaEm: string;
}
