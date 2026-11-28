import { Activity, lazy, Suspense, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { FoldersView } from './components/folders/FoldersView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { CategoriesView } from './components/categories/CategoriesView';
import { InvestmentsView } from './components/investments/InvestmentsView';
import { SavingsGoalsView } from './components/savings/SavingsGoalsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { ClassicPurchaseGoals } from './components/purchases/ClassicPurchaseGoals';
import { ModeBar, ModeOnboarding } from './components/layout/ModeControls';
import { ModeProvider, useMode } from './context/ModeContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { TransactionModal } from './components/modals/TransactionModal';
import { FolderModal } from './components/modals/FolderModal';
import { CategoryModal } from './components/modals/CategoryModal';
import { AuthModal } from './components/modals/AuthModal';

const GameShell = lazy(() => import('./components/layout/GameShell'));
const LibraryView = lazy(() => import('./components/learning/LibraryView'));
const FinancialProgress = lazy(() => import('./components/learning/FinancialProgress'));
const SimulatorsView = lazy(() => import('./components/play/SimulatorsView'));
const PurchaseCheck = lazy(() => import('./components/purchases/PurchaseCheck'));

function ClassicLayout({ visible }: { visible: boolean }) {
  const { activeTab } = useApp();
  const { preferences } = useMode();

  return (
    <div hidden={!visible} className={visible ? 'classic-layout flex min-h-screen flex-col' : 'classic-layout hidden'}>
      {/* Top Navbar */}
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'folders' && <FoldersView />}
          {activeTab === 'transactions' && <TransactionsView />}
          {activeTab === 'categories' && <CategoriesView />}
          {activeTab === 'investments' && <InvestmentsView />}
          {activeTab === 'savings' && <SavingsGoalsView />}
          {activeTab === 'purchases' && <ErrorBoundary fallbackTitle="Erro ao carregar as metas de compra">
            <ClassicPurchaseGoals visible={visible} />
          </ErrorBoundary>}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'library' && preferences.libraryVisible && <ErrorBoundary fallbackTitle="Erro ao abrir a Biblioteca">
            <Suspense fallback={<p role="status">Carregando Biblioteca…</p>}><LibraryView /></Suspense>
          </ErrorBoundary>}
          {activeTab === 'progress' && <ErrorBoundary fallbackTitle="Erro ao calcular o progresso financeiro">
            <Suspense fallback={<p role="status">Carregando indicadores…</p>}><FinancialProgress /></Suspense>
          </ErrorBoundary>}
          {activeTab === 'simulators' && <ErrorBoundary fallbackTitle="Erro ao abrir os simuladores">
            <Suspense fallback={<p role="status">Carregando simuladores…</p>}><SimulatorsView /></Suspense>
          </ErrorBoundary>}
          {activeTab === 'purchaseCheck' && <ErrorBoundary fallbackTitle="Erro ao abrir a comparação de compras">
            <Suspense fallback={<p role="status">Carregando comparação…</p>}><PurchaseCheck /></Suspense>
          </ErrorBoundary>}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Modals */}
      <TransactionModal />
      <FolderModal />
      <CategoryModal />
    </div>
  );
}

function AppModes() {
  const { mode, ready, preferences, showOnboarding } = useMode();
  const [visitedGame, setVisitedGame] = useState(false);
  if (mode === 'jogo' && !visitedGame) setVisitedGame(true);

  return <div className="app-modes min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    data-mode={mode} data-mode-selector={ready && preferences.gameEnabled ? 'visible' : undefined}>
    <ModeBar />
    <ClassicLayout visible={mode === 'classico'} />
    {visitedGame && preferences.gameEnabled && <Activity mode={mode === 'jogo' ? 'visible' : 'hidden'}>
      <div>
        <ErrorBoundary fallbackTitle="Erro ao abrir o Modo Jogo">
          <Suspense fallback={<p role="status" className="p-5">Carregando Modo Jogo…</p>}>
            <GameShell />
          </Suspense>
        </ErrorBoundary>
      </div>
    </Activity>}
    <AuthModal />
    {showOnboarding && <ModeOnboarding />}
  </div>;
}

export function App() {
  return (
    <AppProvider>
      <ModeProvider><AppModes /></ModeProvider>
    </AppProvider>
  );
}

export default App;
