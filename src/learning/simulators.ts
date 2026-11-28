export type Inputs = Record<string, number>;
export interface Field { name: string; label: string; initial: number; min: number; max: number; step: number }
interface Point { month: number; value: number; comparison?: number }
export interface SimulationResult { points: Point[]; summary: { label: string; value: number | string; unit?: 'months' | 'percent' }[] }
interface Simulation {
  id: string;
  title: string;
  assumptions: string;
  fields: Field[];
  model: (input: Inputs) => SimulationResult;
}

const field = (name: string, label: string, initial: number, max = 100_000_000, min = 0, step = 0.01): Field => ({ name, label, initial, min, max, step });
const principal = field('principal', 'Saldo inicial (R$)', 1_000);
const deposit = field('deposit', 'Aporte ao fim do mês (R$)', 100);
const months = field('months', 'Duração (meses)', 60, 600, 1, 1);
const monthlyRate = field('rate', 'Taxa mensal ilustrativa (%)', 0.6, 15);
const annualRate = field('rate', 'Taxa anual ilustrativa (%)', 8, 40);
const inflation = field('inflation', 'Inflação anual ilustrativa (%)', 4, 40);
const tax = field('tax', 'Imposto estimado sobre o ganho (%)', 15, 100);
const fee = field('fee', 'Custo anual estimado (% do saldo)', 0, 30);
const essential = field('essential', 'Gastos mensais (R$)', 2_000, 100_000_000, 0.01);
const withdrawal = field('withdrawal', 'Retirada anual hipotética (%)', 4, 100, 0.01);
const money = (label: string, value: number) => ({ label, value });
const duration = (label: string, value: number | string) => ({ label, value, unit: 'months' as const });
const pct = (value: number) => value / 100;
const last = (points: Point[]) => points.at(-1)?.value ?? 0;

function record(length: number, calculate: (month: number) => number): Point[] {
  return Array.from({ length: length + 1 }, (_, month) => ({ month, value: calculate(month) }));
}

function savings(initial: number, monthly: number, periods: number, rate: number) {
  let value = initial;
  return record(periods, month => {
    if (month) value = value * (1 + rate) + monthly;
    return value;
  });
}

function monthly(annual: number) {
  return Math.expm1(Math.log1p(annual) / 12);
}

function investment(input: Inputs, annual: number): SimulationResult {
  const charge = monthly(pct(input.fee));
  const yieldMonthly = monthly(annual);
  const points = savings(input.principal, input.deposit, input.months, (1 + yieldMonthly) / (1 + charge) - 1);
  const contribution = input.principal + input.deposit * input.months;
  const gain = Math.max(0, last(points) - contribution);
  const withheld = gain * pct(input.tax);
  return { points, summary: [money('Total aportado', contribution), money('Saldo antes do imposto simulado', last(points)),
    money('Imposto estimado no resgate', withheld), money('Saldo líquido estimado', last(points) - withheld)] };
}

const costFields = {
  price: field('price', 'Preço do bem (R$)', 100_000, 100_000_000, 0.01),
  down: field('down', 'Entrada (R$)', 20_000),
  extra: field('extra', 'Custos pagos à vista (R$)', 0),
};
function finance(input: Inputs, sac: boolean): SimulationResult {
  if (input.down > input.price) throw new Error('A entrada precisa caber no preço informado.');
  const debt = input.price - input.down;
  const rate = pct(input.rate);
  const period = input.months;
  const quota = debt / period;
  const fixed = rate === 0 ? quota : debt * rate / -Math.expm1(-period * Math.log1p(rate));
  let balance = debt;
  let paid = 0;
  const payments: number[] = [];
  const points = record(period, month => {
    if (month) {
      const interest = balance * rate;
      const amortization = sac ? Math.min(quota, balance) : Math.min(Math.max(fixed - interest, 0), balance);
      const payment = amortization + interest;
      payments.push(payment);
      paid += payment;
      balance -= amortization;
    }
    return Math.max(0, balance);
  });
  return { points, summary: [money('Valor financiado', debt), money('Primeira prestação estimada', payments[0]),
    money('Última prestação estimada', payments.at(-1) ?? 0), money('Juros estimados', Math.max(0, paid - debt)),
    money('Total com entrada e custos à vista', input.down + input.extra + paid)] };
}

