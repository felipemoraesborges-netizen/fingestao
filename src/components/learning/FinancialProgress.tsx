import { useEffect, useId, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useMode } from '../../context/ModeContext';
import { getSupabaseClient } from '../../lib/supabase';
import { classicPaths, navigateApp } from '../../navigation/appRoutes';
import type { ClassicTab } from '../../navigation/appRoutes';
import { formatCurrency, formatMonthName } from '../../utils/formatters';
import { healthIndicators, monthlyIndicators } from '../../finance/indicators';

const reserveKey = 'fingestao:meta-de-reserva';
const card = 'space-y-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900';
const caption = 'text-sm text-slate-600 dark:text-slate-300';

function Reserve({ spending }: { spending: number }) {
  const { currentUser, savingsGoals } = useApp();
  const userId = currentUser?.id;
  const [selection, setSelection] = useState(() => userId ? '' : localStorage.getItem(reserveKey) ?? '');
  const [loading, setLoading] = useState(Boolean(userId));
  const [message, setMessage] = useState('');
  const id = useId();

  useEffect(() => {
    if (!userId) return;
    let current = true;
    const database = getSupabaseClient();
    if (!database) return;
    void database.from('progresso_usuario').select('reserva_meta_id').eq('user_id', userId).maybeSingle().then(result => {
      if (!current) return;
      if (result.error) setMessage('A escolha da meta precisa da atualização do Supabase.');
      else setSelection(typeof result.data?.reserva_meta_id === 'string' ? result.data.reserva_meta_id : '');
      setLoading(false);
    });
    return () => { current = false; };
  }, [userId]);

  async function choose(next: string) {
    setMessage('');
    if (!userId) {
      localStorage.setItem(reserveKey, next);
      setSelection(next);
      return;
    }
    const database = getSupabaseClient();
    if (!database) return;
    setLoading(true);
    try {
      const { error } = await database.from('progresso_usuario').upsert({ user_id: userId, reserva_meta_id: next || null }, { onConflict: 'user_id' });
      if (error) setMessage('Não foi possível salvar a escolha da meta.');
      else setSelection(next);
    } finally { setLoading(false); }
  }

  const chosen = savingsGoals.find(goal => goal.id === selection);
  const coverage = chosen && spending > 0 ? Math.max(0, chosen.savedAmount) / spending : null;
  return <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium">Meta usada como reserva</label>
    <select id={id} className="w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950"
      value={chosen?.id ?? ''} disabled={loading || !savingsGoals.length} onChange={event => void choose(event.currentTarget.value)}>
      <option value="">Selecione uma meta</option>
      {savingsGoals.map(goal => <option key={goal.id} value={goal.id}>{goal.name}</option>)}
    </select>
    {message && <p role="status" className={caption}>{message}</p>}
    {coverage === null ? <p className={caption}>{chosen ? 'Registre gastos no mês para estimar a cobertura.' : 'Escolha uma meta de poupança para usar seu saldo.'}</p> :
      <p><strong className="text-xl">{coverage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} {coverage === 1 ? 'mês' : 'meses'}</strong> <span className={caption}>de cobertura estimada</span></p>}
    <p className={caption}>O cálculo usa os gastos registrados no mês selecionado.</p>
  </div>;
}

