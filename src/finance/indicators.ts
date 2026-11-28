import type { Category, Transaction } from '../types';

export function monthlyIndicators(transactions: Transaction[], categories: Category[], month: string) {
  const known = new Map(categories.map(item => [item.id, item]));
  const buckets = new Map<string, number>();
  const days = new Set<string>();
  let income = 0;
  let expenses = 0;
  let classified = 0;
  let budgeted = 0;
  for (const item of transactions) {
    if (!item.date.startsWith(month + '-')) continue;
    const cents = Math.round(item.amount * 100);
    if (!Number.isSafeInteger(cents) || cents <= 0) continue;
    days.add(item.date);
    if (item.type === 'income') income += cents;
    else if (item.type === 'expense') {
      expenses += cents;
      const category = known.get(item.categoryId);
      const bucket = category?.id ?? '';
      if (category) classified += cents;
      if (category?.type === 'expense' && category.budgetLimit > 0) budgeted += cents;
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + cents);
    }
  }
  const byCategory = [...buckets].map(([id, cents]) => ({ id, name: known.get(id)?.name ?? 'Sem categoria', amount: cents / 100 }))
    .sort((left, right) => right.amount - left.amount || left.name.localeCompare(right.name, 'pt-BR'));
  return { income: income / 100, expenses: expenses / 100, rate: income > 0 ? Math.max(0, (income - expenses) / income) : null,
    byCategory, days: days.size, classified: expenses ? classified / expenses : 0, budgeted: expenses ? budgeted / expenses : 0 };
}

export function healthIndicators(stats: ReturnType<typeof monthlyIndicators>, activeGoals: number) {
  if (stats.income <= 0 || stats.expenses <= 0 || stats.days < 3) return null;
  const pieces = [
    { title: 'Organização', description: 'Parcela dos gastos com categoria identificada.', weight: 25, score: stats.classified },
    { title: 'Orçamento', description: 'Parcela dos gastos em categorias com teto definido.', weight: 25, score: stats.budgeted },
    { title: 'Saldo do mês', description: 'Parcela da receita que sobrou, usando 20% como referência ilustrativa.', weight: 25, score: Math.min(1, (stats.rate ?? 0) / .2) },
    { title: 'Regularidade', description: 'Dias com registros, até uma referência de oito dias.', weight: 15, score: Math.min(1, stats.days / 8) },
    { title: 'Planejamento', description: 'Pelo menos uma meta de poupança cadastrada.', weight: 10, score: Number(activeGoals > 0) },
  ];
  return { total: Math.round(pieces.reduce((sum, piece) => sum + piece.score * piece.weight, 0)), pieces };
}
