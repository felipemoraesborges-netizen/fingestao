import { useId, useState } from 'react';
import { educationNotice } from '../../learning/contracts';
import { simulate, simulators } from '../../learning/simulators';
import type { SimulationResult } from '../../learning/simulators';
import { formatCurrency } from '../../utils/formatters';

function Chart({ result }: { result: SimulationResult }) {
  const lastMonth = result.points.at(-1)?.month ?? 0;
  const max = Math.max(1, ...result.points.flatMap(point => [point.value, point.comparison ?? 0]));
  const includesComparison = result.points.some(point => point.comparison !== undefined);
  const step = Math.max(1, Math.ceil(lastMonth / 120));
  const shown = result.points.filter((point, index) => index % step === 0 || point.month === lastMonth);
  const series = (alt: boolean) => shown.map(point =>
    (12 + 496 * point.month / Math.max(lastMonth, 1)) + ',' + (153 - 137 * (alt ? point.comparison ?? 0 : point.value) / max)).join(' ');
  if (lastMonth === 0) return <p className="text-sm">A meta já foi alcançada no início do cenário.</p>;
  return <figure className="space-y-2">
    <svg viewBox="0 0 520 166" aria-label="Gráfico da projeção. A tabela apresenta os valores de referência." role="img" className="h-44 w-full rounded-lg bg-slate-100 dark:bg-slate-800">
      <path d="M12 16V153H508" className="fill-none stroke-slate-400" />
      <polyline points={series(false)} fill="none" strokeWidth="3" className="stroke-violet-700 dark:stroke-violet-300" />
      {includesComparison && <polyline points={series(true)} fill="none" strokeWidth="3" strokeDasharray="5 4" className="stroke-emerald-700 dark:stroke-emerald-300" />}
    </svg>
    <figcaption className="flex flex-wrap justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
      <span>Mês 0</span><span>{includesComparison ? 'Linha tracejada: comparação' : 'Trajetória estimada'}</span><span>Mês {lastMonth}</span>
    </figcaption>
    <details className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
      <summary className="cursor-pointer text-sm font-semibold">Ver valores por mês</summary>
      <div className="mt-2 max-h-64 overflow-auto">
        <table className="w-full text-sm"><thead><tr><th scope="col" className="p-1 text-left">Mês</th><th scope="col" className="text-right">Projeção</th>
          {includesComparison && <th scope="col" className="text-right">Comparação</th>}</tr></thead>
          <tbody>{result.points.map(point => <tr className="border-t border-slate-200 dark:border-slate-800" key={point.month}>
            <th scope="row" className="p-1 text-left font-normal">{point.month}</th><td className="text-right">{formatCurrency(point.value)}</td>
            {includesComparison && <td className="text-right">{formatCurrency(point.comparison ?? 0)}</td>}
          </tr>)}</tbody>
        </table>
      </div>
    </details>
  </figure>;
}

function Calculator({ definition }: { definition: typeof simulators[number] }) {
  const [fields, setFields] = useState<Record<string, string>>(() => Object.fromEntries(definition.fields.map(field => [field.name, String(field.initial)])));
  const result = (() => {
    try {
      return simulate(definition, Object.fromEntries(Object.entries(fields).map(([name, value]) => [name, value.trim() === '' ? Number.NaN : Number(value)])));
    } catch (reason) {
      return reason instanceof Error ? reason.message : 'Revise os parâmetros.';
    }
  })();

  return <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
    <fieldset className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <legend className="px-2 font-bold">Parâmetros do cenário</legend>
      {definition.fields.map(field => <label className="grid gap-1 text-sm font-semibold" key={field.name}>{field.label}
        <input type="number" inputMode={field.step === 1 ? 'numeric' : 'decimal'} min={field.min} max={field.max} step={field.step}
          className="min-w-0 rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950"
          value={fields[field.name]} onChange={event => setFields({ ...fields, [field.name]: event.currentTarget.value })} />
      </label>)}
    </fieldset>
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900" aria-label="Resultados">
      <h2 className="font-bold">Resultados da simulação</h2>
      {typeof result === 'string' ? <p role="status">{result}</p> : <>
        <dl className="space-y-1" aria-live="polite">{result.summary.map(entry => <div className="flex flex-wrap justify-between gap-1" key={entry.label}>
          <dt>{entry.label}</dt><dd className="font-semibold">{typeof entry.value === 'string' ? entry.value :
            entry.unit === 'months' ? entry.value.toLocaleString('pt-BR') + (entry.value === 1 ? ' mês' : ' meses') : formatCurrency(entry.value)}</dd>
        </div>)}</dl>
        <Chart result={result} />
      </>}
      <p className="text-sm text-slate-600 dark:text-slate-300">{definition.assumptions}</p>
    </section>
  </div>;
}

export default function SimulatorsView() {
  const [selected, setSelected] = useState(simulators[0].id);
  const definition = simulators.find(item => item.id === selected) ?? simulators[0];
  const picker = useId();
  return <section className="space-y-4">
    <header><h1 className="text-2xl font-bold">Simuladores financeiros</h1><p className="text-sm">{educationNotice}</p></header>
    <div className="grid max-w-lg gap-1 text-sm font-semibold">
      <label htmlFor={picker}>Simulação</label>
      <select id={picker} className="min-w-0 rounded-xl border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950"
        value={selected} onChange={event => setSelected(event.currentTarget.value)}>
        {simulators.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>
    </div>
    <Calculator key={selected} definition={definition} />
  </section>;
}
