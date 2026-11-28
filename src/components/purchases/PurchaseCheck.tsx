import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getSupabaseClient } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatters';
import { educationNotice } from '../../learning/contracts';

interface Reflection { id: string; titulo: string; valor: number; creada: string; horas: number }
const localKey = 'fingestao:reflexoes-compra';
const panel = 'space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900';
const input = 'w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950';
const action = 'rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800';
const factors = [
  { key: 'cash', caption: 'Preço à vista (R$)' }, { key: 'installment', caption: 'Valor de cada parcela (R$)' },
  { key: 'term', caption: 'Quantidade de parcelas' }, { key: 'income', caption: 'Renda líquida do mês (R$)' },
  { key: 'hours', caption: 'Horas de trabalho no mês' }, { key: 'available', caption: 'Valor livre no orçamento (R$)' },
  { key: 'saving', caption: 'Aporte mensal da meta (R$)' },
] as const;

function readLocal(): Reflection[] {
  try { return JSON.parse(localStorage.getItem(localKey) ?? '[]') as Reflection[]; }
  catch { return []; }
}

function PurchaseAnalysis({ userId }: { userId?: string }) {
  const [text, setText] = useState({ cash: '', installment: '', term: '', income: '', hours: '', available: '', saving: '' });
  const [reflections, setReflections] = useState(() => userId ? [] : readLocal());
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState(24);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(userId));
  const [clock, setClock] = useState(Date.now);
  const value = (key: keyof typeof text) => text[key] === '' ? undefined : Number(text[key]);
  const cash = value('cash') ?? 0;
  const installment = value('installment');
  const term = value('term');
  const income = value('income') ?? 0;
  const hours = value('hours') ?? 0;
  const available = value('available');
  const saving = value('saving') ?? 0;
  const financed = installment !== undefined && term && Number.isInteger(term) && term <= 120 ? installment * term : undefined;
  const storage = () => getSupabaseClient()?.from('reflexoes_compra');
  const hasPrice = cash > 0 && cash <= 100_000_000;

  useEffect(() => {
    if (!userId) return;
    const database = storage();
    if (!database) return;
    let active = true;
    void database.select('id,titulo,valor,criada_em,horas').eq('user_id', userId).order('criada_em', { ascending: false }).limit(100).then(({ data, error: failure }) => {
      if (!active) return;
      if (failure) setError('Não foi possível carregar as reflexões. Confira a migração do Supabase.');
      else setReflections((data ?? []).map(entry => ({ id: String(entry.id), titulo: String(entry.titulo),
        valor: Number(entry.valor), creada: String(entry.criada_em), horas: Number(entry.horas) })));
      setLoading(false);
    });
    return () => { active = false; };
  }, [userId]);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  function store(rows: Reflection[]) {
    if (!userId) localStorage.setItem(localKey, JSON.stringify(rows));
    setReflections(rows);
  }

  async function add() {
    if (!hasPrice || !title.trim() || loading) return;
    setLoading(true);
    setError('');
    const next = { id: crypto.randomUUID(), titulo: title.trim(), valor: cash, creada: new Date().toISOString(), horas: period };
    try {
      if (userId) {
        const { error: failure } = await storage()?.insert({ id: next.id, user_id: userId, titulo: next.titulo, valor: next.valor, horas: next.horas }) ?? { error: true };
        if (failure) throw new Error('Não foi possível guardar a reflexão.');
      }
      store([next, ...reflections]);
      setTitle('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível guardar.'); }
    finally { setLoading(false); }
  }

  async function remove(id: string) {
    setLoading(true);
    setError('');
    try {
      if (userId) {
        const { error: failure } = await storage()?.delete().eq('id', id).eq('user_id', userId) ?? { error: true };
        if (failure) throw new Error('Não foi possível remover a reflexão.');
      }
      store(reflections.filter(item => item.id !== id));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível remover.'); }
    finally { setLoading(false); }
  }

  return <section className="space-y-4">
    <header><h1 className="text-2xl font-bold">Vale a pena comprar?</h1><p className="text-sm">{educationNotice}</p></header>
    <div className="grid gap-4 lg:grid-cols-2">
      <fieldset className={panel}><legend className="px-2 font-bold">Dados da comparação</legend>
        <div className="grid gap-2 sm:grid-cols-2">{factors.map(field => <label className="grid gap-1 text-sm font-semibold" key={field.key}>{field.caption}
          <input type="number" min="0" className={input} max={field.key === 'term' ? 120 : 100_000_000}
            step={field.key === 'term' ? '1' : '.01'} value={text[field.key]} onChange={event => {
              const raw = event.currentTarget.value;
              if (!raw || Number(raw) >= 0) setText({ ...text, [field.key]: raw });
            }} />
        </label>)}</div>
      </fieldset>
      <div className={panel}>
        <h2 className="font-bold">Impacto estimado</h2>
        {hasPrice ? <dl aria-live="polite" className="space-y-1 text-sm">
          <div><dt className="font-semibold">Preço à vista</dt><dd>{formatCurrency(cash)}</dd></div>
          {income > 0 && <div><dt className="font-semibold">Fração da renda do mês</dt><dd>{(cash / income).toLocaleString('pt-BR', { style: 'percent', maximumFractionDigits: 1 })}</dd></div>}
          {income > 0 && hours > 0 && <div><dt className="font-semibold">Trabalho equivalente</dt><dd>{(cash * hours / income).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} horas</dd></div>}
          {available !== undefined && <div><dt className="font-semibold">{available >= cash ? 'Folga após a compra à vista' : 'Valor acima do dinheiro livre'}</dt><dd>{formatCurrency(Math.abs(available - cash))}</dd></div>}
          {saving > 0 && <div><dt className="font-semibold">Se o valor saísse da meta</dt><dd>Equivale a {(cash / saving).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} aportes mensais.</dd></div>}
          {financed !== undefined && <div><dt className="font-semibold">Total das parcelas</dt><dd>{formatCurrency(financed)} · {formatCurrency(Math.abs(financed - cash))} {financed >= cash ? 'a mais' : 'a menos'} que à vista.</dd></div>}
        </dl> : <p className="text-sm">Informe o preço à vista para calcular.</p>}
        <p className="text-sm text-slate-600 dark:text-slate-300">Compare o custo total, a opção de adiar e o que deixaria de caber no orçamento. A simulação só usa os valores acima.</p>
      </div>
    </div>
    <section className={panel}>
      <h2 className="font-bold">Tempo para refletir</h2>
      <form className="flex flex-wrap items-end gap-2" onSubmit={event => { event.preventDefault(); void add(); }}>
        <label className="grid min-w-0 flex-1 gap-1 text-sm font-semibold">Nome da compra<input className={input} required maxLength={120} value={title} onChange={event => setTitle(event.currentTarget.value)} /></label>
        <label className="grid gap-1 text-sm font-semibold">Prazo<select className={input} value={period} onChange={event => setPeriod(Number(event.currentTarget.value))}>
          {[24, 48, 72].map(hours => <option key={hours} value={hours}>{hours} horas</option>)}</select></label>
        <button type="submit" className={action} disabled={!hasPrice || loading}>Começar reflexão</button>
      </form>
      {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
      {!reflections.length && !loading && <p className="text-sm">Nenhuma compra em reflexão.</p>}
      <ul className="space-y-2">{reflections.map(item => {
        const end = new Date(Date.parse(item.creada) + item.horas * 3_600_000);
        return <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2 dark:border-slate-800">
          <div><strong>{item.titulo} · {formatCurrency(item.valor)}</strong><p className="text-sm">{clock >= end.valueOf() ? 'Pronto para rever quando quiser.' : 'Prazo até ' + end.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p></div>
          <button type="button" className={action} disabled={loading} onClick={() => void remove(item.id)}>Remover</button>
        </li>;
      })}</ul>
    </section>
  </section>;
}

export default function PurchaseCheck() {
  const { currentUser } = useApp();
  return <PurchaseAnalysis key={currentUser?.id ?? 'local'} userId={currentUser?.id} />;
}
