import { z } from 'zod';

const text = z.string().trim().min(1);
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(96);
const option = z.object({ id, text, feedback: text.optional() });
const question = { id, prompt: text, explanation: text, tags: z.array(id).min(1) };
const options = z.array(option).min(2).max(16);
const choices = { ...question, options, correct: id };
const simulation = z.object({
  ...question, kind: z.literal('simulation'), min: z.number().nonnegative(), max: z.number().positive(),
  increment: z.number().positive(), months: z.number().int().min(1).max(120),
  monthlyRate: z.number().min(0).max(.5), target: z.number().positive(), correct: z.number().nonnegative(),
});
const step = z.discriminatedUnion('kind', [
  z.object({ id, kind: z.literal('note'), prompt: text, body: text, example: text }),
  z.object({ ...choices, kind: z.literal('choice') }),
  z.object({ ...choices, kind: z.literal('cloze') }),
  z.object({ ...choices, kind: z.literal('scenario') }),
  z.object({ ...question, kind: z.literal('boolean'), correct: z.boolean() }),
  z.object({ ...question, kind: z.literal('order'), options, correct: z.array(id).min(2).max(16) }),
  z.object({ ...question, kind: z.literal('pairs'), left: options, right: options, correct: z.record(id, id) }),
  simulation,
]);
const lesson = z.object({
  id, title: text, objective: text, minutes: z.number().int().min(2).max(5),
  practice: z.enum(['dashboard', 'transactions', 'categories', 'purchases', 'savings', 'investments', 'reports']),
  steps: z.array(step).min(5).max(10),
});
export const worldSchema = z.object({
  id, title: text, description: text, icon: id, color: z.string().regex(/^#[0-9a-f]{6}$/i), badge: text,
  lessons: z.array(lesson).min(5).max(8), exam: lesson,
}).superRefine((world, context) => {
  const ids = new Set<string>();
  const requireRule = (valid: boolean, message: string) => {
    if (!valid) context.addIssue({ code: 'custom', message });
  };
  const sameIds = (left: string[], right: string[]) =>
    left.length === right.length && new Set(left).size === left.length && left.every(value => right.includes(value));

  for (const item of [...world.lessons, world.exam]) {
    requireRule(!ids.has(item.id), 'ID repetido: ' + item.id);
    ids.add(item.id);
    requireRule(item.steps.some(point => point.kind !== 'note'), 'Lição sem exercício: ' + item.id);
    for (const point of item.steps) {
      requireRule(!ids.has(point.id), 'ID repetido: ' + point.id);
      ids.add(point.id);
      if ('options' in point) {
        const choices = point.options.map(option => option.id);
        requireRule(new Set(choices).size === choices.length, 'Opções repetidas: ' + point.id);
        requireRule(point.kind === 'order' ? sameIds(point.correct, choices) : choices.includes(point.correct), 'Resposta fora das opções: ' + point.id);
      } else if (point.kind === 'pairs') {
        requireRule(sameIds(point.left.map(option => option.id), Object.keys(point.correct)) &&
          sameIds(point.right.map(option => option.id), Object.values(point.correct)), 'Pares inconsistentes: ' + point.id);
      } else if (point.kind === 'simulation') {
        requireRule(point.min < point.max && point.correct >= point.min && point.correct <= point.max &&
          Number.isInteger((point.correct - point.min) / point.increment), 'Controle da simulação inválido: ' + point.id);
      }
    }
  }
});

export type ContentStep = z.infer<typeof step>;
export type ContentLesson = z.infer<typeof lesson>;
export type ContentWorld = z.infer<typeof worldSchema>;
