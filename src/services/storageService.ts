import type { Category, Folder, Transaction, UserProfile } from '../types';
import { INITIAL_CATEGORIES, INITIAL_FOLDERS, INITIAL_TRANSACTIONS } from '../data/initialData';
import { getSupabaseClient } from '../lib/supabase';

const KEYS = {
  CATEGORIES: 'fingestao_categories_v1',
  FOLDERS: 'fingestao_folders_v1',
  TRANSACTIONS: 'fingestao_transactions_v1',
  PROFILE: 'fingestao_profile_v1',
};

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr-demo-1',
  email: 'usuario@fingestao.com.br',
  fullName: 'Felipe Silva',
  monthlyExpenseBudget: 5000,
};

export class StorageService {
  // --- CATEGORIAS ---
  static getCategories(): Category[] {
    const raw = localStorage.getItem(KEYS.CATEGORIES);
    if (!raw) {
      this.saveCategories(INITIAL_CATEGORIES);
      return INITIAL_CATEGORIES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CATEGORIES;
    }
  }

  static saveCategories(categories: Category[]): void {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  }

  static addCategory(category: Omit<Category, 'id'>): Category {
    const categories = this.getCategories();
    const newCategory: Category = {
      ...category,
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    categories.push(newCategory);
    this.saveCategories(categories);
    return newCategory;
  }

  static updateCategory(updated: Category): void {
    const categories = this.getCategories().map(c => (c.id === updated.id ? updated : c));
    this.saveCategories(categories);
  }

  static deleteCategory(id: string): void {
    const categories = this.getCategories().filter(c => c.id !== id);
    this.saveCategories(categories);
  }

  // --- PASTAS / PROJETOS ---
  static getFolders(): Folder[] {
    const raw = localStorage.getItem(KEYS.FOLDERS);
    if (!raw) {
      this.saveFolders(INITIAL_FOLDERS);
      return INITIAL_FOLDERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_FOLDERS;
    }
  }

  static saveFolders(folders: Folder[]): void {
    localStorage.setItem(KEYS.FOLDERS, JSON.stringify(folders));
  }

  static addFolder(folder: Omit<Folder, 'id' | 'createdAt'>): Folder {
    const folders = this.getFolders();
    const newFolder: Folder = {
      ...folder,
      id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    folders.unshift(newFolder);
    this.saveFolders(folders);
    return newFolder;
  }

  static updateFolder(updated: Folder): void {
    const folders = this.getFolders().map(f => (f.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : f));
    this.saveFolders(folders);
  }

  static toggleFolderStatus(id: string): Folder | null {
    const folders = this.getFolders();
    let updatedFolder: Folder | null = null;
    const newFolders = folders.map(f => {
      if (f.id === id) {
        updatedFolder = {
          ...f,
          status: f.status === 'active' ? 'archived' : 'active',
          updatedAt: new Date().toISOString(),
        };
        return updatedFolder;
      }
      return f;
    });
    this.saveFolders(newFolders);
    return updatedFolder;
  }

  static deleteFolder(id: string): void {
    const folders = this.getFolders().filter(f => f.id !== id);
    this.saveFolders(folders);

    // Desvincula transações associadas para não ficarem órfãs
    const transactions = this.getTransactions().map(tx => {
      if (tx.folderId === id) {
        return { ...tx, folderId: null };
      }
      return tx;
    });
    this.saveTransactions(transactions);
  }

  // --- TRANSAÇÕES ---
  static getTransactions(): Transaction[] {
    const raw = localStorage.getItem(KEYS.TRANSACTIONS);
    if (!raw) {
      this.saveTransactions(INITIAL_TRANSACTIONS);
      return INITIAL_TRANSACTIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  }

  static saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  static addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const transactions = this.getTransactions();
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    transactions.unshift(newTx);
    this.saveTransactions(transactions);
    return newTx;
  }

  static updateTransaction(updated: Transaction): void {
    const transactions = this.getTransactions().map(tx => (tx.id === updated.id ? updated : tx));
    this.saveTransactions(transactions);
  }

  static deleteTransaction(id: string): void {
    const transactions = this.getTransactions().filter(tx => tx.id !== id);
    this.saveTransactions(transactions);
  }

  // --- PERFIL ---
  static getProfile(): UserProfile {
    const raw = localStorage.getItem(KEYS.PROFILE);
    if (!raw) {
      this.saveProfile(DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  static saveProfile(profile: UserProfile): void {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  }

  // --- UTILITÁRIOS ---
  static resetToDemoData(): void {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(KEYS.FOLDERS, JSON.stringify(INITIAL_FOLDERS));
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
  }

  static clearAllData(): void {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify([]));
    localStorage.setItem(KEYS.FOLDERS, JSON.stringify([]));
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
  }

  static exportBackup(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      categories: this.getCategories(),
      folders: this.getFolders(),
      transactions: this.getTransactions(),
    };
    return JSON.stringify(backup, null, 2);
  }

  static importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.categories)) this.saveCategories(data.categories);
      if (Array.isArray(data.folders)) this.saveFolders(data.folders);
      if (Array.isArray(data.transactions)) this.saveTransactions(data.transactions);
      if (data.profile) this.saveProfile(data.profile);
      return true;
    } catch (e) {
      console.error('Erro ao importar backup:', e);
      return false;
    }
  }

  // --- SUPABASE SYNC (quando conectado) ---
  static async syncWithSupabase(): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, message: 'Supabase não configurado ou desconectado.' };
    }

    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        return { success: false, message: 'Faça login no Supabase para sincronizar seus dados.' };
      }

      // Baixa pastas do Supabase
      const { data: remoteFolders, error: foldersErr } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id);

      if (!foldersErr && remoteFolders && remoteFolders.length > 0) {
        // Converte formato banco -> app
        const mappedFolders: Folder[] = remoteFolders.map(f => ({
          id: f.id,
          name: f.name,
          description: f.description,
          targetBudget: Number(f.target_budget),
          color: f.color,
          icon: f.icon,
          status: f.status,
          startDate: f.start_date,
          endDate: f.end_date,
          createdAt: f.created_at,
          updatedAt: f.updated_at,
        }));
        this.saveFolders(mappedFolders);
      }

      // Baixa transações do Supabase
      const { data: remoteTx, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      if (!txErr && remoteTx && remoteTx.length > 0) {
        const mappedTx: Transaction[] = remoteTx.map(t => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          description: t.description,
          date: t.date,
          categoryId: t.category_id,
          folderId: t.folder_id,
          paymentMethod: t.payment_method,
          isRecurring: t.is_recurring,
          notes: t.notes,
          createdAt: t.created_at,
        }));
        this.saveTransactions(mappedTx);
      }

      return { success: true, message: 'Dados sincronizados com sucesso do Supabase!' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Erro ao sincronizar: ${errorMsg}` };
    }
  }
}
