import React from 'react';
import { useApp } from '../../context/AppContext';
import type { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  ReceiptText, 
  Tags, 
  BarChart3, 
  Settings,
  FolderPlus,
  PlusCircle
} from 'lucide-react';

interface NavItem {
  id: 'dashboard' | 'folders' | 'transactions' | 'categories' | 'reports' | 'settings';
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    setSelectedFolderId, 
    folders,
    setTransactionModalOpen,
    setDefaultFolderForNewTx,
    setEditingTransaction,
    setFolderModalOpen,
    setEditingFolder
  } = useApp();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'folders', label: 'Pastas & Projetos', icon: FolderKanban, badge: folders.filter(f => f.status === 'active').length },
    { id: 'transactions', label: 'Transações', icon: ReceiptText },
    { id: 'categories', label: 'Categorias & Tetos', icon: Tags },
    { id: 'reports', label: 'Relatórios & Gráficos', icon: BarChart3 },
    { id: 'settings', label: 'Configurações & Nuvem', icon: Settings },
  ];

  const handleNavClick = (tabId: NavItem['id']) => {
    setActiveTab(tabId);
    if (tabId !== 'folders') {
      setSelectedFolderId(null);
    }
  };

  const handleQuickAddExpense = () => {
    setDefaultFolderForNewTx(null);
    setEditingTransaction(null);
    setTransactionModalOpen(true);
  };

  const handleQuickAddFolder = () => {
    setEditingFolder(null);
    setFolderModalOpen(true);
  };

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 h-[calc(100vh-4rem)] sticky top-16 transition-colors">
      
      {/* Navigation Links */}
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Menu Principal
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isActive 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Folders Quick List */}
      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Pastas Ativas
          </p>
          <button 
            onClick={handleQuickAddFolder}
            className="text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
            title="Criar nova pasta"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1">
          {folders
            .filter(f => f.status === 'active')
            .slice(0, 5)
            .map(folder => (
              <button
                key={folder.id}
                onClick={() => {
                  setActiveTab('folders');
                  setSelectedFolderId(folder.id);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-colors text-left cursor-pointer"
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                  style={{ backgroundColor: folder.color }}
                />
                <span className="truncate">{folder.name}</span>
              </button>
            ))}
          {folders.filter(f => f.status === 'active').length === 0 && (
            <p className="px-3 py-2 text-xs text-slate-400 italic">
              Nenhuma pasta ativa
            </p>
          )}
        </div>
      </div>

      {/* Bottom Quick Card */}
      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
        <button
          onClick={handleQuickAddExpense}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-98 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Lançar Gasto Rápido</span>
        </button>

        <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-slate-400">
          <span>FinGestão v1.0</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            ● 100% Pronto
          </span>
        </div>
      </div>

    </aside>
  );
};
