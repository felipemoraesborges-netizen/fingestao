import { randomUUID } from 'node:crypto';
import { worlds } from '../src/learning/content/curriculum.ts';
import { seasonFor, specializations } from '../src/learning/specializations.ts';
import type { ContentLesson, ContentStep, ContentWorld } from '../src/learning/content/schema.ts';
import type { ActiveLesson, Answer, LearningAction, LearningSnapshot, LessonInfo, PracticeChallenge, StepView, StudyFeedback, StudyMode } from '../src/learning/contracts.ts';

const dayMs = 86_400_000;
const heartMs = 30 * 60_000;
const brazil = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
const worldLessons = (world: ContentWorld) => [...world.lessons, world.exam];
const lessons = worlds.flatMap(world => worldLessons(world).map(lesson => [lesson.id, { lesson, world }] as const));
const byLesson = new Map(lessons);

export class LearningError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

interface Session {
  id: string;
  mode: StudyMode;
  queue: string[];
  index: number;
  first: Record<string, boolean>;
  feedback: StudyFeedback | null;
  done: boolean;
  passed: boolean;
  stars: number;
  score: number;
}

interface Profile {
  jogo_ativo: boolean;
  aprendizado_revisao: string | null;
  xp: number;
  nivel: number;
  moedas: number;
  vidas: number;
  vidas_atualizadas_em: string | null;
  sequencia_dias: number;
  melhor_sequencia: number;
  ultimo_estudo_em: string | null;
  congelamentos: number;
  ultimo_mundo_id: string | null;
}

interface LessonRow {
  id: string;
  licao_id: string;
  estrelas: number;
  melhor_pontuacao: number;
  tentativas: number;
  concluida_em: string | null;
  atualizado_em: string;
  sessao: Session;
}

interface ResponseRow {
  licao_id: string;
  pergunta_id: string;
  revisar_em: string | null;
}

interface MissionRow {
  id: string;
  missao_id: string;
  periodo_tipo: 'diaria' | 'semanal';
  periodo_inicio: string;
  progresso: number;
  meta: number;
  concluida_em: string | null;
}

interface Reward {
  id: string;
  chave_evento: string;
  tipo: 'etapa' | 'licao' | 'prova' | 'missao' | 'sequencia' | 'treino' | 'desafio' | 'meta';
  xp: number;
  moedas_ganhas: number;
  anuncia: boolean;
  conquista?: { id: string; titulo: string; descricao: string; icone_nome: string };
}

export interface StudyData {
  perfil: Profile;
  licoes: LessonRow[];
  respostas: ResponseRow[];
  missoes: MissionRow[];
  chaves: string[];
  xp_dia: number;
  pendentes: { id: string; chave_evento: string; xp: number; moedas_ganhas: number }[];
  tem_gasto: boolean;
  pratica?: PracticeData;
}

export interface PracticeData {
  dias: number;
  teto: boolean;
  meta: boolean;
  aporte: boolean | null;
  semanasMes: number;
  diasPoupanca: number;
  semanasPoupanca: number;
  produtos: string[];
  chaves: string[];
}

export interface StudyBatch {
  perfil: Profile;
  eventos: Reward[];
  missoes: MissionRow[];
  licao?: LessonRow;
  resposta?: ResponseRow & { id: string; tentativa_id: string; rodada: number; acertou: boolean; respondida_em: string };
}

const missionDefinitions = [
  { id: 'estudo-do-dia', title: 'Conclua uma lição hoje', period: 'diaria', target: 1, xp: 15, coins: 5 },
  { id: 'gasto-do-dia', title: 'Registre um gasto hoje', period: 'diaria', target: 1, xp: 15, coins: 5 },
  { id: 'dez-acertos', title: 'Acerte 10 perguntas seguidas', period: 'diaria', target: 10, xp: 25, coins: 10 },
  { id: 'duas-licoes', title: 'Conclua 2 lições distintas nesta semana', period: 'semanal', target: 2, xp: 35, coins: 12 },
] as const;

type MissionId = typeof missionDefinitions[number]['id'];

