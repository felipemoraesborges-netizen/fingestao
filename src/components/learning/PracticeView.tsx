import { useEffect, useState } from 'react';
import { sendLearningAction } from '../../services/learningService';
import type { PracticeChallenge } from '../../learning/contracts';
import type { ClassicTab } from '../../navigation/appRoutes';
import { trailSecondary } from '../trail/TrailDialog';
import FinancialProgress from './FinancialProgress';

export function PracticeView({ onPractice, onStudy }: { onPractice: (tool: ClassicTab) => void; onStudy: (id: string) => void }) {
  const [challenges, setChallenges] = useState<PracticeChallenge[]>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void sendLearningAction({ action: 'state' }, controller.signal).then(result => {
      if (!controller.signal.aborted) { setChallenges(result.challenges); setError(''); }
    }, (reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Não foi possível consultar seus desafios.');
    });
    return () => controller.abort();
  }, [attempt]);
  return <div className="space-y-6">
    <section className="space-y-3" aria-labelledby="practice-title">
      <h2 id="practice-title" className="text-xl font-bold">Desafios práticos</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">O progresso usa os registros da sua conta nos dois modos. Os desafios de economia contam períodos com aportes, independentemente do valor guardado.</p>
      {error ? <p role="alert" className="space-x-3"><span>{error}</span><button type="button" className={trailSecondary} onClick={() => setAttempt(attempt + 1)}>Tentar novamente</button></p> :
        !challenges ? <p role="status">Consultando desafios…</p> :
          <ul className="grid gap-3 sm:grid-cols-2">{challenges.map(item => <li key={item.id} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold">{item.title}</h3>
            <p className="text-sm">{item.done ? 'Concluído' : item.available ? `${item.progress} de ${item.target}` : 'Aguardando a configuração do Supabase'} · {item.xp} XP · {item.coins} fincoins</p>
            {!item.done && item.available && <button type="button" className={trailSecondary} onClick={() => onPractice(item.tool)}>Abrir ferramenta</button>}
          </li>)}</ul>}
    </section>
    <FinancialProgress onStudy={onStudy} onPractice={onPractice} />
  </div>;
}
