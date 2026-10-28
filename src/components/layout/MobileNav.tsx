import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  ReceiptText, 
  Plus, 
  Menu, 
  Tags, 
  BarChart3, 
  Settings,
  X 
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    setSelectedFolderId, 
    setTransactionModalOpen, 
    setDefaultFolderForNewTx,
    setEditingTransaction 
  } = useApp();

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const handleNav = (tab: 'dashboard' | 'folders' | 'transactions' | 'categories' | 'reports' | 'settings') => {
    setActiveTab(tab);
    if (tab !== 'folders') {
      setSelectedFolderId(null);
    }
    setMoreMenuOpen(false);
  };

  const handleOpenNew = () => {
    setDefaultFolderForNewTx(null);
    setEditingTransaction(null);
    setTransactionModalOpen(true);
  };

  return (
    <>
      {/* "Mais Opções" Drawer Modal on Mobile */}
      {moreMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end lg:hidden animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-base text-slate-800 dark:text-slate-100">Mais Recursos</span>
              <button 
                onClick={() => setMoreMenuOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleNav('categories')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                  activeTab === 'categories'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Tags className="w-6 h-6 mb-1 text-emerald-500" />
                <span className="text-xs">Categorias</span>
              </button>

              <button
                onClick={() => handleNav('reports')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                  activeTab === 'reports'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <BarChart3 className="w-6 h-6 mb-1 text-blue-500" />
                <span className="text-xs">Relatórios</span>
              </button>

              <button
                onClick={() => handleNav('settings')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                  activeTab === 'settings'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Settings className="w-6 h-6 mb-1 text-purple-500" />
                <span className="text-xs">Ajustes & Nuvem</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 lg:hidden px-3 py-2 flex items-center justify-around shadow-lg">
        
        {/* Dashboard */}
        <button
          onClick={() => handleNav('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
            activeTab === 'dashboard'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Início</span>
        </button>

        {/* Pastas */}
        <button
          onClick={() => handleNav('folders')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
            activeTab === 'folders'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <FolderKanban className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Pastas</span>
        </button>

        {/* Center Floating (+) Button */}
        <div className="relative -top-5">
          <button
            onClick={handleOpenNew}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-emerald-600/40 border-4 border-slate-50 dark:border-slate-950 active:scale-95 transition-transform"
            aria-label="Adicionar Nova Despesa ou Receita"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Transações */}
        <button
          onClick={() => handleNav('transactions')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
            activeTab === 'transactions'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <ReceiptText className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Extrato</span>
        </button>

        {/* Mais */}
        <button
          onClick={() => setMoreMenuOpen(true)}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
            ['categories', 'reports', 'settings'].includes(activeTab)
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Mais</span>
        </button>

      </nav>
    </>
  );
};