const challenges: Omit<PracticeChallenge, 'progress' | 'done' | 'available'>[] = [
  { id: 'sete-dias', title: 'Registre gastos em sete dias diferentes', target: 7, tool: 'transactions', xp: 50, coins: 15 },
  { id: 'primeiro-teto', title: 'Defina um teto para uma categoria de despesa', target: 1, tool: 'categories', xp: 30, coins: 10 },
  { id: 'primeira-meta', title: 'Crie uma meta de poupança ou de compra', target: 1, tool: 'savings', xp: 30, coins: 10 },
  { id: 'primeiro-aporte', title: 'Faça um aporte em Metas de compra', target: 1, tool: 'purchases', xp: 40, coins: 12 },
  ...[7, 15, 30, 90, 365].map((total, index) => ({
    id: 'poupar-' + total, title: 'Guarde dinheiro em ' + total + ' dias diferentes', target: total,
    tool: 'savings' as const, xp: 35 + index * 20, coins: 10 + index * 5,
  })),
  { id: 'poupar-52-semanas', title: 'Desafio das 52 semanas de economia', target: 52, tool: 'savings', xp: 120, coins: 30 },
];

const monthlyMissions = [
  { id: 'quatro-semanas', title: 'Registre gastos em quatro semanas do mês', target: 4, xp: 50, coins: 12 },
  { id: 'quatro-licoes', title: 'Conclua quatro novas lições no mês', target: 4, xp: 60, coins: 15 },
] as const;

function monthlyProgress(data: StudyData, now: Date) {
  const month = isoDay(now).slice(0, 7);
  const lessonCount = data.licoes.filter(lesson => {
    const entry = byLesson.get(lesson.licao_id);
    return entry && entry.world.exam.id !== lesson.licao_id && lesson.concluida_em &&
      isoDay(new Date(lesson.concluida_em)).startsWith(month);
  }).length;
  return monthlyMissions.map((item, index) => {
    const key = 'mensal:' + item.id + ':' + month;
    const done = data.pratica?.chaves.includes(key) ?? false;
    return { ...item, key, period: 'mensal' as const, done, progress: done ? item.target : Math.min(item.target, index === 0 ? data.pratica?.semanasMes ?? 0 : lessonCount) };
  });
}

function seasonalProgress(data: StudyData, now: Date) {
  const season = seasonFor(isoDay(now));
  const target = 5;
  const done = data.pratica?.chaves.includes(season.key) ?? false;
  const progress = data.licoes.filter(row => {
    if (!row.concluida_em) return false;
    const day = isoDay(new Date(row.concluida_em));
    return day >= season.start && day < season.end;
  }).length;
  return { ...season, target, progress: done ? target : Math.min(target, progress), done };
}

function skillProgress(data: StudyData) {
  return specializations.map(path => {
    const nodes = path.nodes.map(([title, lessonId]) => ({ title, lessonId, done: completed(data, lessonId) }));
    return { ...path, nodes, done: nodes.every(node => node.done) };
  });
}

function practiceChallenges(data: StudyData): PracticeChallenge[] {
  const source = data.pratica;
  const values = [source?.dias ?? 0, Number(source?.teto ?? false), Number(source?.meta ?? false), Number(source?.aporte ?? false),
    ...Array<number>(5).fill(source?.diasPoupanca ?? 0), source?.semanasPoupanca ?? 0];
  return challenges.map((item, index) => {
    const done = source?.chaves.includes('desafio:' + item.id) ?? false;
    return { ...item, done, available: Boolean(source),
      progress: done ? item.target : Math.min(item.target, values[index]) };
  });
}

const isoDay = (value: Date) => brazil.format(value);
const epochDay = (value: string) => Date.parse(value + 'T00:00:00Z') / dayMs;

export function studyCalendar(now: Date) {
  const day = isoDay(now);
  const monday = new Date(epochDay(day) * dayMs);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  return { day, week: monday.toISOString().slice(0, 10) };
}

function lessonInfo(lesson: ContentLesson): LessonInfo {
  const { id, title, objective, minutes, practice } = lesson;
  return { id, title, objective, minutes, practice };
}

function publicStep(point: ContentStep): StepView {
  if (point.kind === 'note') return point;
  const { correct: answerKey, explanation, tags, ...visible } = point;
  void [answerKey, explanation, tags];
  const list = (values: { id: string; text: string }[]) => values.map(({ id, text }) => ({ id, text }));
  if ('options' in visible) return { ...visible, options: list(visible.options) };
  if (visible.kind === 'pairs') return { ...visible, left: list(visible.left), right: list(visible.right) };
  return visible;
}

