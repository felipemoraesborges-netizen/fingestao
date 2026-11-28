import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import type { LearningSnapshot } from '../../learning/contracts';
import { sendLearningAction } from '../../services/learningService';
import { formatDate } from '../../utils/formatters';
import { trailSecondary } from '../trail/TrailDialog';

const panel = 'space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900';

export function SkillView({ onStudy }: { onStudy: (id: string) => void }) {
  const [snapshot, setSnapshot] = useState<LearningSnapshot>();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void sendLearningAction({ action: 'state' }, controller.signal).then(value => {
      if (!controller.signal.aborted) { setSnapshot(value); setError(''); }
    }, (reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar as especializações.');
    });
    return () => controller.abort();
  }, [retry]);

  return <section className="space-y-4">
    <h1 className="text-2xl font-black">Habilidades e temporadas</h1>
    {error && <div role="alert" className={panel}><p>{error}</p><button type="button" className={trailSecondary} onClick={() => setRetry(retry + 1)}>Tentar novamente</button></div>}
    {!snapshot && !error && <p role="status">Carregando habilidades…</p>}
    {snapshot && <>
      <section className="space-y-3 rounded-2xl bg-emerald-900 p-4 text-white">
        <div><p className="text-sm font-semibold">Temporada atual</p><h2 className="text-xl font-black">{snapshot.season.title}</h2>
          <p className="text-sm">De {formatDate(snapshot.season.start)} até o início de {formatDate(snapshot.season.end)}</p></div>
        <p>{snapshot.season.done ? 'Temporada concluída' : snapshot.season.progress + ' de ' + snapshot.season.target + ' lições e provas novas concluídas'}</p>
        <button type="button" className="rounded-lg border border-emerald-300 px-3 py-2 text-left text-sm font-semibold hover:bg-emerald-800"
          onClick={() => onStudy(snapshot.season.highlight.lessonId)}>{snapshot.season.highlight.title} · abrir lição</button>
      </section>
      <div className="grid gap-3 md:grid-cols-2">{snapshot.skills.map(skill => <section key={skill.id} className={panel}>
        <h2 className="font-bold">{skill.title}{skill.done && ' · concluída'}</h2><p className="text-sm">{skill.description}</p>
        <ol className="space-y-2 border-l-2 border-violet-300 pl-3 dark:border-violet-700">{skill.nodes.map(node => <li key={node.lessonId} className="flex items-center gap-2">
          {node.done && <Check size={16} className="shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />}
          <button type="button" className="min-h-10 text-left text-sm font-semibold underline" onClick={() => onStudy(node.lessonId)}>{node.title}</button>
          {node.done && <span className="sr-only">Concluído</span>}
        </li>)}</ol>
      </section>)}</div>
    </>}
  </section>;
}
