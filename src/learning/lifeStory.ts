interface Budget {
  savings: number;
  debt: number;
  income: number;
  bills: number;
  months: number;
  trained: boolean;
}
interface Decision {
  id: string;
  title: string;
  description: string;
  months: number;
  apply: (budget: Budget) => Budget;
}
interface Scene { title: string; premise: string; options: Decision[] }
const initial: Budget = { savings: 500, debt: 0, income: 2_500, bills: 850, months: 0, trained: false };

function payment(budget: Budget, amount: number, finance = false) {
  if (finance) return { ...budget, debt: budget.debt + amount };
  return { ...budget, savings: Math.max(0, budget.savings - amount), debt: budget.debt + Math.max(0, amount - budget.savings) };
}

export const scenes: Scene[] = [
  { title: 'Um lugar para morar', premise: 'Você recebeu seu primeiro salário fictício. Escolha onde morar pelos próximos meses.',
    options: [
      { id: 'dividir', title: 'Dividir a moradia', description: 'R$ 620 por mês de moradia. Você divide o espaço.', months: 2, apply: value => ({ ...value, bills: value.bills + 620 }) },
      { id: 'sozinho', title: 'Morar por conta própria', description: 'R$ 1.150 por mês de moradia e R$ 300 de mudança.', months: 2, apply: value => payment({ ...value, bills: value.bills + 1_150 }, 300) },
    ] },
  { title: 'Ida e volta do trabalho', premise: 'O deslocamento agora faz parte do orçamento do personagem.',
    options: [
      { id: 'transporte', title: 'Usar transporte público', description: 'O custo mensal será de R$ 190.', months: 2, apply: value => ({ ...value, bills: value.bills + 190 }) },
      { id: 'carro', title: 'Assumir o custo de um carro usado', description: 'R$ 550 por mês para uso e manutenção e R$ 900 de custo inicial.', months: 2, apply: value => payment({ ...value, bills: value.bills + 550 }, 900) },
    ] },
  { title: 'Oportunidade de estudo', premise: 'Um curso de qualificação pode abrir espaço para uma promoção futura no cenário.',
    options: [
      { id: 'estudar', title: 'Fazer o curso', description: 'Custa R$ 480 agora. Na história, isso habilita uma promoção se surgir uma oportunidade.', months: 3, apply: value => payment({ ...value, trained: true }, 480) },
      { id: 'adiar-curso', title: 'Continuar no trabalho atual', description: 'Evita esse gasto agora e mantém a mesma renda por enquanto.', months: 3, apply: value => value },
    ] },
  { title: 'Uma compra maior', premise: 'Seu computador atual ainda funciona. Um novo custaria R$ 1.200 à vista ou R$ 1.360 em um plano de crédito fictício.',
    options: [
      { id: 'a-vista', title: 'Comprar à vista', description: 'Usa R$ 1.200 hoje. A parte que não couber no saldo aparece como dívida no simulador.', months: 1, apply: value => payment(value, 1200) },
      { id: 'credito', title: 'Usar o plano de crédito', description: 'Acrescenta R$ 1.360 ao saldo da dívida fictícia, incluindo o custo negociado.', months: 1, apply: value => payment(value, 1360, true) },
      { id: 'adiar-compra', title: 'Adiar a compra', description: 'Mantém o computador por enquanto e não compromete o saldo.', months: 1, apply: value => value },
    ] },
  { title: 'A renda mudou', premise: 'O trabalho sofrerá uma redução temporária de R$ 700 neste mês. Surge ainda uma despesa de R$ 650 de saúde.',
    options: [
      { id: 'usar-reserva', title: 'Usar o dinheiro guardado', description: 'O gasto usa a reserva disponível. A parcela não coberta entra na dívida virtual.', months: 1, apply: value => payment({ ...value, income: Math.max(0, value.income - 700) }, 650) },
      { id: 'parcelar-imprevisto', title: 'Financiar a despesa', description: 'Mantém o valor guardado este mês e adiciona R$ 710 de dívida, já com custo extra.', months: 1, apply: value => payment({ ...value, income: Math.max(0, value.income - 700) }, 710, true) },
    ] },
  { title: 'A próxima oportunidade', premise: 'A perda temporária de renda acabou. A decisão anterior de estudar pode alterar as opções de trabalho nesta etapa.',
    options: [
      { id: 'emprego', title: 'Manter o emprego', description: 'O salário volta ao normal. O curso concluído abre uma promoção de R$ 380 no cenário.', months: 4, apply: value => ({ ...value, income: value.income + 700 + (value.trained ? 380 : 0) }) },
      { id: 'negocio', title: 'Testar uma atividade extra', description: 'Usa R$ 450 para começar. Após custos, o cenário considera R$ 280 adicionais por mês.', months: 4, apply: value => payment({ ...value, income: value.income + 980 }, 450) },
    ] },
  { title: 'Um novo plano em família', premise: 'Você pode somar um objetivo familiar ao orçamento. Confira o efeito das despesas nos próximos meses.',
    options: [
      { id: 'meta-familia', title: 'Planejar despesas com a família', description: 'Assume R$ 250 mensais adicionais, com quatro meses de adaptação.', months: 4, apply: value => ({ ...value, bills: value.bills + 250 }) },
      { id: 'revisar-rotina', title: 'Ajustar os gastos antes', description: 'Ajusta R$ 100 dos gastos mensais variáveis da simulação.', months: 4, apply: value => ({ ...value, bills: Math.max(0, value.bills - 100) }) },
    ] },
  { title: 'Planeje a próxima década', premise: 'Você pode limpar parte da dívida do passado ou começar um plano de longo prazo com o saldo disponível.',
    options: [
      { id: 'quitar', title: 'Usar saldo para reduzir a dívida', description: 'Reduz o saldo devedor até onde o dinheiro guardado permite.', months: 12, apply: value => {
        const used = Math.min(value.savings, value.debt);
        return { ...value, savings: value.savings - used, debt: value.debt - used };
      } },
      { id: 'longo-prazo', title: 'Organizar um plano de longo prazo', description: 'Mantém a reserva do cenário. O orçamento segue sem promessas de rendimento.', months: 12, apply: value => value },
    ] },
];

function advance(budget: Budget, months: number): Budget {
  let { savings, debt } = budget;
  for (let count = 0; count < months; count++) {
    const surplus = budget.income - budget.bills;
    debt = Math.round(debt * 1.01 * 100) / 100;
    if (surplus >= 0) {
      const payment = Math.min(debt, Math.round(surplus * 0.4 * 100) / 100);
      debt -= payment;
      savings += surplus - payment;
    } else {
      const draw = Math.min(savings, Math.abs(surplus));
      savings -= draw;
      debt += Math.abs(surplus) - draw;
    }
  }
  return { ...budget, savings: Math.round(savings * 100) / 100, debt: Math.round(debt * 100) / 100, months: budget.months + months };
}

export function replayStory(choices: string[]) {
  let result = initial;
  for (const [index, id] of choices.entries()) {
    const choice = scenes[index]?.options.find(item => item.id === id);
    if (!choice) throw new Error('Uma escolha salva não corresponde a esta parte da história.');
    result = advance(choice.apply(result), choice.months);
  }
  const ending = result.debt > 0 ? 'Reorganização em andamento' : result.savings >= 3 * result.bills ? 'Rotina com reserva' : 'Um plano ganhando forma';
  return { result, scene: scenes[choices.length], ending };
}
