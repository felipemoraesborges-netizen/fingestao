import React from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, AlertCircle, X, ArrowRight } from 'lucide-react';

export const AlertBanner: React.FC = () => {
  const { alerts, dismissAlert, setSelectedFolderId, setActiveTab } = useApp();

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {alerts.map((alert) => {
        const isCritical = alert.severity === 'danger';
        return (
          <div
            key={alert.id}
            className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all ${
              isCritical
                ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                isCritical 
                  ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400' 
                  : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400'
              }`}>
                {isCritical ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm tracking-tight">{alert.title}</h4>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isCritical 
                      ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-300' 
                      : 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-300'
                  }`}>
                    {alert.percentage.toFixed(0)}% do Limite
                  </span>
                </div>
                <p className="text-xs mt-0.5 opacity-90">{alert.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              {alert.folderId && (
                <button
                  onClick={() => {
                    setSelectedFolderId(alert.folderId!);
                    setActiveTab('folders');
                  }}
                  className={`hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                    isCritical
                      ? 'bg-rose-100 dark:bg-rose-900/50 hover:bg-rose-200 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                      : 'bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                  }`}
                >
                  <span>Ver Pasta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {alert.categoryId && (
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                    isCritical
                      ? 'bg-rose-100 dark:bg-rose-900/50 hover:bg-rose-200 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                      : 'bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                  }`}
                >
                  <span>Ver Tetos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => dismissAlert(alert.id)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
                title="Dispensar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
