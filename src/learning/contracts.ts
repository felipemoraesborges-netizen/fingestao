export type StudyMode = 'normal' | 'treinar' | 'revisar';
export type Answer = string | boolean | number | string[] | Record<string, string>;
export type PracticeTool = 'dashboard' | 'transactions' | 'categories' | 'purchases' | 'savings' | 'investments' | 'reports';

export interface LibraryWorld {
  id: string;
  title: string;
  description: string;
  articles: { id: string; title: string; objective: string; practice: PracticeTool; sections: { heading: string; body: string; example: string }[] }[];
}

export interface WorldView {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  badge: string;
  completed: boolean;
  locked: boolean;
}

export interface PracticeChallenge {
  id: string;
  title: string;
  progress: number;
  target: number;
  done: boolean;
  tool: PracticeTool;
  xp: number;
  coins: number;
  available: boolean;
}

export interface Option {
  id: string;
  text: string;
}

export type StepView = { id: string; prompt: string } & (
  | { kind: 'note'; body: string; example: string }
  | { kind: 'choice' | 'cloze' | 'scenario'; options: Option[] }
  | { kind: 'boolean' }
  | { kind: 'order'; options: Option[] }
  | { kind: 'pairs'; left: Option[]; right: Option[] }
  | { kind: 'simulation'; min: number; max: number; increment: number; months: number; monthlyRate: number; target: number }
);

export interface LessonInfo {
  id: string;
  title: string;
  objective: string;
  minutes: number;
  practice: PracticeTool;
}

export interface LessonCard extends LessonInfo {
  stars: number;
  score: number;
  locked: boolean;
  resumable: boolean;
  reviewDue: number;
  exam: boolean;
}

export interface StudyFeedback { correct: boolean; explanation: string }

export interface ActiveLesson {
  lesson: LessonInfo;
  sessionId: string;
  mode: StudyMode;
  cursor: number;
  length: number;
  retry: boolean;
  done: boolean;
  passed: boolean;
  stars: number;
  score: number;
  step: StepView | null;
  feedback: StudyFeedback | null;
}

export interface LearningSnapshot {
  world: WorldView;
  worlds: WorldView[];
  player: { xp: number; level: number; coins: number; lives: number; nextLifeAt: string | null; streak: number; bestStreak: number; freezes: number; xpToday: number };
  lessons: LessonCard[];
  missions: { id: string; title: string; period: 'diaria' | 'semanal' | 'mensal'; progress: number; target: number; done: boolean }[];
  rewards: { id: string; title: string; xp: number; coins: number; lessonId?: string }[];
  challenges: PracticeChallenge[];
  season: { title: string; start: string; end: string; progress: number; target: number; done: boolean; highlight: { title: string; lessonId: string } };
  skills: { id: string; title: string; description: string; done: boolean; nodes: { title: string; lessonId: string; done: boolean }[] }[];
  active: ActiveLesson | null;
}

export type LearningAction =
  | { action: 'state'; lessonId?: string; worldId?: string }
  | { action: 'start'; lessonId: string; mode: StudyMode }
  | { action: 'answer'; lessonId: string; sessionId: string; cursor: number; answer: Answer }
  | { action: 'next'; lessonId: string; sessionId: string; cursor: number }
  | { action: 'train'; lessonId: string; sessionId: string }
  | { action: 'acknowledge'; ids: string[]; worldId?: string }
  | { action: 'expense' };

export const educationNotice = 'Conteúdo educativo, não é recomendação de investimento.';

export function projectedSavings(monthly: number, months: number, monthlyRate: number) {
  return Array.from({ length: months + 1 }, (_, month) => {
    const value = monthlyRate === 0 ? monthly * month : monthly * Math.expm1(month * Math.log1p(monthlyRate)) / monthlyRate;
    return Math.round(value * 100) / 100;
  });
}
