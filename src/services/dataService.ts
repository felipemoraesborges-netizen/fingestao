import type { Category, Folder, Transaction, UserProfile, FolderStatus } from '../types';
import { StorageService } from './storageService';
import { getSupabaseClient } from '../lib/supabase';
import { INITIAL_CATEGORIES } from '../data/initialData';

export interface MigrationResult {
  success: boolean;
  message: string;
  counts: {
    categories: number;
    folders: number;
    transactions: number;
  };
}

export class DataService {
  /**
   * Determina se o usuário atual está autenticado no Supabase
   */
  static async getCurrentUserId(): Promise<string | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      return user.id;
    } catch {
      return null;
    }
  }

  // ==========================================
  // CATEGORIAS
  // ==========================================
  static async getCategories(userId?: string | null): Promise<Category[]> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) {
      return StorageService.getCategories();
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Se for um usuário novo sem nenhuma categoria, cria as categorias padrão
      if (!data || data.length === 0) {
        const seeded = await this.seedDefaultCategories(userId);
        return seeded;
      }

      return data.map(item => ({
        id: item.id,
        name: item.name,
        icon: item.icon,
        color: item.color,
        budgetLimit: Number(item.budget_limit || 0),
        type: item.type,
      }));
    } catch (err) {
      console.error('Erro ao buscar categorias no Supabase, usando local:', err);
      return StorageService.getCategories();
    }
  }

  static async seedDefaultCategories(userId: string): Promise<Category[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return INITIAL_CATEGORIES;

    try {
      const payload = INITIAL_CATEGORIES.map(cat => ({
        id: cat.id,
        user_id: userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        budget_limit: cat.budgetLimit,
        type: cat.type,
      }));

      const { data, error } = await supabase
        .from('categories')
        .insert(payload)
        .select();

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        icon: item.icon,
        color: item.color,
        budgetLimit: Number(item.budget_limit || 0),
        type: item.type,
      }));
    } catch (e) {
      console.warn('Não foi possível semear categorias padrão na nuvem:', e);
      return INITIAL_CATEGORIES;
    }
  }

  static async addCategory(cat: Omit<Category, 'id'>, userId?: string | null): Promise<Category> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) {
      return StorageService.addCategory(cat);
    }

    const newId = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const { data, error } = await supabase
      .from('categories')
      .insert({
        id: newId,
        user_id: userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        budget_limit: cat.budgetLimit,
        type: cat.type,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar categoria no Supabase:', error);
      throw new Error(`Falha ao salvar categoria no banco: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      icon: data.icon,
      color: data.color,
      budgetLimit: Number(data.budget_limit || 0),
      type: data.type,
    };
  }

  static async updateCategory(cat: Category, userId?: string | null): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) {
      StorageService.updateCategory(cat);
      return;
    }

    const { error } = await supabase
      .from('categories')
      .update({
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        budget_limit: cat.budgetLimit,
        type: cat.type,
      })
      .eq('id', cat.id)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao atualizar categoria no Supabase:', error);
      throw new Error(`Falha ao atualizar categoria: ${error.message}`);
    }
  }

  static async deleteCategory(id: string, userId?: string | null): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) {
      StorageService.deleteCategory(id);
      return;
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao excluir categoria no Supabase:', error);
      throw new Error(`Falha ao excluir categoria: ${error.message}`);
    }
  }

  // ==========================================
  // PASTAS / PROJETOS / EVENTOS
  // ==========================================
  static async getFolders(userId?: string | null): Promise<Folder[]> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) {
      return StorageService.getFolders();
    }

    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(f => ({
        id: f.id,
        name: f.name,
        description: f.description || undefined,
        targetBudget: Number(f.target_budget || 0),
        color: f.color,
        icon: f.icon,
        status: f.status as FolderStatus,
        startDate: f.start_date || undefined,
        endDate: f.end_date || undefined,
        createdAt: f.created_at,
        updatedAt: f.updated_at || undefined,
      }));
    } catch (err) {
      console.error('Erro ao buscar pastas no Supabase, usando local:', err);
      return StorageService.getFolders();
    }
  }

  static async addFolder(folder: Omit<Folder, 'id' | 'createdAt'>, userId?: string | null): Promise<Folder> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) {
      return StorageService.addFolder(folder);
    }

    const newId = `folder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('folders')
      .insert({
        id: newId,
        user_id: userId,
        name: folder.name,
        description: folder.description || null,
        target_budget: folder.targetBudget,
        color: folder.color,
        icon: folder.icon,
        status: folder.status,
        start_date: folder.startDate || null,
        end_date: folder.endDate || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar pasta no Supabase:', error);
      throw new Error(`Falha ao salvar pasta: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      targetBudget: Number(data.target_budget || 0),
      color: data.color,
      icon: data.icon,
      status: data.status as FolderStatus,
      startDate: data.start_date || undefined,
      endDate: data.end_date || undefined,
      createdAt: data.created_at || now,
      updatedAt: data.updated_at || undefined,
    };
  }

  static async updateFolder(folder: Folder, userId?: string | null): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) {
      StorageService.updateFolder(folder);
      return;
    }

    const { error } = await supabase
      .from('folders')
      .update({
        name: folder.name,
        description: folder.description || null,
        target_budget: folder.targetBudget,
        color: folder.color,
        icon: folder.icon,
        status: folder.status,
        start_date: folder.startDate || null,
        end_date: folder.endDate || null,
      })
      .eq('id', folder.id)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao atualizar pasta no Supabase:', error);
      throw new Error(`Falha ao atualizar pasta: ${error.message}`);
    }
  }

  static async toggleFolderStatus(id: string, currentStatus: FolderStatus, userId?: string | null): Promise<Folder | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) {
      return StorageService.toggleFolderStatus(id);
    }

    const newStatus: FolderStatus = currentStatus === 'active' ? 'archived' : 'active';
    const { data, error } = await supabase
      .from('folders')
      .update({ status: newStatus })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      console.error('Erro ao alternar status da pasta:', error);
      throw new Error(`Falha ao alternar status da pasta: ${error?.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      targetBudget: Number(data.target_budget || 0),
      color: data.color,
      icon: data.icon,
      status: data.status as FolderStatus,
      startDate: data.start_date || undefined,
      endDate: data.end_date || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at || undefined,
    };
  }

  static async deleteFolder(id: string, userId?: string | null): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) {
      StorageService.deleteFolder(id);
      return;
    }

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao excluir pasta no Supabase:', error);
      throw new Error(`Falha ao excluir pasta: ${error.message}`);
    }
  }

  // ==========================================
  // TRANSAÇÕES
  // ==========================================
  static async getTransactions(userId?: string | null): Promise<Transaction[]> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) {
      return StorageService.getTransactions();
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;

      return (data || []).map(t => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        description: t.description,
        date: t.date,
        categoryId: t.category_id,
        folderId: t.folder_id || null,
        paymentMethod: t.payment_method,
        isRecurring: Boolean(t.is_recurring),
        notes: t.notes || undefined,
        createdAt: t.created_at,
      }));
    } catch (err) {
      console.error('Erro ao buscar transações no Supabase, usando local:', err);
      return StorageService.getTransactions();
    }
  }

  static async addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>, userId?: string | null): Promise<Transaction> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) {
      return StorageService.addTransaction(tx);
    }

    const newId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        id: newId,
        user_id: userId,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        date: tx.date,
        category_id: tx.categoryId,
        folder_id: tx.folderId || null,
        payment_method: tx.paymentMethod,
        is_recurring: tx.isRecurring,
        notes: tx.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar transação no Supabase:', error);
      throw new Error(`Falha ao registrar transação no banco: ${error.message}`);
    }

    return {
      id: data.id,
      type: data.type,
      amount: Number(data.amount),
      description: data.description,
      date: data.date,
      categoryId: data.category_id,
      folderId: data.folder_id || null,
      paymentMethod: data.payment_method,
      isRecurring: Boolean(data.is_recurring),
      notes: data.notes || undefined,
      createdAt: data.created_at || now,
    };
  }

  static async updateTransaction(tx: Transaction, userId?: string | null): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) {
      StorageService.updateTransaction(tx);
      return;
    }

    const { error } = await supabase
      .from('transactions')
      .update({
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        date: tx.date,
        category_id: tx.categoryId,
        folder_id: tx.folderId || null,
        payment_method: tx.paymentMethod,
        is_recurring: tx.isRecurring,
        notes: tx.notes || null,
      })
      .eq('id', tx.id)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao atualizar transação no Supabase:', error);
      throw new Error(`Falha ao atualizar transação: ${error.message}`);
    }
  }

  static async deleteTransaction(id: string, userId?: string | null): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) {
      StorageService.deleteTransaction(id);
      return;
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao excluir transação no Supabase:', error);
      throw new Error(`Falha ao excluir transação: ${error.message}`);
    }
  }

  // ==========================================
  // PERFIL DO USUÁRIO
  // ==========================================
  static async getProfile(userId?: string | null, userEmail?: string | null): Promise<UserProfile> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) {
      return StorageService.getProfile();
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Cria perfil básico se ainda não existir
        const newProfile: UserProfile = {
          id: userId,
          email: userEmail || 'usuario@fingestao.com.br',
          fullName: userEmail ? userEmail.split('@')[0] : 'Usuário FinGestão',
          monthlyExpenseBudget: 5000,
        };
        await this.updateProfile(newProfile, userId);
        return newProfile;
      }

      return {
        id: data.id,
        email: data.email || userEmail || '',
        fullName: data.full_name || 'Usuário FinGestão',
        avatarUrl: data.avatar_url || undefined,
        monthlyExpenseBudget: Number(data.monthly_expense_budget || 5000),
      };
    } catch (err) {
      console.error('Erro ao buscar perfil no Supabase, usando local:', err);
      return StorageService.getProfile();
    }
  }

  static async updateProfile(profile: UserProfile, userId?: string | null): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) {
      StorageService.saveProfile(profile);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: profile.email,
        full_name: profile.fullName,
        monthly_expense_budget: profile.monthlyExpenseBudget,
        avatar_url: profile.avatarUrl || null,
      });

    if (error) {
      console.error('Erro ao salvar perfil no Supabase:', error);
      throw new Error(`Falha ao atualizar perfil: ${error.message}`);
    }
  }

  // ==========================================
  // MIGRAÇÃO DE DADOS LOCAIS PARA A NUVEM
  // ==========================================
  static async migrateLocalDataToCloud(userId: string): Promise<MigrationResult> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        message: 'Cliente Supabase não configurado.',
        counts: { categories: 0, folders: 0, transactions: 0 },
      };
    }

    try {
      // 1. Obter dados locais atuais
      const localCategories = StorageService.getCategories();
      const localFolders = StorageService.getFolders();
      const localTransactions = StorageService.getTransactions();
      const localProfile = StorageService.getProfile();

      // 2. Buscar dados existentes na nuvem para não duplicar
      const [remoteCatsRes, remoteFoldersRes, remoteTxRes] = await Promise.all([
        supabase.from('categories').select('id, name').eq('user_id', userId),
        supabase.from('folders').select('id, name').eq('user_id', userId),
        supabase.from('transactions').select('id, description, amount, date').eq('user_id', userId),
      ]);

      const existingCatNames = new Set((remoteCatsRes.data || []).map(c => c.name.toLowerCase()));
      const existingFolderNames = new Set((remoteFoldersRes.data || []).map(f => f.name.toLowerCase()));
      const existingTxKeys = new Set(
        (remoteTxRes.data || []).map(t => `${t.description.toLowerCase()}_${Number(t.amount)}_${t.date}`)
      );

      let migratedCategoriesCount = 0;
      let migratedFoldersCount = 0;
      let migratedTransactionsCount = 0;

      // 3. Migrar Categorias
      const categoriesToInsert = localCategories.filter(
        c => !existingCatNames.has(c.name.toLowerCase())
      );

      if (categoriesToInsert.length > 0) {
        const payload = categoriesToInsert.map(c => ({
          id: c.id,
          user_id: userId,
          name: c.name,
          icon: c.icon,
          color: c.color,
          budget_limit: c.budgetLimit,
          type: c.type,
        }));
        const { error: catErr } = await supabase.from('categories').insert(payload);
        if (catErr) console.warn('Aviso ao migrar categorias:', catErr.message);
        else migratedCategoriesCount = categoriesToInsert.length;
      }

      // 4. Migrar Pastas
      const foldersToInsert = localFolders.filter(
        f => !existingFolderNames.has(f.name.toLowerCase())
      );

      if (foldersToInsert.length > 0) {
        const payload = foldersToInsert.map(f => ({
          id: f.id,
          user_id: userId,
          name: f.name,
          description: f.description || null,
          target_budget: f.targetBudget,
          color: f.color,
          icon: f.icon,
          status: f.status,
          start_date: f.startDate || null,
          end_date: f.endDate || null,
          created_at: f.createdAt,
        }));
        const { error: folderErr } = await supabase.from('folders').insert(payload);
        if (folderErr) console.warn('Aviso ao migrar pastas:', folderErr.message);
        else migratedFoldersCount = foldersToInsert.length;
      }

      // 5. Migrar Transações
      const transactionsToInsert = localTransactions.filter(
        t => !existingTxKeys.has(`${t.description.toLowerCase()}_${t.amount}_${t.date}`)
      );

      if (transactionsToInsert.length > 0) {
        const payload = transactionsToInsert.map(t => ({
          id: t.id,
          user_id: userId,
          type: t.type,
          amount: t.amount,
          description: t.description,
          date: t.date,
          category_id: t.categoryId,
          folder_id: t.folderId || null,
          payment_method: t.paymentMethod,
          is_recurring: t.isRecurring,
          notes: t.notes || null,
          created_at: t.createdAt,
        }));
        const { error: txErr } = await supabase.from('transactions').insert(payload);
        if (txErr) console.warn('Aviso ao migrar transações:', txErr.message);
        else migratedTransactionsCount = transactionsToInsert.length;
      }

      // 6. Atualizar Perfil na nuvem
      await this.updateProfile(localProfile, userId);

      return {
        success: true,
        message: 'Dados locais migrados com sucesso para a nuvem!',
        counts: {
          categories: migratedCategoriesCount,
          folders: migratedFoldersCount,
          transactions: migratedTransactionsCount,
        },
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Falha durante a migração: ${errorMsg}`,
        counts: { categories: 0, folders: 0, transactions: 0 },
      };
    }
  }
}
