import { useCallback, useEffect, useState } from 'react';
import { replayStory, scenes } from '../../learning/lifeStory';
import { getSupabaseClient } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatters';
import { trailButton, trailSecondary } from '../trail/TrailDialog';

interface StoryRecord { revisao: string | null; escolhas: string[] }
const card = 'space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900';

export function StoryView({ userId }: { userId: string }) {
  const [record, setRecord] = useState<StoryRecord>();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const reload = useCallback(() => {
    const controller = new AbortController();
    const table = getSupabaseClient()?.from('historias_finplay');
    if (!table) return () => controller.abort();
    void table.select('escolhas,revisao').eq('user_id', userId).abortSignal(controller.signal).maybeSingle().then(({ data, error }) => {
      if (controller.signal.aborted) return;
      if (error) { setError('Não foi possível abrir a história. Confira a migração do Supabase.'); return; }
      setError('');
      setRecord(data ? { revisao: String(data.revisao), escolhas: data.escolhas as string[] } : { revisao: null, escolhas: [] });
    });
    return () => controller.abort();
  }, [userId]);
  useEffect(reload, [reload]);

  async function write(escolhas: string[]) {
    const table = getSupabaseClient()?.from('historias_finplay');
    if (!record || !table || saving) return;
    setSaving(true);
    setError('');
    const revisao = crypto.randomUUID();
    try {
      const saved = record.revisao ? await table.update({ escolhas, revisao }).eq('user_id', userId).eq('revisao', record.revisao).select('revisao').maybeSingle() :
        await table.upsert({ user_id: userId, escolhas, revisao }, { onConflict: 'user_id', ignoreDuplicates: true }).select('revisao').maybeSingle();
      if (saved.error || !saved.data) throw new Error('A história mudou em outra sessão ou não pôde ser salva. Atualize para continuar.');
      setRecord({ escolhas, revisao });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar.'); }
    finally { setSaving(false); }
  }

  const story = record ? replayStory(record.escolhas) : undefined;
  return <section className="space-y-4">
    <header><h1 className="text-2xl font-black">História · Uma vida financeira</h1>
      <p className="text-sm">O cenário usa valores fictícios. Suas decisões aqui não mudam os lançamentos da sua conta.</p></header>
    {error && <div role="alert" className={card}><p>{error}</p><button className={trailSecondary} type="button" onClick={reload}>Atualizar história</button></div>}
    {!story && !error && <p role="status">Carregando história…</p>}
    {story && <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,.5fr)]">
      <div className={card}>
        {story.scene ? <><p className="text-sm">Capítulo {(record?.escolhas.length ?? 0) + 1} de {scenes.length}</p><h2 className="text-xl font-bold">{story.scene.title}</h2>
          <p>{story.scene.premise}</p>
          <div className="grid gap-2">{story.scene.options.map(option => <button key={option.id} type="button" disabled={saving}
            className={trailSecondary + ' flex-col items-start text-left'} onClick={() => void write([...(record?.escolhas ?? []), option.id])}>
            <strong>{option.title}</strong><span>{option.description}</span></button>)}</div></> :
          <><h2 className="text-xl font-bold">{story.ending}</h2><p>Compare as decisões que levaram a esse resultado. Você pode explorar outro caminho.</p>
            <button className={trailButton} type="button" disabled={saving} onClick={() => void write([])}>Começar outra história</button></>}
      </div>
      <aside className={card} aria-label="Orçamento fictício">
        <h2 className="font-bold">Seu orçamento fictício</h2>
        <dl className="space-y-1">
          <div><dt>Tempo no cenário</dt><dd className="font-semibold">{story.result.months} meses</dd></div>
          <div><dt>Saldo guardado</dt><dd className="font-semibold">{formatCurrency(story.result.savings)}</dd></div>
          <div><dt>Dívida</dt><dd className="font-semibold">{formatCurrency(story.result.debt)}</dd></div>
          <div><dt>Renda mensal</dt><dd className="font-semibold">{formatCurrency(story.result.income)}</dd></div>
          <div><dt>Gastos mensais</dt><dd className="font-semibold">{formatCurrency(story.result.bills)}</dd></div>
        </dl>
        <p className="text-sm">A simulação usa juros de dívida de 1% ao mês, ilustrativos, e direciona até 40% da sobra para pagar a dívida.</p>
      </aside>
    </div>}
  </section>;
}