function energy(profile: Profile, now: Date) {
  const next = { ...profile };
  const reference = profile.vidas_atualizadas_em ? Date.parse(profile.vidas_atualizadas_em) : now.valueOf();
  const recovered = Math.max(0, Math.floor((now.valueOf() - reference) / heartMs));
  next.vidas = Math.min(5, next.vidas + recovered);
  if (next.vidas === 5) next.vidas_atualizadas_em = null;
  else if (recovered || !profile.vidas_atualizadas_em) next.vidas_atualizadas_em = new Date(reference + recovered * heartMs).toISOString();
  return next;
}

function visibleStreak(profile: Profile, now: Date) {
  if (!profile.ultimo_estudo_em) return 0;
  const gap = epochDay(isoDay(now)) - epochDay(isoDay(new Date(profile.ultimo_estudo_em)));
  return gap <= profile.congelamentos + 1 ? profile.sequencia_dias : 0;
}

function dueIds(data: StudyData, lessonId: string, now: Date) {
  return new Set(data.respostas.filter(item => item.licao_id === lessonId && item.revisar_em &&
    Date.parse(item.revisar_em) <= now.valueOf()).map(item => item.pergunta_id));
}

function completed(data: StudyData, id: string) {
  return data.licoes.some(row => row.licao_id === id && row.concluida_em !== null);
}

function worldOpen(data: StudyData, world: ContentWorld) {
  const index = worlds.indexOf(world);
  return index === 0 || world.id === 'grandes-compras' || completed(data, worlds[index - 1].exam.id);
}

function canOpen(data: StudyData, world: ContentWorld, lesson: ContentLesson) {
  if (completed(data, lesson.id)) return true;
  if (!worldOpen(data, world)) return false;
  if (lesson.id === world.exam.id) return world.lessons.every(item => completed(data, item.id));
  const index = world.lessons.findIndex(item => item.id === lesson.id);
  return index === 0 || (index > 0 && completed(data, world.lessons[index - 1].id));
}

function activeLesson(lesson: ContentLesson, session: Session): ActiveLesson {
  const step = lesson.steps.find(point => point.id === session.queue[session.index]);
  return {
    lesson: lessonInfo(lesson), sessionId: session.id, mode: session.mode, cursor: session.index,
    length: session.queue.length, retry: session.queue.slice(0, session.index).includes(step?.id ?? ''),
    done: session.done, passed: session.passed, stars: session.stars, score: session.score,
    step: !session.done && step ? publicStep(step) : null, feedback: session.feedback,
  };
}

function rewardTitle(key: string) {
  const [type, id] = key.split(':');
  const lesson = byLesson.get(id)?.lesson;
  if (type === 'missao') return missionDefinitions.find(item => item.id === id)?.title ?? 'Missão concluída';
  if (type === 'mensal') return monthlyMissions.find(item => item.id === id)?.title ?? 'Missão mensal concluída';
  if (type === 'perfeita' && lesson) return 'Nota máxima em ' + lesson.title;
  if (type === 'licao' && lesson) return 'Lição concluída · ' + lesson.title;
  if (type === 'mundo') return worlds.find(item => item.id === id)?.badge ?? 'Mundo concluído';
  if (type === 'desafio') return challenges.find(item => item.id === id)?.title ?? 'Desafio concluído';
  if (type === 'meta') return 'Meta de compra conquistada';
  if (type === 'temporada') return 'Temporada concluída';
  if (type === 'especializacao') return specializations.find(item => item.id === id)?.title ?? 'Especialização concluída';
  if (type === 'sequencia') return Number(id) > 0 ? id + ' dias de estudo' : 'Congelamento de sequência conquistado';
  return 'Recompensa de estudo';
}

