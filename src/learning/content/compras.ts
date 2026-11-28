import { defineWorld, order, pick, simulation, truth } from './buildWorld.ts';

export const compras = defineWorld({
  id: 'grandes-compras', title: 'Consumo consciente e grandes compras', description: 'Compare custos, negocie e planeje decisões maiores.',
  icon: 'shopping-bag', color: '#854d0e', badge: 'Compras Bem Planejadas',
}, [
  {
    id: 'comp-planejamento', title: 'Planejando grandes compras', objective: 'Incluir custos extras no valor-alvo e ajustar o prazo.', practice: 'purchases',
    reading: ['Olhe além da etiqueta', 'Monte o custo completo antes de escolher o aporte. Inclua despesas previsíveis da compra, sem comprometer contas essenciais.', 'Um produto de R$ 950 com frete de R$ 130 pede uma meta de R$ 1.080.'],
    exercises: [
      simulation('Sem juros, quanto aportar em seis meses para chegar a R$ 1.080?', 6, 0, 1080, 180, 'R$ 180 × 6 = R$ 1.080.'),
      truth('Um prazo maior pode reduzir o aporte mensal necessário, se o alvo ficar igual.', true, 'Mais meses permitem distribuir o valor em parcelas menores.'),
      pick('cloze', 'O preço e o frete entram no custo ___.', 'A meta deve refletir todas as despesas previstas da compra.', 3, 'do crédito de um amigo', 'inexistente', 'total'),
      pick('scenario', 'Você precisa de R$ 1.000 e tem R$ 250 guardados. Qual valor falta?', 'A meta menos o saldo guardado é R$ 750.', 2, ['R$ 250', 'Esse valor já foi guardado.'], 'R$ 750', ['R$ 1.250', 'O saldo reduz o valor que falta.']),
    ],
    exam: pick('choice', 'Produto de R$ 1.150 mais frete de R$ 90. Qual é o alvo?', 'A soma é R$ 1.240.', 2, 'R$ 1.150', 'R$ 1.240', 'R$ 1.060'),
  },
  {
    id: 'comp-negociacao', title: 'Compare propostas e negocie', objective: 'Comparar preço final, prazo e condições por escrito.', practice: 'purchases',
    reading: ['Compare ofertas equivalentes', 'Peça o preço final e as condições de pagamento, entrega e garantia. Compare antes de confirmar e guarde a proposta.', 'R$ 900 à vista e dez parcelas de R$ 99 totalizam R$ 900 e R$ 990, respectivamente.'],
    exercises: [
      pick('choice', 'Quanto somam doze parcelas de R$ 80 sem entrada?', '12 × R$ 80 = R$ 960.', 3, 'R$ 800', 'R$ 860', 'R$ 960'),
      truth('A alternativa com menor parcela mensal sempre tem o menor custo total.', false, 'O número de parcelas e outras cobranças também importam.'),
      order('Organize uma comparação.', ['Decidir', 'Pedir preço total e condições', 'Comparar propostas equivalentes'], [2, 3, 1], 'Compare a mesma compra com prazos e condições claras antes de decidir.'),
      pick('scenario', 'A oferta A custa R$ 990 com entrega e B custa R$ 940 mais R$ 80 de frete. Qual total é menor?', 'A oferta B custa R$ 1.020. A oferta A custa R$ 990.', 1, 'A oferta A', ['A oferta B', 'Some o frete para comparar.'], ['São iguais', 'Existe diferença de R$ 30.']),
    ],
    exam: pick('choice', 'O que pedir antes de aceitar uma oferta?', 'Peça uma proposta que permita revisar as condições acordadas.', 2, 'A senha da loja', 'Preço final, prazo e condições por escrito', 'Somente o valor da primeira parcela'),
  },
  {
    id: 'comp-casa', title: 'Planeje o custo de uma casa', objective: 'Estimar entrada, custos iniciais e despesas recorrentes.', practice: 'purchases',
    reading: ['A mudança também tem custo', 'Além da entrada ou caução, considere documentação aplicável, mudança, manutenção e despesas mensais. Leia contratos e consulte as regras locais.', 'Uma mudança de R$ 1.200 e reparos iniciais de R$ 800 já formam R$ 2.000 de gastos adicionais.'],
    exercises: [
      truth('Manutenção pode gerar despesa depois da compra.', true, 'O imóvel exige conservação mesmo após a mudança.'),
      pick('choice', 'Qual gasto pode continuar depois de instalar a mudança?', 'O condomínio pode fazer parte das despesas recorrentes.', 2, 'A taxa única de mudança', 'Condomínio mensal', 'A compra única de caixas'),
      pick('cloze', 'Um financiamento pode comprometer parte da renda por vários ___.', 'Considere todo o prazo do contrato, além da parcela inicial.', 1, 'anos', 'minutos apenas', 'cliques'),
      pick('scenario', 'A parcela cabe, mas as despesas adicionais fariam o orçamento estourar. O que avaliar?', 'A decisão deve incluir os custos recorrentes e a renda disponível.', 3, ['Ignorar o condomínio', 'Ele pode ser uma despesa recorrente.'], ['Calcular só a entrada', 'O orçamento mensal continua relevante.'], 'Reestimar o custo mensal completo'),
    ],
    exam: pick('choice', 'Parcela de R$ 1.000, condomínio de R$ 300 e previsão de R$ 150 para manutenção. Qual é a soma mensal?', 'R$ 1.000 + R$ 300 + R$ 150 = R$ 1.450.', 1, 'R$ 1.450', 'R$ 1.300', 'R$ 1.150'),
  },
  {
    id: 'comp-carro', title: 'Calcule o custo de manter um carro', objective: 'Comparar preço de compra e custos de uso.', practice: 'purchases',
    reading: ['Manter custa além da parcela', 'Planeje combustível, manutenção, seguro, estacionamento e tributos aplicáveis. Compare com outras opções de transporte considerando sua rotina.', 'R$ 280 de combustível e R$ 140 separados para manutenção somam R$ 420 no mês.'],
    exercises: [
      pick('choice', 'Qual é um gasto típico de uso?', 'Combustível varia com a quilometragem e o preço.', 3, 'A cor selecionada', 'A data em que viu o anúncio', 'Combustível'),
      truth('Comprar à vista elimina a parcela do financiamento, mas ainda há gastos de uso.', true, 'Manutenção, combustível e outros custos continuam existindo.'),
      pick('cloze', 'A perda de valor de revenda ao longo do tempo é a ___.', 'Depreciação ajuda a pensar no custo total do bem.', 2, 'renda líquida', 'depreciação', 'entrada parcelada'),
      pick('scenario', 'Um carro custa menos para comprar, mas consome mais combustível. O que comparar?', 'Some compra, despesas recorrentes e custos esperados ao longo do período de uso.', 1, 'O custo total no período', ['Somente o preço da etiqueta', 'Ele deixa o custo de uso de fora.'], ['O primeiro abastecimento apenas', 'Um gasto isolado não representa todo o período.']),
    ],
    exam: pick('choice', 'Quanto dá R$ 350 de combustível mais R$ 150 para manutenção?', 'A soma é R$ 500.', 3, 'R$ 350', 'R$ 200', 'R$ 500'),
  },
  {
    id: 'comp-viagem', title: 'Planeje uma viagem sem improviso', objective: 'Incluir custos da viagem e uma margem razoável.', practice: 'purchases',
    reading: ['Liste o trajeto completo', 'Some ida e volta, hospedagem, alimentação e deslocamentos. Deixe margem para variações plausíveis e confira políticas de alteração.', 'Passagens de R$ 400, hospedagem de R$ 600 e alimentação de R$ 300 somam R$ 1.300.'],
    exercises: [
      pick('choice', 'O que falta num plano que inclui apenas avião e hotel?', 'Alimentação e transporte local também consomem parte do orçamento.', 2, 'O limite de um cartão novo', 'Alimentação e transporte local', 'A conta de outra pessoa'),
      truth('As condições de cancelamento podem mudar o custo de alterar a viagem.', true, 'Confira taxas, prazos e valores recuperáveis antes de reservar.'),
      pick('cloze', 'Uma margem no orçamento cobre ___ de custo previstas como possíveis.', 'Considere que alguns preços podem variar até a viagem.', 1, 'variações', 'valores fictícios sem relação', 'receitas automáticas'),
      pick('scenario', 'Seu plano custa R$ 1.300 e a margem é de R$ 200. Qual o total a separar?', 'O plano mais a margem soma R$ 1.500.', 3, ['R$ 1.100', 'A margem aumenta o dinheiro separado.'], ['R$ 1.300', 'Esse total ainda deixa a margem de fora.'], 'R$ 1.500'),
    ],
    exam: pick('choice', 'Quatro dias com R$ 75 de alimentação por dia custam quanto?', '4 × R$ 75 = R$ 300.', 2, 'R$ 225', 'R$ 300', 'R$ 375'),
  },
]);
