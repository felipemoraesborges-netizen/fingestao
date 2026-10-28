import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FolderCard } from './FolderCard';
import { FolderDetailsView } from './FolderDetailsView';
import { formatCurrency } from '../../utils/formatters';
import { 
  FolderPlus, 
  FolderKanban, 
  Search, 
  CheckCircle2, 
  Archive, 
  TrendingUp,
  Target
} from 'lucide-react';

export const FoldersView: React.FC = () => {
  const { 
    folders, 
    selectedFolderId, 
    transactions, 
    setFolderModalOpen, 
    setEditingFolder 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [search, setSearch] = useState('');

  // If a folder is currently selected, display its dedicated detail page!
  if (selectedFolderId) {
    return <FolderDetailsView />;
  }

  const filteredFolders = folders.filter(f => {
    const matchesStatus = f.status === activeTab;
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || 
                          (f.description && f.description.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const activeFolders = folders.filter(f => f.status === 'active');
  const totalTargetBudget = activeFolders.reduce((sum, f) => sum + f.targetBudget, 0);
  const totalSpentInActiveFolders = transactions
    .filter(t => t.type === 'expense' && activeFolders.some(f => f.id === t.folderId))
    .reduce((sum, t) => sum + t.amount, 0);

  const handleCreateNewFolder = () => {
    setEditingFolder(null);
    setFolderModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header and Call-To-Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Pastas & Projetos
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
              {activeFolders.length} ativas
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Isole e monitore o orçamento de viagens, reformas, eventos e compras planejadas.
          </p>
        </div>

        <button
          onClick={handleCreateNewFolder}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <FolderPlus className="w-5 h-5" />
          <span>Nova Pasta</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total em Metas Planejadas</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              {formatCurrency(totalTargetBudget)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Já Utilizado em Projetos</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              {formatCurrency(totalSpentInActiveFolders)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Saldo Disponível nos Projetos</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(Math.max(0, totalTargetBudget - totalSpentInActiveFolders))}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Tabs Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        
        {/* Tabs: Ativas vs Arquivadas */}
        <div className="flex items-center p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'active'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Ativas ({folders.filter(f => f.status === 'active').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('archived')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'archived'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Arquivadas ({folders.filter(f => f.status === 'archived').length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por pasta ou evento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white shadow-xs"
          />
        </div>

      </div>

      {/* Folders Grid */}
      {filteredFolders.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <FolderKanban className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">
            {search ? 'Nenhuma pasta encontrada para a busca.' : activeTab === 'active' ? 'Nenhuma pasta ativa no momento.' : 'Nenhuma pasta arquivada.'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {activeTab === 'active' 
              ? 'Crie pastas para organizar viagens, eventos ou reformas com teto orçamentário específico.'
              : 'Pastas finalizadas ou arquivadas aparecerão aqui para histórico.'}
          </p>
          {activeTab === 'active' && (
            <button
              onClick={handleCreateNewFolder}
              className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Criar Primeira Pasta</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFolders.map(folder => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
        </div>
      )}

    </div>
  );
};