export function makeSnapshot(data: StudyData, lessonId: string | undefined, now: Date, worldId?: string): LearningSnapshot {
  const profile = energy(data.perfil, now);
  const calendar = studyCalendar(now);
  const rows = new Map(data.licoes.map(row => [row.licao_id, row]));
  const entry = lessonId ? byLesson.get(lessonId) : undefined;
  const lesson = entry?.lesson;
  const world = entry?.world ?? worlds.find(item => item.id === (worldId ?? profile.ultimo_mundo_id)) ?? worlds[0];
  const worldList = worlds.map(({ id, title, description, icon, color, badge, exam }, index) => ({
    id, title, description, icon, color, badge, completed: completed(data, exam.id), locked: !worldOpen(data, worlds[index]),
  }));
  const selected = lesson ? rows.get(lesson.id) : undefined;
  return {
    world: worldList[worlds.indexOf(world)], worlds: worldList,
    player: {
      xp: profile.xp, level: profile.nivel, coins: profile.moedas, lives: profile.vidas,
      nextLifeAt: profile.vidas_atualizadas_em ? new Date(Date.parse(profile.vidas_atualizadas_em) + heartMs).toISOString() : null,
      streak: visibleStreak(profile, now), bestStreak: profile.melhor_sequencia, freezes: profile.congelamentos, xpToday: data.xp_dia,
    },
    lessons: worldLessons(world).map(item => {
      const row = rows.get(item.id);
      return {
        ...lessonInfo(item), stars: row?.estrelas ?? 0, score: row?.melhor_pontuacao ?? 0,
        locked: !canOpen(data, world, item), resumable: Boolean(row?.sessao.id && !row.sessao.done),
        exam: item.id === world.exam.id, reviewDue: dueIds(data, item.id, now).size,
      };
    }),
    missions: [...missionDefinitions.map(item => {
      const start = item.period === 'diaria' ? calendar.day : calendar.week;
      const row = data.missoes.find(value => value.missao_id === item.id && value.periodo_inicio === start);
      return { id: item.id, title: item.title, period: item.period, target: item.target, progress: row?.progresso ?? 0, done: Boolean(row?.concluida_em) };
    }), ...monthlyProgress(data, now)],
    rewards: data.pendentes.map(item => ({ id: item.id, title: rewardTitle(item.chave_evento), xp: item.xp, coins: item.moedas_ganhas,
      lessonId: item.chave_evento.startsWith('meta:') ? 'comp-planejamento' : undefined })),
    challenges: practiceChallenges(data),
    season: seasonalProgress(data, now),
    skills: skillProgress(data),
    active: lesson && selected?.sessao.id ? activeLesson(lesson, selected.sessao) : null,
  };
}

function grade(point: Exclude<ContentStep, { kind: 'note' }>, answer: Answer): StudyFeedback {
  let correct: boolean;
  switch (point.kind) {
    case 'order':
      correct = Array.isArray(answer) && answer.length === point.correct.length &&
        point.correct.every((key, index) => answer[index] === key);
      break;
    case 'pairs':
      correct = typeof answer === 'object' && !Array.isArray(answer) &&
        Object.keys(answer).length === Object.keys(point.correct).length &&
        Object.entries(point.correct).every(([key, value]) => answer[key] === value);
      break;
    default:
      correct = answer === point.correct;
  }
  const response = 'options' in point && typeof answer === 'string' ? point.options.find(item => item.id === answer)?.feedback : undefined;
  return { correct, explanation: response ? response + ' ' + point.explanation : point.explanation };
}

