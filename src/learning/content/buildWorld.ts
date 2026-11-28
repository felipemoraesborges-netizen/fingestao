import { worldSchema } from './schema.ts';
import type { ContentLesson, ContentStep, ContentWorld } from './schema.ts';

type Exercise = Exclude<ContentStep, { kind: 'note' }>;
type Choice = [text: string, feedback?: string];

export function pick(kind: 'choice' | 'scenario' | 'cloze', prompt: string, explanation: string, correct: number, ...choices: (Choice | string)[]): Exercise {
  return {
    id: '', kind, prompt, explanation, tags: [], correct: `op-${correct}`,
    options: choices.map((choice, index) => ({ id: `op-${index + 1}`, text: typeof choice === 'string' ? choice : choice[0],
      feedback: typeof choice === 'string' ? undefined : choice[1] })),
  };
}

export function truth(prompt: string, correct: boolean, explanation: string): Exercise {
  return { id: '', kind: 'boolean', prompt, correct, explanation, tags: [] };
}

export function order(prompt: string, items: string[], correct: number[], explanation: string): Exercise {
  return { id: '', kind: 'order', prompt, options: items.map((text, index) => ({ id: `op-${index + 1}`, text })),
    correct: correct.map(position => `op-${position}`), explanation, tags: [] };
}

export function simulation(prompt: string, months: number, monthlyRate: number, target: number, correct: number, explanation: string): Exercise {
  return { id: '', kind: 'simulation', prompt, min: 0, max: 500, increment: 10, months, monthlyRate, target, correct, explanation, tags: [] };
}

interface LessonDraft {
  id: string;
  title: string;
  objective: string;
  practice: ContentLesson['practice'];
  reading: [heading: string, description: string, example: string];
  exercises: [Exercise, Exercise, Exercise, Exercise];
  exam: Exercise;
}

export function defineWorld(info: Omit<ContentWorld, 'lessons' | 'exam'>, drafts: LessonDraft[]) {
  const question = (exercise: Exercise, id: string, topic: string): Exercise => ({ ...exercise, id, tags: [topic] });
  const lessons = drafts.map(({ id, title, objective, practice, reading, exercises }) => ({
    id, title, objective, practice, minutes: 4,
    steps: [
      { id: id + '-leitura', kind: 'note', prompt: reading[0], body: reading[1], example: reading[2] },
      ...exercises.map((exercise, index) => question(exercise, `${id}-q${index + 1}`, id)),
    ],
  }));
  const exam = { id: info.id + '-prova', title: 'Prova do mundo', objective: 'Aplique as ideias deste mundo em novas situações.', minutes: 4,
    practice: drafts[0]?.practice, steps: drafts.map(draft => question(draft.exam, `${draft.id}-prova`, draft.id)) };
  return worldSchema.parse({ ...info, lessons, exam });
}
