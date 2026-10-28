import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Category, Folder, Transaction, UserProfile, BudgetAlert } from '../types';
import { StorageService } from '../services/storageService';
import type { MigrationResult } from '../services/dataService';
import { DataService } from '../services/dataService';
import { getCurrentMonthStr } from '../utils/formatters';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import confetti from 'canvas-confetti';

interface AppContextType {
  // Navigation
  activeTab: 'dashboard' | 'folders' | 'transactions' | 'categories' | 'reports' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'folders' | 'transactions' | 'categories' | 'reports' | 'settings') => void;
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;

  // Theme
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;

  // Data
  categories: Category[];
  folders: Folder[];
  transactions: Transaction[];
  profile: UserProfile;
  alerts: BudgetAlert[];
  isLoadingData: boolean;

  // Cloud / Auth state
  currentUser: User | null;
  session: Session | null;
  isCloudActive: boolean;
  isSupabaseConfigured: boolean;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addFolder: (folder: Omit<Folder, 'id' | 'createdAt'>) => Promise<Folder>;
  updateFolder: (folder: Folder) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  toggleFolderStatus: (id: string) => Promise<void>;

  addCategory: (cat: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (cat: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  updateProfile: (profile: UserProfile) => Promise<void>;
  resetDemoData: () => void;
  clearAllData: () => void;
  triggerCelebration: () => void;

  // Migration & Sync
  migrateLocalDataToCloud: () => Promise<MigrationResult>;
  refreshData: () => Promise<void>;

  // Auth Functions
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;

  // Modals
  transactionModalOpen: boolean;
  setTransactionModalOpen: (open: boolean) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (tx: Transaction | null) => void;
  defaultFolderForNewTx: string | null;
  setDefaultFolderForNewTx: (folderId: string | null) => void;

  folderModalOpen: boolean;
  setFolderModalOpen: (open: boolean) => void;
  editingFolder: Folder | null;
  setEditingFolder: (folder: Folder | null) => void;

  categoryModalOpen: boolean;
  setCategoryModalOpen: (open: boolean) => void;
  editingCategory: Category | null;
  setEditingCategory: (cat: Category | null) => void;

  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;

  // Notification Banner
  dismissedAlertIds: string[];
  dismissAlert: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'folders' | 'transactions' | 'categories' | 'reports' | 'settings'>('dashboard');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('fingestao_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Auth & Cloud state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Data state
  const [categories, setCategories] = useState<Category[]>(() => StorageService.getCategories());
  const [folders, setFolders] = useState<Folder[]>(() => StorageService.getFolders());
  const [transactions, setTransactions] = useState<Transaction[]>(() => StorageService.getTransactions());
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  // Modals state
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [defaultFolderForNewTx, setDefaultFolderForNewTx] = useState<string | null>(null);

  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Sync dark mode class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fingestao_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fingestao_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Carregar dados (da nuvem se autenticado, ou do localStorage se offline/demo)
  const loadDataForUser = async (user: User | null) => {
    setIsLoadingData(true);
    try {
      if (user) {
        const [cats, flds, txs, prof] = await Promise.all([
          DataService.getCategories(user.id),
          DataService.getFolders(user.id),
          DataService.getTransactions(user.id),
          DataService.getProfile(user.id, user.email),
        ]);
        setCategories(cats);
        setFolders(flds);
        setTransactions(txs);
        setProfile(prof);
      } else {
        // Modo local / demo
        setCategories(StorageService.getCategories());
        setFolders(StorageService.getFolders());
        setTransactions(StorageService.getTransactions());
        setProfile(StorageService.getProfile());
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Observador de Autenticação Supabase
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Verificar sessão existente inicial
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      const user = currentSession?.user || null;
      setCurrentUser(user);
      loadDataForUser(user);
    });

    // Escutar eventos de auth (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      const user = newSession?.user || null;
      setCurrentUser(user);

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (user) {
          await loadDataForUser(user);
        }
      } else if (event === 'SIGNED_OUT') {
        await loadDataForUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshData = async () => {
    await loadDataForUser(currentUser);
  };

  // Compute Alerts for Folders and Categories exceeding 80% or 100%
  const alerts = useMemo<BudgetAlert[]>(() => {
    const computedAlerts: BudgetAlert[] = [];

    // 1. Folders Alerts
    folders
      .filter(f => f.status === 'active' && f.targetBudget > 0)
      .forEach(folder => {
        const spent = transactions
          .filter(t => t.folderId === folder.id && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const pct = (spent / folder.targetBudget) * 100;

        if (pct >= 100) {
          computedAlerts.push({
            id: `alert-folder-100-${folder.id}`,
            type: 'folder_100',
            severity: 'danger',
            title: `Limite Ultrapassado na Pasta "${folder.name}"!`,
            message: `Você gastou R$ ${spent.toFixed(2)} da meta de R$ ${folder.targetBudget.toFixed(2)} (${pct.toFixed(0)}%).`,
            percentage: pct,
            currentAmount: spent,
            limitAmount: folder.targetBudget,
            folderId: folder.id,
          });
        } else if (pct >= 80) {
          computedAlerts.push({
            id: `alert-folder-80-${folder.id}`,
            type: 'folder_80',
            severity: 'warning',
            title: `Atenção: 80% atingido na Pasta "${folder.name}"`,
            message: `Você já utilizou ${pct.toFixed(0)}% do orçamento planejado para este projeto.`,
            percentage: pct,
            currentAmount: spent,
            limitAmount: folder.targetBudget,
            folderId: folder.id,
          });
        }
      });

    // 2. Categories Alerts (in selected month)
    categories
      .filter(c => c.type === 'expense' && c.budgetLimit > 0)
      .forEach(cat => {
        const spent = transactions
          .filter(t => t.categoryId === cat.id && t.type === 'expense' && t.date.startsWith(selectedMonth))
          .reduce((sum, t) => sum + t.amount, 0);

        const pct = (spent / cat.budgetLimit) * 100;

        if (pct >= 100) {
          computedAlerts.push({
            id: `alert-cat-100-${cat.id}-${selectedMonth}`,
            type: 'category_100',
            severity: 'danger',
            title: `Teto Estourado em ${cat.name}!`,
            message: `Gastos de R$ ${spent.toFixed(2)} ultrapassaram o teto mensal de R$ ${cat.budgetLimit.toFixed(2)}.`,
            percentage: pct,
            currentAmount: spent,
            limitAmount: cat.budgetLimit,
            categoryId: cat.id,
          });
        } else if (pct >= 80) {
          computedAlerts.push({
            id: `alert-cat-80-${cat.id}-${selectedMonth}`,
            type: 'category_80',
            severity: 'warning',
            title: `Alerta: 80% do teto em ${cat.name}`,
            message: `Você atingiu ${pct.toFixed(0)}% do orçamento estipulado para ${cat.name} este mês.`,
            percentage: pct,
            currentAmount: spent,
            limitAmount: cat.budgetLimit,
            categoryId: cat.id,
          });
        }
      });

    return computedAlerts;
  }, [folders, categories, transactions, selectedMonth]);

  const dismissAlert = (id: string) => {
    setDismissedAlertIds(prev => [...prev, id]);
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Transactions CRUD
  const addTransaction = async (tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
    try {
      const created = await DataService.addTransaction(tx, currentUser?.id);
      setTransactions(prev => [created, ...prev]);
      return created;
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar transação.');
      throw err;
    }
  };

  const updateTransaction = async (tx: Transaction): Promise<void> => {
    try {
      await DataService.updateTransaction(tx, currentUser?.id);
      setTransactions(prev => prev.map(t => (t.id === tx.id ? tx : t)));
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar transação.');
      throw err;
    }
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    try {
      await DataService.deleteTransaction(id, currentUser?.id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir transação.');
      throw err;
    }
  };

  // Folders CRUD
  const addFolder = async (folderData: Omit<Folder, 'id' | 'createdAt'>): Promise<Folder> => {
    try {
      const created = await DataService.addFolder(folderData, currentUser?.id);
      setFolders(prev => [created, ...prev]);
      return created;
    } catch (err: any) {
      alert(err.message || 'Erro ao criar pasta.');
      throw err;
    }
  };

  const updateFolder = async (folder: Folder): Promise<void> => {
    try {
      await DataService.updateFolder(folder, currentUser?.id);
      setFolders(prev => prev.map(f => (f.id === folder.id ? folder : f)));
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar pasta.');
      throw err;
    }
  };

  const deleteFolder = async (id: string): Promise<void> => {
    try {
      await DataService.deleteFolder(id, currentUser?.id);
      setFolders(prev => prev.filter(f => f.id !== id));
      setTransactions(prev => prev.map(t => (t.folderId === id ? { ...t, folderId: null } : t)));
      if (selectedFolderId === id) {
        setSelectedFolderId(null);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir pasta.');
      throw err;
    }
  };

  const toggleFolderStatus = async (id: string): Promise<void> => {
    try {
      const current = folders.find(f => f.id === id);
      if (!current) return;
      const updated = await DataService.toggleFolderStatus(id, current.status, currentUser?.id);
      if (updated) {
        setFolders(prev => prev.map(f => (f.id === id ? updated : f)));
        if (updated.status === 'archived') {
          const spent = transactions
            .filter(t => t.folderId === id && t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
          if (spent <= updated.targetBudget) {
            triggerCelebration();
          }
        }
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao alternar status da pasta.');
    }
  };

  // Categories CRUD
  const addCategory = async (catData: Omit<Category, 'id'>): Promise<Category> => {
    try {
      const created = await DataService.addCategory(catData, currentUser?.id);
      setCategories(prev => [...prev, created]);
      return created;
    } catch (err: any) {
      alert(err.message || 'Erro ao criar categoria.');
      throw err;
    }
  };

  const updateCategory = async (cat: Category): Promise<void> => {
    try {
      await DataService.updateCategory(cat, currentUser?.id);
      setCategories(prev => prev.map(c => (c.id === cat.id ? cat : c)));
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar categoria.');
      throw err;
    }
  };

  const deleteCategory = async (id: string): Promise<void> => {
    try {
      await DataService.deleteCategory(id, currentUser?.id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir categoria.');
      throw err;
    }
  };

  // Profile
  const updateProfile = async (newProfile: UserProfile): Promise<void> => {
    try {
      await DataService.updateProfile(newProfile, currentUser?.id);
      setProfile(newProfile);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar perfil.');
    }
  };

  // Reset local demo data
  const resetDemoData = () => {
    StorageService.resetToDemoData();
    setCategories(StorageService.getCategories());
    setFolders(StorageService.getFolders());
    setTransactions(StorageService.getTransactions());
    setProfile(StorageService.getProfile());
    setDismissedAlertIds([]);
  };

  const clearAllData = () => {
    StorageService.clearAllData();
    setCategories([]);
    setFolders([]);
    setTransactions([]);
    setDismissedAlertIds([]);
  };

  // Migration of local data into Supabase
  const migrateLocalDataToCloud = async (): Promise<MigrationResult> => {
    if (!currentUser) {
      return {
        success: false,
        message: 'Você precisa estar logado na sua conta Supabase para enviar os dados para a nuvem.',
        counts: { categories: 0, folders: 0, transactions: 0 },
      };
    }

    const result = await DataService.migrateLocalDataToCloud(currentUser.id);
    if (result.success) {
      await refreshData();
      triggerCelebration();
    }
    return result;
  };

  // Auth Functions
  const signInWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase não está configurado. Verifique as credenciais.' };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });
      if (error) return { success: false, error: error.message };
      setCurrentUser(data.user);
      setSession(data.session);
      await loadDataForUser(data.user);
      triggerCelebration();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao autenticar.' };
    }
  };

  const signUpWithEmail = async (email: string, pass: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase não está configurado. Verifique as credenciais.' };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: { full_name: fullName.trim() },
        },
      });
      if (error) return { success: false, error: error.message };
      setCurrentUser(data.user);
      setSession(data.session);
      if (data.user) {
        await loadDataForUser(data.user);
      }
      triggerCelebration();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao cadastrar conta.' };
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      alert('Configure o Supabase primeiro nas configurações.');
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      alert(`Erro no login com Google: ${error.message}`);
    }
  };

  const signOut = async (): Promise<void> => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setSession(null);
    await loadDataForUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedFolderId,
        setSelectedFolderId,
        selectedMonth,
        setSelectedMonth,
        darkMode,
        setDarkMode,
        toggleDarkMode,
        categories,
        folders,
        transactions,
        profile,
        alerts: alerts.filter(a => !dismissedAlertIds.includes(a.id)),
        isLoadingData,
        currentUser,
        session,
        isCloudActive: Boolean(currentUser),
        isSupabaseConfigured: isSupabaseConfigured(),
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addFolder,
        updateFolder,
        deleteFolder,
        toggleFolderStatus,
        addCategory,
        updateCategory,
        deleteCategory,
        updateProfile,
        resetDemoData,
        clearAllData,
        triggerCelebration,
        migrateLocalDataToCloud,
        refreshData,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        transactionModalOpen,
        setTransactionModalOpen,
        editingTransaction,
        setEditingTransaction,
        defaultFolderForNewTx,
        setDefaultFolderForNewTx,
        folderModalOpen,
        setFolderModalOpen,
        editingFolder,
        setEditingFolder,
        categoryModalOpen,
        setCategoryModalOpen,
        editingCategory,
        setEditingCategory,
        authModalOpen,
        setAuthModalOpen,
        dismissedAlertIds,
        dismissAlert,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
};