export function planStudy(data: StudyData, action: Exclude<LearningAction, { action: 'acknowledge' }>, now = new Date()): StudyBatch | null {
  if (!data.perfil.jogo_ativo) throw new LearningError('Ative o Modo Jogo nas configurações para estudar.', 403);
  const calendar = studyCalendar(now);
  const timestamp = now.toISOString();
  const batch: StudyBatch = { perfil: energy(data.perfil, now), eventos: [], missoes: [] };
  const used = new Set([...data.chaves, ...(data.pratica?.chaves ?? [])]);
  const earn = (key: string, type: Reward['tipo'], xp: number, coins: number, title?: string, icon = 'Trophy') => {
    if (used.has(key)) return false;
    used.add(key);
    batch.eventos.push({
      id: randomUUID(), chave_evento: key, tipo: type, xp, moedas_ganhas: coins, anuncia: type !== 'etapa' && (xp > 0 || coins > 0),
      conquista: title ? { id: randomUUID(), titulo: title, descricao: 'Conquista de aprendizado do FinGestão.', icone_nome: icon } : undefined,
    });
    return true;
  };
  const mission = (id: MissionId, progress: (old: number) => number) => {
    const definition = missionDefinitions.find(item => item.id === id);
    if (!definition) return;
    const period = definition.period === 'diaria' ? calendar.day : calendar.week;
    const old = data.missoes.find(row => row.missao_id === id && row.periodo_inicio === period);
    if (old?.concluida_em) return;
    const value = Math.max(0, Math.min(definition.target, progress(old?.progresso ?? 0)));
    if (value === (old?.progresso ?? 0)) return;
    batch.missoes.push({
      id: old?.id ?? randomUUID(), missao_id: id, periodo_tipo: definition.period, periodo_inicio: period,
      progresso: value, meta: definition.target, concluida_em: value === definition.target ? timestamp : null,
    });
    if (value === definition.target) earn('missao:' + id + ':' + period, 'missao', definition.xp, definition.coins);
  };

  if (action.action === 'state' || action.action === 'expense') {
    if (data.tem_gasto) mission('gasto-do-dia', () => 1);
    for (const item of practiceChallenges(data)) {
      if (!item.done && item.progress >= item.target) earn('desafio:' + item.id, 'desafio', item.xp, item.coins, item.title, 'Award');
    }
    for (const item of monthlyProgress(data, now)) {
      if (!item.done && item.progress >= item.target) earn(item.key, 'missao', item.xp, item.coins);
    }
    const season = seasonalProgress(data, now);
    if (!season.done && season.progress >= season.target) earn(season.key, 'desafio', 90, 25, season.title, 'Medal');
    for (const path of skillProgress(data)) if (path.done) earn('especializacao:' + path.id, 'desafio', 75, 20, path.title, 'Medal');
    for (const goal of data.pratica?.produtos ?? []) earn('meta:' + goal, 'meta', 45, 15);
    return batch.missoes.length || batch.eventos.length ? batch : null;
  }

  const entry = byLesson.get(action.lessonId);
  if (!entry) throw new LearningError('Não encontramos essa lição.', 404);
  const { lesson, world } = entry;
  const previous = data.licoes.find(row => row.licao_id === lesson.id);
  const exam = lesson.id === world.exam.id;
  const saveSession = (session: Session) => {
    batch.licao = previous ? { ...previous, sessao: session, atualizado_em: timestamp } : {
      id: randomUUID(), licao_id: lesson.id, estrelas: 0, melhor_pontuacao: 0, concluida_em: null,
      tentativas: 0, atualizado_em: timestamp, sessao: session,
    };
    batch.perfil.ultimo_mundo_id = world.id;
    return batch.licao;
  };

  if (action.action === 'start') {
    if (!canOpen(data, world, lesson)) throw new LearningError('Conclua as lições anteriores para liberar esta etapa.', 409);
    if (action.mode === 'revisar' && !previous?.concluida_em) throw new LearningError('Conclua a lição antes de revisar.');
    if (previous?.sessao.id && !previous.sessao.done && previous.sessao.mode === action.mode) return null;
    const isStudy = action.mode === 'normal';
    if (isStudy && !batch.perfil.vidas) throw new LearningError('As vidas acabaram. Você pode continuar no Treinar.', 409);
    const due = action.mode === 'revisar' ? dueIds(data, lesson.id, now) : new Set<string>();
    const queue = lesson.steps.filter(point => !due.size || due.has(point.id)).map(point => point.id);
    const row = saveSession({ id: randomUUID(), mode: action.mode, queue, index: 0, first: {}, feedback: null, done: false, passed: false, stars: 0, score: 0 });
    row.tentativas++;
    return batch;
  }

  const saved = previous?.sessao;
  if (!saved?.id || saved.id !== action.sessionId) throw new LearningError('A lição mudou em outra tela. Abra-a novamente.', 409);
  if (saved.done) return null;
  const session: Session = { ...saved, queue: [...saved.queue], first: { ...saved.first } };
  if (action.action === 'train') {
    if (session.mode !== 'normal') return null;
    session.mode = 'treinar';
    saveSession(session);
    return batch;
  }
  if (session.index !== action.cursor) return null;
  const point = lesson.steps.find(item => item.id === session.queue[session.index]);
  if (!point) throw new LearningError('Uma etapa da lição mudou. Abra a lição novamente.', 409);

  if (action.action === 'answer') {
    if (session.feedback || point.kind === 'note') return null;
    if (session.mode === 'normal' && !batch.perfil.vidas) throw new LearningError('Continue pelo Treinar ou aguarde a próxima vida.', 409);
    const feedback = grade(point, action.answer);
    const round = session.queue.slice(0, session.index).filter(id => id === point.id).length;
    if (round === 0) {
      session.first[point.id] = feedback.correct;
      if (!feedback.correct) session.queue.push(point.id);
    }
    session.feedback = feedback;
    if (feedback.correct && session.mode === 'normal') earn('etapa:' + point.id, 'etapa', 5, 0);
    if (!feedback.correct && session.mode === 'normal') {
      batch.perfil.vidas--;
      batch.perfil.vidas_atualizadas_em ??= timestamp;
    }
    mission('dez-acertos', old => feedback.correct ? old + 1 : 0);
    batch.resposta = {
      id: randomUUID(), licao_id: lesson.id, pergunta_id: point.id, tentativa_id: session.id, rodada: round,
      acertou: feedback.correct, respondida_em: timestamp,
      revisar_em: new Date(now.valueOf() + dayMs * (feedback.correct && session.first[point.id] ? 3 : 1)).toISOString(),
    };
    saveSession(session);
    return batch;
  }

  if (point.kind !== 'note' && !session.feedback) throw new LearningError('Responda antes de continuar.');
  session.index++;
  session.feedback = null;
  const row = saveSession(session);
  if (session.index < session.queue.length) return batch;

  const scores = Object.values(session.first);
  session.score = scores.length ? Math.round(scores.filter(Boolean).length * 100 / scores.length) : 0;
  session.stars = session.score === 100 ? 3 : session.score >= 70 ? 2 : 1;
  session.done = true;
  session.passed = !exam || session.score >= 60;
  const eligible = session.mode === 'normal' || (!previous?.concluida_em && session.mode === 'treinar');
  if (eligible) {
    row.melhor_pontuacao = Math.max(row.melhor_pontuacao, session.score);
    row.estrelas = Math.max(row.estrelas, session.stars);
    if (session.passed) {
      row.concluida_em ??= timestamp;
      if (exam) {
        if (earn('mundo:' + world.id, 'prova', 120, 35, world.badge, world.icon)) batch.perfil.congelamentos++;
      } else {
        earn('licao:' + lesson.id, 'licao', 40, 12, 'Lição concluída: ' + lesson.title, 'Medal');
      }
      if (session.stars === 3) earn('perfeita:' + lesson.id, 'licao', 15, 5, 'Nota máxima: ' + lesson.title, 'Star');
    }
  }
  if (previous?.concluida_em && session.mode !== 'normal' && batch.perfil.vidas < 5 &&
      earn('vida:' + calendar.day + ':' + lesson.id, 'treino', 0, 0)) {
    batch.perfil.vidas++;
    if (batch.perfil.vidas === 5) batch.perfil.vidas_atualizadas_em = null;
  }

  const last = batch.perfil.ultimo_estudo_em;
  const gap = last ? epochDay(calendar.day) - epochDay(isoDay(new Date(last))) : Number.POSITIVE_INFINITY;
  if (gap > 0) {
    if (gap - 1 <= batch.perfil.congelamentos) {
      batch.perfil.congelamentos -= gap - 1;
      batch.perfil.sequencia_dias++;
    } else {
      batch.perfil.sequencia_dias = 1;
    }
    batch.perfil.ultimo_estudo_em = timestamp;
    batch.perfil.melhor_sequencia = Math.max(batch.perfil.melhor_sequencia, batch.perfil.sequencia_dias);
    if (batch.perfil.sequencia_dias === 3 && earn('sequencia:congelamento-inicial', 'sequencia', 10, 5)) batch.perfil.congelamentos++;
    for (const milestone of [7, 30, 100]) {
      if (batch.perfil.sequencia_dias >= milestone &&
          earn('sequencia:' + milestone, 'sequencia', 25, 10, milestone + ' dias de estudo', 'Award')) batch.perfil.congelamentos++;
    }
  }
  if (session.passed) {
    mission('estudo-do-dia', () => 1);
    if (!exam && earn('atividade:' + calendar.week + ':' + lesson.id, 'treino', 0, 0)) mission('duas-licoes', old => old + 1);
  }
  return batch;
}
