import { worldSchema } from './schema.ts';
import type { ContentStep } from './schema.ts';

const notes = (id: string, prompt: string, body: string, example: string): ContentStep =>
  ({ id, kind: 'note', prompt, body, example });

const options = (items: string[], reasons?: (string | undefined)[]) =>
  items.map((text, index) => ({ id: 'op-' + (index + 1), text, feedback: reasons?.[index] }));

const question = (id: string, kind: 'choice' | 'cloze' | 'scenario', prompt: string,
  texts: string[], answer: number, explanation: string, tag: string, reasons?: (string | undefined)[]): ContentStep => ({
  id, kind, prompt, options: options(texts, reasons), correct: 'op-' + answer, explanation, tags: [tag],
});

const truth = (id: string, prompt: string, correct: boolean, explanation: string, tag: string): ContentStep =>
  ({ id, kind: 'boolean', prompt, correct, explanation, tags: [tag] });

export const firstWorld = worldSchema.parse({
  id: 'primeiros-passos',
  title: 'Primeiros passos',
  description: 'Aprenda a identificar o dinheiro que entra, o que sai e o que merece prioridade.',
  icon: 'compass',
  color: '#6d28d9',
  badge: 'Primeiros Passos em Finanças',
  lessons: [
    {
      id: 'pp-dinheiro', title: 'O que é dinheiro?', objective: 'Entender como o dinheiro facilita trocas e ajuda a planejar.', minutes: 3, practice: 'dashboard',
      steps: [
        notes('pp-dinheiro-01', 'Uma unidade para comparar', 'O dinheiro facilita trocas e dá uma medida comum para comparar preços. Também pode ser guardado para usar depois.', 'Se o pão custa R$ 8 e o leite custa R$ 6, os dois juntos custam R$ 14.'),
        question('pp-dinheiro-02', 'choice', 'O que o preço em reais ajuda a fazer?', ['Comparar o valor de compras', 'Garantir que o preço nunca mude', 'Eliminar a necessidade de escolher'], 1, 'Os preços em reais expressam valores na mesma unidade. Os preços podem mudar, e o dinheiro disponível ainda limita as escolhas.', 'dinheiro'),
        truth('pp-dinheiro-03', 'Pagar com Pix continua sendo usar dinheiro.', true, 'Pix é uma forma de transferir reais. Trocar a forma de pagamento não muda a natureza do gasto.', 'pagamentos'),
        question('pp-dinheiro-04', 'cloze', 'Um preço em reais serve como medida de ___.', ['horário', 'valor', 'peso'], 2, 'Reais expressam valor. Horário e peso são medidos em outras unidades.', 'dinheiro'),
        question('pp-dinheiro-05', 'scenario', 'Bruna tem R$ 20. O pão custa R$ 8 e o leite, R$ 6. Quanto sobra se ela comprar os dois?', ['R$ 6', 'R$ 14', 'R$ 12'], 1, 'A compra custa R$ 14. Dos R$ 20 disponíveis, sobram R$ 6.', 'saldo',
          [undefined, 'R$ 14 é o total gasto.', 'R$ 12 seria o saldo se Bruna comprasse apenas o pão.']),
      ],
    },
    {
      id: 'pp-renda', title: 'Reconheça a sua renda', objective: 'Distinguir dinheiro recebido, renda variável e valores emprestados.', minutes: 3, practice: 'transactions',
      steps: [
        notes('pp-renda-01', 'O que realmente entrou?', 'Renda é o dinheiro que você ganha, como salário ou um serviço pago. Para organizar o mês, comece pelos valores líquidos que você recebeu.', 'Ana recebeu R$ 1.600 de salário líquido e R$ 200 por uma encomenda. Sua renda recebida foi de R$ 1.800.'),
        question('pp-renda-02', 'choice', 'Qual destes valores é renda recebida?', ['Um limite de cartão de R$ 500', 'R$ 120 recebidos por um serviço', 'R$ 400 de empréstimo'], 2, 'O serviço pago é renda. Limite é crédito disponível e empréstimo gera uma obrigação de devolver o dinheiro.', 'renda'),
        truth('pp-renda-03', 'Um trabalho que ainda não foi pago pode ser contado como dinheiro disponível hoje.', false, 'Uma previsão pode entrar no planejamento, mas o saldo disponível só aumenta quando o dinheiro chega.', 'renda'),
        {
          id: 'pp-renda-04', kind: 'pairs', prompt: 'Associe cada entrada ao seu significado.',
          left: options(['Salário líquido', 'Serviço eventual', 'Empréstimo']),
          right: [{ id: 'b', text: 'Dinheiro a devolver' }, { id: 'a', text: 'Renda já descontada na folha' }, { id: 'c', text: 'Renda que pode variar' }],
          correct: { 'op-1': 'a', 'op-2': 'c', 'op-3': 'b' }, explanation: 'Salário líquido é o recebido após descontos. Serviços eventuais podem variar, e empréstimos precisam ser devolvidos.', tags: ['renda'],
        },
        question('pp-renda-05', 'scenario', 'Pedro não sabe se fará um bico neste mês. Em que valor ele deve basear as contas com vencimento próximo?', ['No maior valor possível do bico', 'No valor do limite do cartão', 'Na renda já recebida ou confirmada'], 3, 'O dinheiro incerto pode aparecer como previsão separada. As contas próximas precisam caber nos recursos mais confiáveis.', 'planejamento',
          ['O maior valor pode acabar ficando só na previsão.', 'O limite do cartão é crédito que terá de ser pago.']),
      ],
    },
    {
      id: 'pp-gastos', title: 'Identifique seus gastos', objective: 'Registrar saídas e reconhecer como o saldo muda.', minutes: 3, practice: 'transactions',
      steps: [
        notes('pp-gastos-01', 'Saídas pequenas também somam', 'Gasto é um valor usado para pagar algo. Registrar valor, motivo e data ajuda a entender para onde o dinheiro foi.', 'Três passagens de R$ 5 somam R$ 15, mesmo que cada uma pareça pequena.'),
        truth('pp-gastos-02', 'Um lanche de R$ 8 pago em dinheiro vale menos no orçamento que o mesmo lanche pago no débito.', false, 'O gasto é de R$ 8 nos dois casos. A forma de pagamento ajuda a localizar o registro, mas não elimina o gasto.', 'gastos'),
        question('pp-gastos-03', 'cloze', 'No controle do mês, saldo é receitas menos ___.', ['dias', 'despesas', 'motivos'], 2, 'Subtrair as despesas das receitas mostra o que sobrou ou faltou no período.', 'saldo'),
        question('pp-gastos-04', 'scenario', 'Você pagou R$ 35 no mercado e R$ 12 de transporte. Qual registro ajuda mais?', ['Uma saída de R$ 12 e nada mais', 'Dois gastos com o valor e o motivo de cada um', 'Uma entrada de R$ 47'], 2, 'Os dois registros mostram as saídas de R$ 35 e R$ 12 e permitem identificar a categoria de cada gasto.', 'registro',
          ['O gasto do mercado também precisa entrar no controle.', undefined, 'Os R$ 47 correspondem à soma de duas despesas.']),
        question('pp-gastos-05', 'choice', 'Com R$ 100 disponíveis, depois de um gasto de R$ 35, quanto resta?', ['R$ 135', 'R$ 35', 'R$ 65'], 3, 'Ao subtrair R$ 35 de R$ 100, ficam R$ 65 disponíveis.', 'saldo'),
      ],
    },
    {
      id: 'pp-prioridades', title: 'Necessidade ou desejo?', objective: 'Priorizar gastos pelo contexto e pelas consequências.', minutes: 4, practice: 'categories',
      steps: [
        notes('pp-prioridades-01', 'A prioridade depende da situação', 'Necessidades atendem o que é essencial naquele contexto. Desejos podem trazer satisfação e caber no plano, mas em muitos casos podem esperar.', 'Um celular funcional pode ser necessário para trabalhar. Trocar um aparelho que funciona apenas pela cor costuma poder esperar.'),
        question('pp-prioridades-02', 'choice', 'Qual pergunta ajuda a decidir a prioridade?', ['O que acontece se eu adiar este gasto?', 'Qual anúncio aparece mais?', 'Dá para parcelar de qualquer jeito?'], 1, 'Avaliar as consequências de adiar ajuda a separar o que é urgente do que pode ser planejado.', 'prioridades'),
        truth('pp-prioridades-03', 'A mesma compra pode ser essencial para uma pessoa e opcional para outra.', true, 'O contexto muda a decisão. Transporte, lazer e tecnologia podem ter papéis diferentes em cada rotina.', 'prioridades'),
        question('pp-prioridades-04', 'scenario', 'Léo tem R$ 40, precisa de R$ 30 para transporte até o trabalho e quer um acessório de R$ 35. Qual sequência faz sentido?', ['Comprar o acessório e ignorar o transporte', 'Reservar o transporte e reavaliar o acessório com os R$ 10 restantes', 'Contar com R$ 75 sem ter esse valor'], 2, 'O transporte evita um problema imediato. Ao reservar R$ 30, sobram R$ 10 para decidir com base no dinheiro disponível.', 'prioridades',
          ['A compra deixaria apenas R$ 5 para o deslocamento.', undefined, 'O dinheiro disponível agora é de R$ 40.']),
        question('pp-prioridades-05', 'cloze', 'Antes de comprar por impulso, vale comparar o desejo com o dinheiro ___ no orçamento.', ['disponível', 'emprestado obrigatoriamente', 'que talvez chegue'], 1, 'O valor disponível mostra o que cabe agora. Um desejo também pode virar uma meta para outro momento.', 'planejamento'),
      ],
    },
    {
      id: 'pp-fluxo', title: 'Monte o mapa do mês', objective: 'Montar uma ordem simples para registrar e revisar o saldo.', minutes: 4, practice: 'dashboard',
      steps: [
        notes('pp-fluxo-01', 'Entradas, saídas e revisão', 'Liste o dinheiro que entrou, some as despesas e compare os totais. Depois, confira se existe algum gasto esquecido ou valor contado duas vezes.', 'Com R$ 2.000 de entradas e R$ 1.750 de despesas, sobram R$ 250 antes de decidir o destino da sobra.'),
        {
          id: 'pp-fluxo-02', kind: 'order', prompt: 'Coloque os passos em uma ordem que produza um saldo útil.',
          options: options(['Calcular o saldo', 'Conferir se faltou algum registro', 'Listar as entradas e saídas', 'Somar receitas e despesas separadamente']),
          correct: ['op-3', 'op-4', 'op-1', 'op-2'], explanation: 'Primeiro reúna os dados, some cada grupo, calcule a diferença e confira os registros.', tags: ['controle'],
        },
        truth('pp-fluxo-03', 'Se as despesas superam as receitas, o saldo do período fica negativo.', true, 'A fórmula é receitas menos despesas. Quando o segundo valor é maior, faltou dinheiro no período.', 'saldo'),
        question('pp-fluxo-04', 'scenario', 'Em um mês, chegaram R$ 1.900 e saíram R$ 2.000. Qual é o resultado?', ['Faltaram R$ 100', 'Sobraram R$ 100', 'Sobraram R$ 3.900'], 1, 'R$ 1.900 menos R$ 2.000 dá um déficit de R$ 100.', 'saldo',
          [undefined, 'Nesse mês, as saídas foram maiores que as entradas.', 'R$ 3.900 é a soma dos valores.']),
        question('pp-fluxo-05', 'choice', 'Como evitar contar duas vezes uma compra no cartão se ela já foi anotada como gasto?', ['Anotar a mesma compra outra vez ao pagar a fatura', 'Conferir a fatura e tratar o pagamento conforme o método escolhido para o controle', 'Apagar todos os gastos do cartão'], 2, 'Use um critério consistente. Se as compras já foram registradas, a quitação da fatura precisa ser identificada para não virar um segundo gasto pela mesma compra.', 'registro'),
      ],
    },
    {
      id: 'pp-primeira-meta', title: 'Dê um destino à sobra', objective: 'Testar um aporte mensal e levar uma meta simples para o aplicativo.', minutes: 4, practice: 'purchases',
      steps: [
        notes('pp-meta-01', 'Guardar com um objetivo', 'Uma meta precisa de valor, prazo e um aporte que caiba no orçamento. Se o aporte ficar alto demais, é possível ajustar o prazo ou rever o objetivo.', 'Para guardar R$ 300 em três meses, sem considerar rendimentos, o aporte mensal é de R$ 100.'),
        {
          id: 'pp-meta-02', kind: 'simulation', prompt: 'Ajuste o aporte mensal para chegar a R$ 300 em três meses.',
          min: 0, max: 200, increment: 10, months: 3, monthlyRate: 0, target: 300, correct: 100,
          explanation: 'Com três aportes de R$ 100 e sem rendimentos, o total é R$ 300. O gráfico mostra a evolução mês a mês.', tags: ['metas', 'aportes'],
        },
        question('pp-meta-03', 'scenario', 'Se só cabem R$ 75 por mês e a meta é de R$ 300 sem rendimento, qual prazo funciona?', ['Quatro meses', 'Dois meses', 'Um mês'], 1, 'Quatro parcelas de R$ 75 somam R$ 300. Alongar o prazo mantém o aporte dentro do orçamento.', 'metas',
          [undefined, 'Em dois meses, o saldo seria de R$ 150.', 'Em um mês, o saldo seria de R$ 75.']),
        truth('pp-meta-04', 'Se o aporte planejado não cabe nas contas do mês, o prazo da meta pode ser revisto.', true, 'A meta deve caber na realidade. Aumentar o prazo pode dar espaço para manter as despesas prioritárias.', 'metas'),
        question('pp-meta-05', 'cloze', 'Para começar uma meta, anote o que quer atingir, o valor e o ___.', ['vencimento de qualquer cartão', 'prazo', 'maior limite disponível'], 2, 'Com valor e prazo, você estima o aporte necessário e pode ajustar o plano.', 'metas'),
      ],
    },
  ],
  exam: {
    id: 'pp-prova', title: 'Prova do mundo', objective: 'Juntar renda, gastos, prioridades e metas em decisões simples.', minutes: 4, practice: 'dashboard',
    steps: [
      question('pp-prova-01', 'choice', 'Qual é um exemplo de renda que já entrou?', ['R$ 150 recebidos por um serviço', 'R$ 150 de limite do cartão', 'R$ 150 previstos para o mês que vem'], 1, 'O recebimento por um serviço é renda disponível agora. Crédito e previsão não são dinheiro já recebido.', 'renda'),
      question('pp-prova-02', 'scenario', 'Julia tem R$ 90 e gasta R$ 28 com transporte e R$ 17 com alimentação. Quanto sobra?', ['R$ 62', 'R$ 45', 'R$ 73'], 2, 'As saídas somam R$ 45. A diferença entre R$ 90 e R$ 45 é R$ 45.', 'saldo',
        ['R$ 62 seria a sobra se houvesse apenas o gasto com transporte.', undefined, 'R$ 73 seria a sobra se houvesse apenas o gasto com alimentação.']),
      truth('pp-prova-03', 'O contexto ajuda a decidir quais gastos precisam ser priorizados.', true, 'Prazos e consequências mudam a prioridade, mesmo quando os itens custam o mesmo.', 'prioridades'),
      question('pp-prova-04', 'choice', 'O que fazer antes de usar a sobra do mês para uma meta?', ['Confirmar as despesas e conferir o saldo', 'Somar o limite de crédito à renda disponível', 'Supor que todas as previsões são certos recebimentos'], 1, 'Um saldo conferido ajuda a escolher um aporte que caiba nas contas do mês.', 'controle'),
      question('pp-prova-05', 'scenario', 'Uma meta de R$ 240 será dividida em quatro aportes iguais, sem rendimento. Qual é o valor mensal?', ['R$ 24', 'R$ 80', 'R$ 60'], 3, 'R$ 240 divididos por quatro resultam em R$ 60 por mês.', 'metas',
        ['Quatro aportes de R$ 24 somariam R$ 96.', 'R$ 80 bastariam para um plano de três aportes.']),
    ],
  },
});
