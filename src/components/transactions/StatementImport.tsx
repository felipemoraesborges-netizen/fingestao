import { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getSupabaseClient } from '../../lib/supabase';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { parseStatement, statementKeys } from '../../finance/statementImport';
import { notifyLearningActivity } from '../../services/learningService';

const control = 'min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900';

export function StatementImport({ onClose }: { onClose: () => void }) {
  const { currentUser, categories, setAuthModalOpen, refreshData } = useApp();
  const [parsed, setParsed] = useState<ReturnType<typeof parseStatement>>();
  const [fallback, setFallback] = useState<Record<'expense' | 'income', string>>({ expense: '', income: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const readVersion = useRef(0);
  const nameKey = (value: string) => value.trim().toLocaleLowerCase('pt-BR');
  const rows = parsed?.valid.map(value => ({ ...value,
    categoryId: categories.find(category => value.category && category.type === value.type && nameKey(category.name) === nameKey(value.category))?.id || fallback[value.type] })) ?? [];

  async function handleFile(file: File) {
    const version = ++readVersion.current;
    setParsed(undefined);
    setError('');
    setMessage('');
    try {
      const format = file.name.toLowerCase().match(/\.(ofx|csv)$/)?.[1];
      if (format !== 'csv' && format !== 'ofx') throw new Error('Escolha um arquivo CSV ou OFX.');
      if (file.size > 2 * 1024 * 1024) throw new Error('O arquivo excede 2 MB.');
      const buffer = await file.arrayBuffer();
      let content;
      try { content = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
      catch { content = new TextDecoder('windows-1252').decode(buffer); }
      const next = parseStatement(content, format);
      if (version === readVersion.current) setParsed(next);
    } catch (reason) {
      if (version === readVersion.current) setError(reason instanceof Error ? reason.message : 'O arquivo não pôde ser lido.');
    }
  }

  async function confirm() {
    if (!rows.length || rows.some(row => !row.categoryId) || busy) return;
    const client = getSupabaseClient();
    if (!client || !currentUser) return;
    setBusy(true);
    setError('');
    try {
      const keys = await statementKeys(rows);
      const { data, error } = await client.rpc('fin_importar_extrato', { p_lote: rows.map((row, index) => ({
        data: row.date, descricao: row.description, valor: row.amount, tipo: row.type, categoria: row.categoryId, chave: keys[index],
      })) });
      if (error) throw new Error(error.code === 'P0001' ? error.message : error.code === 'PGRST202' ?
        'A importação precisa da migração do FinGestão 2.0.' : 'O lote não pôde ser importado.');
      const imported = Number(data);
      setMessage(imported + ' importados · ' + (rows.length - imported) + ' já estavam registrados pelo importador.');
      setParsed(undefined);
      notifyLearningActivity();
      await refreshData();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Falha ao importar.'); }
    finally { setBusy(false); }
  }

  return <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900" aria-label="Importar extrato">
    <div className="flex flex-wrap justify-between gap-2"><h2 className="text-lg font-bold">Importar extrato OFX ou CSV</h2>
      <button type="button" className={control} disabled={busy} onClick={onClose}>Fechar importação</button></div>
    {!currentUser ? <><p className="text-sm">Conecte a conta para confirmar os lançamentos do extrato.</p>
      <button className={control} type="button" onClick={() => setAuthModalOpen(true)}>Conectar conta</button></> : <>
      <p className="text-sm">Para CSV, use Data, Descrição, Valor e, opcionalmente, Tipo e Categoria. Sem a coluna Tipo, valores negativos são despesas. Confira a prévia antes de confirmar.</p>
      <label className="grid gap-1 text-sm font-semibold">Arquivo do extrato
        <input className={control} type="file" accept=".csv,.ofx" disabled={busy} onChange={event => {
          const file = event.currentTarget.files?.[0];
          if (file) void handleFile(file);
        }} />
      </label>
      {message && <p role="status" className="text-sm">{message}</p>}
      {error && <p role="alert" className="text-sm text-rose-800 dark:text-rose-300">{error}</p>}
      {parsed && <>
        <p className="text-sm">{rows.length} válidos · {parsed.ignored} linhas ignoradas</p>
        <div className="flex flex-wrap gap-2">{(['expense', 'income'] as const).filter(type => rows.some(row => row.type === type)).map(type =>
          <label key={type} className="grid gap-1 text-sm font-semibold">Categoria padrão para {type === 'expense' ? 'despesas' : 'receitas'}
            <select className={control} value={fallback[type]} onChange={event => setFallback({ ...fallback, [type]: event.currentTarget.value })}>
              <option value="">Escolher categoria</option>
              {categories.filter(item => item.type === type).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>)}</div>
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead><tr>{['Data', 'Descrição', 'Tipo', 'Valor'].map(title => <th className="p-2" scope="col" key={title}>{title}</th>)}</tr></thead>
            <tbody>{rows.map((row, index) => <tr className="border-t border-slate-200 dark:border-slate-700" key={index}>
              <td className="p-2">{formatDate(row.date)}</td><td className="p-2">{row.description}</td>
              <td className="p-2">{row.type === 'expense' ? 'Despesa' : 'Receita'}</td><td className="whitespace-nowrap p-2">{formatCurrency(row.amount)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <button type="button" className={control + ' font-semibold disabled:opacity-50'} disabled={busy || rows.some(row => !row.categoryId)} onClick={() => void confirm()}>
          {busy ? 'Importando…' : 'Confirmar importação'}
        </button>
      </>}
    </>}
  </section>;
}