export default function FinancialProgress({ onStudy, onPractice = tab => navigateApp(classicPaths[tab]) }: {
  onStudy?: (id: string) => void; onPractice?: (tab: ClassicTab) => void;
}) {
  const { currentUser, transactions, categories, savingsGoals, selectedMonth, setSelectedMonth } = useApp();
  const { preferences } = useMode();
  const stats = monthlyIndicators(transactions, categories, selectedMonth);
  const health = healthIndicators(stats, savingsGoals.length);
  const deficit = Math.max(0, stats.expenses - stats.income);

  const tip = (lessonId: string, text: string) => {
    if (onStudy) return <button type="button" className="text-sm font-semibold underline" onClick={() => onStudy(lessonId)}>{text}</button>;
    if (preferences.libraryVisible) return <button type="button" className="text-sm font-semibold underline"
      onClick={() => navigateApp(classicPaths.library, false, new URLSearchParams({ licao: lessonId }))}>{text}</button>;
    return <p className={caption}>{text}</p>;
  };

  return <section className="space-y-4">
    <header className="flex flex-wrap items-end justify-between gap-2">
      <div><h1 className="text-xl font-bold">Meu progresso financeiro</h1><p className={caption}>{formatMonthName(selectedMonth)}</p></div>
      <label className="grid gap-1 text-sm font-semibold">Mês de referência
        <input type="month" className="rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950"
          value={selectedMonth} onChange={event => { if (event.currentTarget.value) setSelectedMonth(event.currentTarget.value); }} />
      </label>
    </header>
    <div className="grid gap-3 md:grid-cols-2">
      <div className={card}><h2 className="font-bold">Taxa de poupança do mês</h2>
        <p className="text-xl font-bold">{stats.rate === null ? 'Sem receita registrada' : stats.rate.toLocaleString('pt-BR', { style: 'percent', maximumFractionDigits: 1 })}</p>
        <p className={caption}>{formatCurrency(stats.income)} de receitas · {formatCurrency(stats.expenses)} de gastos</p>
        <p className={caption}>{stats.expenses > stats.income ? 'Os gastos passaram das receitas do mês.' : 'A estimativa usa a parcela da receita que ficou após os gastos.'}</p>
        {tip('pp-fluxo', 'Veja como conferir o saldo do mês')}
      </div>
      <div className={card}><h2 className="font-bold">Meses de reserva</h2>
        <Reserve key={currentUser?.id ?? 'local'} spending={stats.expenses} />
        {tip('res-tamanho', 'Veja como estimar o tamanho da reserva')}
      </div>
    </div>
    <div className={card}><h2 className="font-bold">Gastos por categoria</h2>
      {stats.byCategory.length ? <ul className="divide-y divide-slate-200 dark:divide-slate-700">
        {stats.byCategory.map(item => <li key={item.id} className="flex items-start justify-between gap-3 py-2"><span>{item.name}</span><strong className="shrink-0">{formatCurrency(item.amount)}</strong></li>)}
      </ul> : <p className={caption}>Nenhuma despesa registrada neste mês.</p>}
      {tip('ctl-decisoes', 'Veja como escolher um gasto para ajustar')}
    </div>
    <div className="grid gap-3 lg:grid-cols-2">
      <section className={card}><h2 className="font-bold">Indicador educativo de saúde financeira</h2>
        {health ? <>
          <p className="text-2xl font-black">{health.total} <span className={caption}>de 100</span></p>
          <meter className="h-3 w-full" min={0} max={100} value={health.total} aria-label="Indicador educativo de saúde financeira" />
          <details className={caption}><summary className="cursor-pointer font-semibold">Como o indicador é calculado</summary>
            <ul className="mt-2 space-y-2">{health.pieces.map(piece => <li key={piece.title}><strong>{piece.title} · {(piece.score * piece.weight).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} de {piece.weight}</strong><br />{piece.description}</li>)}</ul>
          </details>
        </> : <p className={caption}>Registre receitas e despesas em pelo menos três dias do mês para calcular.</p>}
        <p className={caption}>O indicador se baseia nos registros do app e tem finalidade educativa. Ele não representa uma pontuação de crédito.</p>
      </section>
      <section className={card}><h2 className="font-bold">Plano de recuperação financeira</h2>
        {deficit > 0 && <p className={caption}>Os gastos deste mês superam as receitas em {formatCurrency(deficit)}.</p>}
        <details className={caption}>
          <summary className="cursor-pointer font-semibold">Abrir roteiro de recuperação</summary>
          <ol className="mt-2 list-decimal space-y-3 pl-5">
            <li><button type="button" className="font-semibold underline" onClick={() => onPractice('transactions')}>Confira os lançamentos</button> e liste despesas essenciais.</li>
            <li><button type="button" className="font-semibold underline" onClick={() => onPractice('categories')}>Revise os tetos</button> e veja quais despesas podem ser ajustadas.</li>
            <li>{tip('div-pagamento', 'Aprenda a comparar propostas de negociação')} Verifique se as parcelas cabem depois do essencial.</li>
            <li><button type="button" className="font-semibold underline" onClick={() => onPractice('savings')}>Revise suas metas</button> e ajuste o ritmo de aportes quando precisar.</li>
          </ol>
        </details>
      </section>
    </div>
  </section>;
}
