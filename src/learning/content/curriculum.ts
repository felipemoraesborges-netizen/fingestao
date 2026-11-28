import { firstWorld } from './primeirosPassos.ts';
import { orcamento, controle, reserva } from './planejamento.ts';
import { dividas, poupanca } from './creditoEMetas.ts';
import { investimentos, protecao } from './investimentosEProtecao.ts';
import { compras } from './compras.ts';
import type { LibraryWorld } from '../contracts.ts';

export const worlds = [firstWorld, orcamento, controle, reserva, dividas, poupanca, investimentos, protecao, compras];

const seen = new Set<string>();
for (const world of worlds) {
  const ids = [world.id, ...[...world.lessons, world.exam].flatMap(lesson => [lesson.id, ...lesson.steps.map(step => step.id)])];
  for (const id of ids) {
    if (seen.has(id)) throw new Error('ID de conteúdo repetido: ' + id);
    seen.add(id);
  }
}

export const library: LibraryWorld[] = worlds.map(({ id, title, description, lessons }) => ({
  id, title, description, articles: lessons.map(lesson => ({
    id: lesson.id, title: lesson.title, objective: lesson.objective, practice: lesson.practice,
    sections: lesson.steps.flatMap(step => step.kind === 'note' ? [{ heading: step.prompt, body: step.body, example: step.example }] : []),
  })),
}));
