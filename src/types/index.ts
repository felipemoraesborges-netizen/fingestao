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
