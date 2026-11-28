import { useState } from 'react';
import { ArrowDown, ArrowUp, Check } from 'lucide-react';
import { projectedSavings } from '../../learning/contracts';
import type { Answer, StepView } from '../../learning/contracts';
import { trailButton, trailSecondary } from '../trail/TrailDialog';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function Simulation({ step, amount, onChange }: {
  step: Extract<StepView, { kind: 'simulation' }>; amount: number; onChange: (amount: number) => void;
}) {
  const series = projectedSavings(amount, step.months, step.monthlyRate);
  const total = series.at(-1) ?? 0;
  const max = Math.max(step.target, total, 1);
  return <div className="space-y-4">
    <label className="grid gap-2 font-semibold" htmlFor={step.id + '-aporte'}>
      Aporte mensal de {currency.format(amount)}
      <input type="range" id={step.id + '-aporte'} className="w-full accent-violet-700" min={step.min} max={step.max}
        step={step.increment} value={amount} aria-valuetext={currency.format(amount)} onChange={event => onChange(event.currentTarget.valueAsNumber)} />
    </label>
    <p>Total projetado em {step.months} meses: <strong>{currency.format(total)}</strong>. Meta: {currency.format(step.target)}.</p>
    <p className="text-sm text-slate-600 dark:text-slate-300">{step.monthlyRate ? `Taxa mensal ilustrativa de ${(step.monthlyRate * 100).toLocaleString('pt-BR')}%.` : 'Simulação sem rendimentos.'}</p>
    <svg viewBox="0 0 300 100" className="h-28 w-full text-violet-700 dark:text-violet-400" role="img" aria-label="Gráfico da evolução do saldo simulado">
      <path d={`M 0 ${96 - 90 * step.target / max} H 300`} stroke="currentColor" strokeDasharray="4 4" opacity="0.6" />
      <polyline fill="none" stroke="currentColor" strokeWidth="3" points={series.map((value, index) => `${2 + 296 * index / step.months},${96 - 90 * value / max}`).join(' ')} />
    </svg>
  </div>;
}

export function StudyStep({ step, busy, onAnswer }: {
  step: Exclude<StepView, { kind: 'note' }>; busy: boolean; onAnswer: (answer: Answer) => void;
}) {
  const [choice, setChoice] = useState<string | boolean>();
  const [order, setOrder] = useState(() => step.kind === 'order' ? step.options.map(item => item.id) : []);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [amount, setAmount] = useState(step.kind === 'simulation' ? step.min : 0);
  const answer = step.kind === 'order' ? order : step.kind === 'pairs' ? pairs : step.kind === 'simulation' ? amount : choice;
  const ready = answer !== undefined && (step.kind !== 'pairs' || step.left.every(item => Boolean(pairs[item.id])));

  function move(index: number, target: number) {
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  }

  const options = step.kind === 'boolean' ? [{ id: true, text: 'Verdadeiro' }, { id: false, text: 'Falso' }] :
    step.kind === 'choice' || step.kind === 'scenario' || step.kind === 'cloze' ? step.options : null;

  return <form className="space-y-4" onSubmit={event => {
    event.preventDefault();
    if (ready && answer !== undefined && !busy) onAnswer(answer);
  }}>
    <fieldset disabled={busy} className="min-w-0 space-y-3">
      <legend className="mb-3 text-xl font-bold">{step.prompt}</legend>
      {options?.map(option => <label key={String(option.id)} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-300 px-3 py-2 has-checked:border-violet-600 has-checked:bg-violet-50 dark:border-slate-700 dark:has-checked:bg-violet-950">
        <input type="radio" name={step.id} className="h-4 w-4 shrink-0 accent-violet-700" checked={choice === option.id} onChange={() => setChoice(option.id)} />
        {option.text}
      </label>)}
      {step.kind === 'order' && <ol className="space-y-2">
        {order.map((id, index) => {
          const label = step.options.find(option => option.id === id)?.text;
          return <li key={id} className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700">
            <span className="min-w-0 flex-1">{index + 1}. {label}</span>
            <button type="button" className={trailSecondary} disabled={index === 0} onClick={() => move(index, index - 1)} aria-label={'Subir ' + label}><ArrowUp size={16} aria-hidden="true" /></button>
            <button type="button" className={trailSecondary} disabled={index === order.length - 1} onClick={() => move(index, index + 1)} aria-label={'Descer ' + label}><ArrowDown size={16} aria-hidden="true" /></button>
          </li>;
        })}
      </ol>}
      {step.kind === 'pairs' && step.left.map(option => <label key={option.id} className="grid gap-1 font-semibold sm:grid-cols-[1fr_2fr] sm:items-center">
        {option.text}
        <select className="min-w-0 rounded-xl border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950"
          value={pairs[option.id] ?? ''} onChange={event => setPairs({ ...pairs, [option.id]: event.currentTarget.value })}>
          <option value="">Escolha um par</option>
          {step.right.map(item => <option key={item.id} value={item.id}>{item.text}</option>)}
        </select>
      </label>)}
      {step.kind === 'simulation' && <Simulation step={step} amount={amount} onChange={setAmount} />}
    </fieldset>
    <button type="submit" className={trailButton} disabled={busy || !ready}><Check size={17} aria-hidden="true" /> Verificar resposta</button>
  </form>;
}
