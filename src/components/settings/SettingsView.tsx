import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  getSupabaseClient,
  resetSupabaseInstance 
} from '../../lib/supabase';
import { StorageService } from '../../services/storageService';
import { 
  Database, 
  User, 
  RotateCcw, 
  Download, 
  Upload, 
  Trash2, 
  Copy, 
  CheckCheck, 
  ShieldCheck, 
  ExternalLink, 
  LogOut, 
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    profile,
    updateProfile,
    resetDemoData,
    clearAllData,
    triggerCelebration,
    currentUser,
    signOut,
    isCloudActive,
    migrateLocalDataToCloud,
    setAuthModalOpen,
  } = useApp();

  // Supabase connection credentials
  const creds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(creds.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(creds.anonKey);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Migration state
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationFeedback, setMigrationFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Copy SQL script state
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSaveAndTestSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectionStatus('checking');
    setStatusMessage('Testando conexão com Supabase...');

    saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
    resetSupabaseInstance();

    const client = getSupabaseClient();
    if (!client) {
      setConnectionStatus('error');
      setStatusMessage('URL ou Chave Anon inválidas.');
      return;
    }

    try {
      const { error } = await client.from('folders').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        setConnectionStatus('connected');
        setStatusMessage('Supabase conectado! Se você ainda não executou o script SQL, copie o código abaixo no SQL Editor do Supabase.');
      } else {
        setConnectionStatus('connected');
        setStatusMessage('Conexão com Supabase estabelecida com sucesso!');
        triggerCelebration();
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setStatusMessage(`Falha na conexão: ${err.message || 'Verifique as credenciais.'}`);
    }
  };

  const handleMigrate = async () => {
    if (!currentUser) {
      alert('Você precisa fazer login no Supabase antes de migrar os dados.');
      setAuthModalOpen(true);
      return;
    }

    if (!confirm('Deseja enviar todos os seus dados locais (pastas, categorias, transações) para sua conta no Supabase? Registros existentes não serão duplicados.')) {
      return;
    }

    setIsMigrating(true);
    setMigrationFeedback(null);

    const result = await migrateLocalDataToCloud();
    setIsMigrating(false);
    setMigrationFeedback({
      success: result.success,
      message: result.message + (result.success ? ` (${result.counts.folders} pastas, ${result.counts.categories} categorias, ${result.counts.transactions} transações enviadas)` : ''),
    });
  };

  const handleExportJson = () => {
    const json = StorageService.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fingestao_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importBackup(content);
      if (success) {
        alert('Backup restaurado com sucesso!');
        window.location.reload();
      } else {
        alert('Falha ao restaurar backup. Verifique se o arquivo JSON é válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleCopySql = () => {
    const sqlCode = `-- ESQUEMA POSTGRESQL PARA FINGESTÃO (Supabase + RLS)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  monthly_expense_budget NUMERIC(12,2) DEFAULT 4000.00,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_manage" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Tag',
  color TEXT NOT NULL DEFAULT '#10b981',
  budget_limit NUMERIC(12,2) DEFAULT 0.00,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_manage" ON public.categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.folders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_budget NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT NOT NULL DEFAULT 'Folder',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "folders_manage" ON public.folders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category_id TEXT NOT NULL,
  folder_id TEXT REFERENCES public.folders(id) ON DELETE SET NULL,
  payment_method TEXT NOT NULL DEFAULT 'pix' CHECK (payment_method IN ('pix', 'credit_card', 'debit_card', 'cash', 'bank_slip', 'transfer', 'other')),
  is_recurring BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_manage" ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_folder ON public.transactions(folder_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_status ON public.folders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;

    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Configurações & Nuvem Supabase
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Sincronize com o banco de dados PostgreSQL na nuvem para manter seus dados seguros em qualquer aparelho.
        </p>
      </div>

      {/* Cloud Status & Account Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
              isCloudActive 
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {isCloudActive && currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : <Database className="w-6 h-6" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {isCloudActive ? 'Conta Conectada à Nuvem' : 'Modo Local / Demonstração'}
                </h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  isCloudActive
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                }`}>
                  {isCloudActive ? '● Nuvem Ativa (PostgreSQL)' : '○ Apenas Este Navegador'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isCloudActive 
                  ? `Sincronizando em tempo real com ${currentUser?.email}` 
                  : 'Os dados estão salvos no cache deste navegador. Conecte sua conta para não perder nada!'}
              </p>
            </div>
          </div>

          <div>
            {isCloudActive ? (
              <button
                onClick={signOut}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Desconectar Conta</span>
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
              >
                <span>Fazer Login / Criar Conta</span>
              </button>
            )}
          </div>
        </div>

        {/* Migrar Dados Locais Para a Nuvem */}
        {isCloudActive && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CloudUpload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Enviar Dados Locais para a Nuvem</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Copia todas as pastas, categorias e transações locais para o seu banco Supabase sem duplicar.
              </p>
            </div>

            <button
              onClick={handleMigrate}
              disabled={isMigrating}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isMigrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
              <span>{isMigrating ? 'Migrando dados...' : 'Enviar Dados Locais'}</span>
            </button>
          </div>
        )}

        {migrationFeedback && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            migrationFeedback.success 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
            {migrationFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{migrationFeedback.message}</span>
          </div>
        )}

      </div>

      {/* Supabase Connection Setup Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Credenciais da API Supabase
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pode ser configurado pelo arquivo <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">.env</code> ou diretamente aqui
              </p>
            </div>
          </div>

          <a 
            href="https://supabase.com" 
            target="_blank" 
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
          >
            <span>Painel Supabase</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <form onSubmit={handleSaveAndTestSupabase} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Project URL do Supabase (VITE_SUPABASE_URL)
            </label>
            <input
              type="text"
              placeholder="https://seu-projeto.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Project API Anon Key (VITE_SUPABASE_ANON_KEY - Pública)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
            />
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-medium ${
              connectionStatus === 'connected' 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                : connectionStatus === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}>
              {statusMessage}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              {copiedSql ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copiedSql ? 'SQL Copiado para a área de transferência!' : 'Copiar Script SQL do Banco'}</span>
            </button>

            <button
              type="submit"
              disabled={connectionStatus === 'checking'}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{connectionStatus === 'checking' ? 'Testando...' : 'Salvar & Testar Conexão'}</span>
            </button>
          </div>
        </form>

      </div>

      {/* Profile & Monthly Target Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Perfil do Usuário
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalize seu nome e teto geral de despesas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => updateProfile({ ...profile, fullName: e.target.value })}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              E-mail de Notificações
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => updateProfile({ ...profile, email: e.target.value })}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Backup, Demo Data & Maintenance */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Gerenciamento de Dados & Backup
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Exporte ou importe seus dados a qualquer momento em arquivo JSON.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Exportar Backup (JSON)</span>
          </button>

          {/* Import JSON */}
          <label className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-blue-500" />
            <span>Restaurar Backup (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>

          {/* Reset Demo Data */}
          <button
            onClick={() => {
              if (confirm('Deseja recarregar os dados de demonstração com as pastas de Viagem, Reforma e Natal?')) {
                resetDemoData();
                triggerCelebration();
                alert('Dados de demonstração restaurados com sucesso!');
              }
            }}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-500" />
            <span>Restaurar Dados Demo</span>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={() => {
              if (confirm('Atenção: Isso apagará todas as pastas, transações e categorias locais. Continuar?')) {
                clearAllData();
                alert('Todos os dados foram limpos.');
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold p-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar todos os dados locais</span>
          </button>
        </div>
      </div>

    </div>
  );
};