export const simulators: Simulation[] = [
  { id: 'simples', title: 'Juros simples', fields: [principal, months, monthlyRate],
    assumptions: 'A taxa incide sempre no saldo inicial. O modelo não inclui aportes, taxas ou impostos.',
    model: input => {
      const points = record(input.months, month => input.principal * (1 + pct(input.rate) * month));
      return { points, summary: [money('Total de juros', last(points) - input.principal), money('Saldo final', last(points))] };
    } },
  { id: 'compostos', title: 'Juros compostos', fields: [principal, deposit, months, monthlyRate],
    assumptions: 'Os juros incidem no saldo acumulado. Os aportes entram no fim do mês. Projeção antes de custos e impostos.',
    model: input => {
      const points = savings(input.principal, input.deposit, input.months, pct(input.rate));
      const deposited = input.principal + input.deposit * input.months;
      return { points, summary: [money('Total aportado', deposited), money('Rendimento simulado', last(points) - deposited), money('Saldo final', last(points))] };
    } },
  { id: 'reserva', title: 'Reserva de emergência', fields: [essential, field('coverage', 'Meses de cobertura desejados', 3, 36, 1, 1), principal, deposit],
    assumptions: 'A meta multiplica os gastos pelos meses de cobertura. O prazo ignora rendimentos e assume aportes iguais.',
    model: input => {
      const target = input.essential * input.coverage;
      const gap = Math.max(0, target - input.principal);
      const length = gap === 0 ? 0 : input.deposit > 0 ? Math.ceil(gap / input.deposit) : null;
      return { points: savings(input.principal, input.deposit, Math.min(600, length ?? 12), 0),
        summary: [money('Meta estimada', target), money('Quanto falta', gap), duration('Prazo estimado', length ?? 'Depende de um aporte acima de zero')] };
    } },
  { id: 'fixa', title: 'Renda fixa', fields: [principal, deposit, months, annualRate, tax, fee],
    assumptions: 'Taxa anual constante e aportes pós-rendimento. O imposto informado incide sobre o ganho positivo no resgate. Outros encargos não estão incluídos.',
    model: input => investment(input, pct(input.rate)) },
  { id: 'tesouro', title: 'Tesouro Direto', fields: [principal, deposit, months, annualRate, inflation, tax, fee],
    assumptions: 'Exemplo com taxa real mais inflação, antes de eventual oscilação de preço na venda antecipada. A taxa real e a inflação são entradas ilustrativas.',
    model: input => investment(input, (1 + pct(input.rate)) * (1 + pct(input.inflation)) - 1) },
  { id: 'cdb', title: 'CDB indexado ao CDI', fields: [principal, deposit, months, { ...annualRate, label: 'CDI anual ilustrativo (%)' }, field('cdi', '% do CDI contratado', 100, 300), tax, fee],
    assumptions: 'Aproximação com CDI constante, 252 dias úteis por ano, aplicação da fração do CDI diário e tributação hipotética no resgate.',
    model: input => investment(input, Math.expm1(252 * Math.log1p(Math.expm1(Math.log1p(pct(input.rate)) / 252) * pct(input.cdi)))) },
  { id: 'inflacao', title: 'Inflação e poder de compra', fields: [principal, months, inflation],
    assumptions: 'O saldo nominal fica parado. A linha indica o equivalente em reais de hoje a cada mês, com inflação constante.',
    model: input => {
      const points = record(input.months, month => input.principal / (1 + pct(input.inflation)) ** (month / 12));
      return { points, summary: [money('Poder de compra no fim', last(points)),
        money('Custo futuro da mesma cesta', input.principal * (1 + pct(input.inflation)) ** (input.months / 12))] };
    } },
  { id: 'aposentadoria', title: 'Aposentadoria', fields: [principal, deposit, months, annualRate, inflation, withdrawal],
    assumptions: 'Aportes nominais iguais e taxa anual constante. A retirada calculada é ilustrativa em reais de hoje, sem impostos, custos ou garantia de duração.',
    model: input => {
      const points = savings(input.principal, input.deposit, input.months, monthly(pct(input.rate)))
        .map(point => ({ ...point, value: point.value / (1 + pct(input.inflation)) ** (point.month / 12) }));
      return { points, summary: [money('Patrimônio em reais de hoje', last(points)),
        money('Retirada mensal ilustrativa', last(points) * pct(input.withdrawal) / 12)] };
    } },
  { id: 'imovel', title: 'Financiamento imobiliário', fields: [{ ...costFields.price, initial: 300000 }, { ...costFields.down, initial: 60000 }, { ...months, initial: 240 }, monthlyRate, costFields.extra],
    assumptions: 'Sistema SAC, taxa mensal fixa, amortização constante e custos à vista informados. Não inclui indexadores, seguros ou tarifas que não tenham sido informados.',
    model: input => finance(input, true) },
  { id: 'veiculo', title: 'Financiamento de veículo', fields: [{ ...costFields.price, initial: 70000 }, costFields.down, { ...months, initial: 48 }, { ...monthlyRate, initial: 1.2 }, costFields.extra],
    assumptions: 'Tabela Price, com prestações estimadas iguais. Taxa constante, sem encargos mensais e com os custos à vista informados.',
    model: input => finance(input, false) },
  { id: 'emprestimo', title: 'Empréstimo', fields: [field('price', 'Valor emprestado (R$)', 10000, 100_000_000, 0.01), { ...months, initial: 24 }, { ...monthlyRate, initial: 1.8 }, costFields.extra],
    assumptions: 'Tabela Price com taxa mensal fixa. As tarifas informadas são pagas à vista. Compare com o CET informado pela instituição.',
    model: input => finance({ ...input, down: 0 }, false) },
  { id: 'parcelas', title: 'Compras parceladas', fields: [field('cash', 'Preço à vista (R$)', 1000), field('installment', 'Prestação (R$)', 110), { ...months, initial: 10 }, costFields.extra],
    assumptions: 'Compara o preço à vista às parcelas e custos iniciais. A linha mostra o total acumulado no parcelamento e a referência à vista.',
    model: input => {
      const total = input.installment * input.months + input.extra;
      const points = record(input.months, month => input.extra + input.installment * month)
        .map(point => ({ ...point, comparison: input.cash }));
      return { points, summary: [money('Total parcelado', total), money('Total à vista', input.cash),
        money(total >= input.cash ? 'Custo adicional de parcelar' : 'Diferença a favor do parcelado', Math.abs(total - input.cash))] };
    } },
  { id: 'quitacao', title: 'Quitação de dívidas', fields: [{ ...principal, label: 'Saldo da dívida (R$)', initial: 5000 },
    field('payment', 'Pagamento mensal (R$)', 500), { ...monthlyRate, initial: 2 }, { ...months, initial: 36 }],
    assumptions: 'Aplique os juros mensais antes de cada pagamento. A dívida pode aumentar quando o pagamento é menor que os juros. Não inclui multa ou novos gastos.',
    model: input => {
      let balance = input.principal;
      let paid = 0;
      let closed = balance === 0 ? 0 : undefined;
      const points = record(input.months, month => {
        if (!month || !balance) return balance;
        balance *= 1 + pct(input.rate);
        const payment = Math.min(balance, input.payment);
        balance -= payment;
        paid += payment;
        if (balance < .005) { balance = 0; closed = month; }
        return balance;
      });
      return { points, summary: [money('Pago no período', paid), money('Saldo da dívida', balance),
        duration('Prazo para quitar', closed ?? 'Não quitada no período')] };
    } },
  { id: 'independencia', title: 'Independência financeira', fields: [essential, principal, deposit, months, { ...annualRate, label: 'Taxa real anual ilustrativa (%)', initial: 3 }, withdrawal],
    assumptions: 'Cenário em reais de hoje. A meta divide o gasto anual pela retirada hipotética. A fórmula não prevê longevidade, volatilidade ou custos.',
    model: input => {
      const target = input.essential * 12 / pct(input.withdrawal);
      const points = savings(input.principal, input.deposit, input.months, monthly(pct(input.rate)))
        .map(point => ({ ...point, comparison: target }));
      const reached = points.find(point => point.value >= target);
      return { points, summary: [money('Meta ilustrativa', target), money('Saldo no período', last(points)),
        duration('Meta alcançada em', reached?.month ?? 'Ainda não alcançada na projeção')] };
    } },
  { id: 'tempo', title: 'Máquina do tempo financeira', fields: [principal, deposit, months, monthlyRate, field('delay', 'Atraso dos aportes (meses)', 12, 600, 0, 1)],
    assumptions: 'Compara começar a depositar agora com começar mais tarde. O saldo inicial rende nos dois cenários, sem taxas ou impostos.',
    model: input => {
      const baseline = savings(input.principal, input.deposit, input.months, pct(input.rate));
      let delayed = input.principal;
      const points = baseline.map(point => {
        if (point.month) delayed = delayed * (1 + pct(input.rate)) + (point.month > input.delay ? input.deposit : 0);
        return { ...point, comparison: delayed };
      });
      return { points, summary: [money('Começando agora', last(points)), money('Adiando os aportes', delayed), money('Diferença', Math.max(0, last(points) - delayed))] };
    } },
];

export function simulate(simulator: Simulation, values: Inputs): SimulationResult {
  for (const field of simulator.fields) {
    const value = values[field.name];
    if (!Number.isFinite(value) || value < field.min || value > field.max || (field.step === 1 && !Number.isInteger(value))) {
      throw new Error(field.label + ' precisa estar entre ' + field.min.toLocaleString('pt-BR') + ' e ' + field.max.toLocaleString('pt-BR') + '.');
    }
  }
  return simulator.model(values);
}
