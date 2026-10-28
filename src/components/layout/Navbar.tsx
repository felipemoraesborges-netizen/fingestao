import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sun, 
  Moon, 
  Plus, 
  FolderPlus, 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Cloud,
  CloudOff,
  Loader2
} from 'lucide-react';
import { formatMonthName } from '../../utils/formatters';

export const Navbar: React.FC = () => {
  const { 
    darkMode, 
    toggleDarkMode, 
    selectedMonth, 
    setSelectedMonth, 
    alerts, 
    setTransactionModalOpen, 
    setDefaultFolderForNewTx,
    setEditingTransaction,
    setFolderModalOpen,
    setEditingFolder,
    currentUser,
    isCloudActive,
    isLoadingData,
    setAuthModalOpen,
    setActiveTab
  } = useApp();

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const handleOpenNewExpense = () => {
    setDefaultFolderForNewTx(null);
    setEditingTransaction(null);
    setTransactionModalOpen(true);
  };

  const handleOpenNewFolder = () => {
    setEditingFolder(null);
    setFolderModalOpen(true);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                Fin<span className="text-emerald-500">Gestão</span>
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Pastas & Orçamento
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Gestão de Orçamento & Projetos
            </p>
          </div>
        </div>

        {/* Month Selector in Header */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 select-none min-w-[130px] sm:min-w-[150px] justify-center">
            {isLoadingData ? (
              <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
            ) : (
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span>{formatMonthName(selectedMonth)}</span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Action Icons & Buttons */}
        <div className="flex items-center gap-2">
          {/* Cloud Sync Status Indicator */}
          <button 
            onClick={() => setAuthModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-xl font-semibold transition-all cursor-pointer ${
              isCloudActive 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
            title={isCloudActive ? `Conectado ao Supabase como ${currentUser?.email}` : 'Clique para entrar na conta ou sincronizar com o Supabase'}
          >
            {isCloudActive ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden md:inline truncate max-w-[120px]">{currentUser?.email?.split('@')[0]}</span>
                <span className="inline md:hidden">Nuvem</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Modo Local (Conectar)</span>
                <span className="inline md:hidden">Local</span>
              </>
            )}
          </button>

          {/* Alerts badge */}
          {alerts.length > 0 && (
            <div 
              onClick={() => setActiveTab('dashboard')}
              className="relative p-2 rounded-xl text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer transition-colors border border-amber-200 dark:border-amber-800/60"
              title={`${alerts.length} alertas de orçamento pendentes`}
            >
              <Bell className="w-4 h-4 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {alerts.length}
              </span>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
            title={darkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            aria-label="Alternar tema"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Quick Action: Nova Pasta (Desktop) */}
          <button
            onClick={handleOpenNewFolder}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-blue-500" />
            <span>Nova Pasta</span>
          </button>

          {/* Quick Action: Nova Despesa (Desktop & Mobile header) */}
          <button
            onClick={handleOpenNewExpense}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Despesa</span>
          </button>
        </div>

      </div>
    </header>
  );
};
