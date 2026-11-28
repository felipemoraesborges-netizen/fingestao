import { defineWorld, order, pick, simulation, truth } from './buildWorld.ts';

export const dividas = defineWorld({
  id: 'dividas-e-credito', title: 'Dívidas e crédito', description: 'Entenda o custo do crédito e organize a quitação.',
  icon: 'credit-card', color: '#9a3412', badge: 'Crédito com Critério',
}, [
  {
    id: 'div-juros', title: 'Compare juros e custo total', objective: 'Identificar os custos do crédito e o papel do CET.', practice: 'dashboard',
    reading: ['O que custa tomar crédito', 'O Custo Efetivo Total (CET) reúne juros e outros custos da operação. Para ofertas equivalentes, confira o CET e o total a pagar, além do valor da parcela.', 'Receber R$ 1.000 e devolver R$ 1.150 custa R$ 150 nesse exemplo simplificado.'],
    exercises: [
      pick('choice', 'O que CET significa?', 'O CET já considera juros e outros encargos da operação.', 2, 'Crédito estimado de terceiros', 'Custo Efetivo Total', 'Conta de economia total'),
      truth('Ofertas de prazo e valor equivalentes podem ter custos diferentes.', true, 'Tarifas, seguros contratados e outras condições podem alterar o custo.'),
      pick('cloze', 'Para comparar prazos diferentes, observe também o total a ___.', 'Mais parcelas podem reduzir o valor mensal e elevar o valor final.', 3, 'receber mensalmente', 'inventar', 'pagar'),
      pick('scenario', 'Uma proposta para R$ 1.000 custa R$ 1.160 no total. Outra com mesmo prazo custa R$ 1.120. Qual é a diferença?', 'R$ 1.160 menos R$ 1.120 são R$ 40.', 1, 'R$ 40', ['R$ 120', 'É o custo da segunda proposta.'], ['R$ 160', 'É o custo da primeira.']),
    ],
    exam: pick('choice', 'Por que olhar o CET antes de contratar?', 'Ele ajuda a comparar o custo integral de propostas semelhantes.', 2, 'Para prever o score', 'Para conferir o custo considerando encargos', 'Para apagar dívidas anteriores'),
  },
  {
    id: 'div-cartao', title: 'Entenda a fatura e o rotativo', objective: 'Distinguir o limite do cartão da renda e entender o saldo financiado.', practice: 'transactions',
    reading: ['Fatura, vencimento e saldo', 'Quando parte da fatura fica sem pagamento, pode haver financiamento com juros e encargos. Consulte a fatura e as condições antes de escolher.', 'Numa fatura de R$ 600, pagar R$ 400 deixa R$ 200 em aberto, antes de encargos e outras regras.'],
    exercises: [
      truth('Limite do cartão é dinheiro recebido como renda.', false, 'O limite é acesso a crédito que pode gerar uma obrigação.'),
      pick('choice', 'Onde verificar a data de pagamento?', 'A fatura indica a data de vencimento.', 1, 'No vencimento da fatura', 'Na cor do cartão', 'Na data de abertura da conta'),
      pick('cloze', 'Financiar parte da fatura pode gerar ___ e encargos.', 'Verifique o CET e as alternativas disponíveis antes de decidir.', 2, 'salário', 'juros', 'novos rendimentos'),
      pick('scenario', 'Você percebe que não consegue pagar a fatura inteira. Qual passo ajuda?', 'Verifique o saldo e compare as condições das alternativas com a instituição.', 3, ['Ignorar a data', 'O atraso pode gerar encargos.'], ['Usar outro cartão sem comparar custos', 'A dívida pode ficar mais cara.'], 'Conferir opções e custo total nos canais oficiais'),
    ],
    exam: pick('choice', 'Uma fatura de R$ 950 teve pagamento de R$ 650. Qual valor ficou em aberto antes de encargos?', 'R$ 950 menos R$ 650 são R$ 300.', 1, 'R$ 300', 'R$ 650', 'R$ 1.600'),
  },
  {
    id: 'div-limites', title: 'Cheque especial e financiamento', objective: 'Separar crédito emergencial de um compromisso com parcelas.', practice: 'dashboard',
    reading: ['Um limite visível pode ser dívida', 'Cheque especial é uma linha de crédito vinculada à conta. Um financiamento tem condições contratuais e parcelas planejadas. Ambos têm custos.', 'Saldo próprio de R$ 120 e limite de R$ 500 não fazem R$ 620 de renda disponível.'],
    exercises: [
      pick('choice', 'O que ocorre quando você usa dinheiro do cheque especial?', 'O banco está concedendo crédito. Consulte juros, prazo e demais encargos.', 3, 'Recebe salário extra', 'Aumenta a reserva', 'Assume uma dívida junto ao banco'),
      truth('Uma parcela pequena pode se repetir por muitos meses.', true, 'Leia o contrato e considere todo o prazo e o total a pagar.'),
      pick('cloze', 'Antes de assinar um financiamento, confira as condições no ___.', 'O contrato informa valores, prazos, encargos e obrigações.', 1, 'contrato', 'anúncio de outro produto', 'saldo da conta de um amigo'),
      pick('scenario', 'Você tem R$ 150 na conta e usa R$ 220. Quanto entrou do limite se estiver habilitado?', 'A diferença é R$ 70, antes de encargos.', 2, ['R$ 150', 'Esse era seu saldo próprio.'], 'R$ 70', ['R$ 370', 'O limite cobre a diferença, não a soma.']),
    ],
    exam: pick('choice', 'Oito parcelas de R$ 180 somam quanto, sem entrada ou outros custos?', '8 × R$ 180 = R$ 1.440.', 3, 'R$ 900', 'R$ 1.080', 'R$ 1.440'),
  },
  {
    id: 'div-score', title: 'Leia o score com cuidado', objective: 'Entender o que uma pontuação de crédito pode indicar.', practice: 'dashboard',
    reading: ['Uma estimativa entre vários critérios', 'Pontuações de crédito usam informações e modelos próprios. Cada instituição aplica seus critérios de análise. Consulte os dados por canais oficiais e conteste informações incorretas.', 'Ter score alto pode ajudar na análise, mas a aprovação depende da política e dos demais dados.'],
    exercises: [
      truth('Score alto garante aprovação em qualquer instituição.', false, 'A decisão depende dos critérios da instituição e do produto.'),
      pick('choice', 'O que fazer ao encontrar um dado errado no seu histórico?', 'Use canais oficiais para pedir correção e guarde o protocolo.', 2, 'Pagar para uma pessoa desconhecida', 'Solicitar correção pelos canais oficiais', 'Divulgar senhas nas redes'),
      pick('cloze', 'O score é uma ___ usada na análise de crédito.', 'A pontuação pode mudar com o tempo e depende do modelo usado.', 3, 'renda líquida', 'garantia contratual', 'estimativa'),
      pick('scenario', 'Um perfil promete elevar seu score em troca de pagamento e senha. O que fazer?', 'Proteja seus dados e consulte o canal oficial por conta própria.', 1, 'Ignorar a oferta e conferir seu histórico nos canais oficiais', ['Enviar a senha', 'Você pode perder acesso à conta.'], ['Pagar sem verificar', 'A promessa pode ser uma fraude.']),
    ],
    exam: pick('choice', 'O que a instituição pode avaliar além do score?', 'Ter condições de pagar é relevante na análise, junto de outros critérios.', 2, 'A cor favorita', 'Renda e capacidade de pagamento', 'O modelo do celular apenas'),
  },
  {
    id: 'div-pagamento', title: 'Negocie e escolha uma estratégia', objective: 'Distinguir bola de neve e avalanche de juros.', practice: 'categories',
    reading: ['Um plano que cabe no orçamento', 'Liste dívidas e condições, proteja despesas essenciais e compare acordos. Na bola de neve, o extra vai para o menor saldo. Na avalanche, vai para o maior custo de juros, mantendo os outros pagamentos combinados.', 'Com uma dívida pequena a 2% ao mês e outra maior a 5%, as duas estratégias podem indicar alvos diferentes. As taxas são apenas um exemplo.'],
    exercises: [
      pick('choice', 'Qual critério orienta a bola de neve?', 'Quitar o menor saldo primeiro pode trazer motivação e liberar parcelas.', 2, 'Maior saldo', 'Menor saldo', 'Ordem alfabética do banco'),
      truth('A avalanche direciona o extra para a dívida mais cara em juros.', true, 'Dar prioridade ao maior custo pode reduzir os juros totais, dadas as mesmas condições.'),
      order('Organize uma negociação.', ['Registrar o acordo', 'Listar dívidas e despesas essenciais', 'Comparar canal, proposta e parcelas'], [2, 3, 1], 'Conheça o orçamento, avalie a proposta e guarde a confirmação do acordo.'),
      pick('scenario', 'Uma parcela de acordo comprometeria alimentação e moradia. O que fazer?', 'Procure uma proposta executável ou ajuda de um canal oficial de defesa do consumidor.', 3, ['Assinar sem conferir', 'Um acordo difícil de cumprir gera novos problemas.'], ['Cortar o essencial automaticamente', 'Proteja despesas prioritárias.'], 'Negociar uma parcela que caiba no orçamento'),
    ],
    exam: pick('choice', 'Dívidas de R$ 300 a 2% e R$ 900 a 6% mensais. Qual alvo recebe o extra na avalanche, mantendo os demais pagamentos?', 'Nesse cenário ilustrativo, 6% é o maior custo mensal de juros.', 3, 'R$ 300', 'As duas sempre igualmente', 'R$ 900'),
  },
]);

export const poupanca = defineWorld({
  id: 'poupanca-e-metas', title: 'Poupança e metas', description: 'Defina objetivos e acompanhe os aportes rumo a eles.',
  icon: 'piggy-bank', color: '#9d174d', badge: 'Metas com Plano',
}, [
  {
    id: 'pou-objetivo', title: 'Transforme um desejo em objetivo', objective: 'Dar nome, valor e prazo ao que você quer alcançar.', practice: 'purchases',
    reading: ['Uma meta que dá para acompanhar', 'Descreva o objetivo, estime o custo total e escolha uma data. Confira custos adicionais e mudanças de preço.', 'Comprar uma bicicleta por R$ 900 em nove meses é um objetivo mais concreto que guardar algum dinheiro.'],
    exercises: [
      pick('choice', 'Qual opção é uma meta mensurável?', 'Um valor e um prazo permitem acompanhar quanto falta.', 3, 'Poupar quando der', 'Comprar alguma coisa', 'Juntar R$ 900 em nove meses'),
      truth('O custo de entrega pode entrar no valor-alvo de uma compra.', true, 'Custos previstos fazem parte do valor que precisará estar disponível.'),
      pick('cloze', 'Uma meta de compra precisa de valor e ___.', 'O prazo ajuda a ligar o objetivo ao orçamento mensal.', 1, 'prazo', 'limite de cartão de outra pessoa', 'apenas uma foto'),
      pick('scenario', 'O produto custa R$ 880 e o frete custa R$ 50. Quanto incluir na meta?', 'A soma dos custos previstos é R$ 930.', 2, ['R$ 880', 'O valor deixa o frete de fora.'], 'R$ 930', ['R$ 830', 'O frete aumenta o custo.']),
    ],
    exam: pick('choice', 'Qual informação ajuda a acompanhar uma meta ao longo do tempo?', 'Com saldo atual e valor-alvo, você consegue calcular o que falta.', 1, 'Valor guardado e valor-alvo', 'O limite mais alto de um cartão', 'A última propaganda vista'),
  },
  {
    id: 'pou-aporte', title: 'Descubra o aporte mensal', objective: 'Calcular quanto guardar considerando o saldo já acumulado.', practice: 'savings',
    reading: ['Divida apenas o que falta', 'Sem considerar rendimentos, subtraia o saldo do valor-alvo e divida pelos meses. Se o resultado não couber, ajuste valor ou prazo.', 'Meta de R$ 1.500 com R$ 300 já guardados e seis meses restantes pede R$ 200 por mês.'],
    exercises: [
      simulation('Sem saldo inicial e sem rendimento, ajuste o aporte para juntar R$ 600 em cinco meses.', 5, 0, 600, 120, 'R$ 120 × 5 = R$ 600.'),
      truth('O saldo já guardado reduz o valor que ainda precisa ser aportado.', true, 'Use a diferença entre a meta e o que já está separado.'),
      pick('cloze', 'Para calcular o aporte, divida o valor que ___ pelo número de meses.', 'O saldo inicial já faz parte da meta.', 2, 'você tinha dez anos atrás', 'falta', 'indica o limite do cartão'),
      pick('scenario', 'Faltam R$ 900 e cabem R$ 150 por mês. Qual prazo atende, sem juros?', 'R$ 900 ÷ R$ 150 = seis meses.', 3, ['Três meses', 'Três aportes somariam R$ 450.'], ['Nove meses como mínimo', 'Cinco meses são insuficientes, mas seis já bastam.'], 'Seis meses'),
    ],
    exam: pick('choice', 'Meta de R$ 1.000, saldo de R$ 250 e cinco meses. Qual aporte sem juros?', 'Faltam R$ 750. Dividindo por cinco, são R$ 150.', 2, 'R$ 100', 'R$ 150', 'R$ 200'),
  },
  {
    id: 'pou-compostos', title: 'Veja como os juros se acumulam', objective: 'Entender juros sobre saldo acumulado com taxa ilustrativa.', practice: 'savings',
    reading: ['Rendimento sobre um saldo que muda', 'Em juros compostos, o rendimento de um período entra na base do próximo. A taxa e os custos reais variam. Nos exemplos, os aportes entram ao fim do mês.', 'Com R$ 1.000 no início e taxa ilustrativa de 1% ao mês, dois meses sem aportes dão R$ 1.020,10 antes de custos.'],
    exercises: [
      pick('choice', 'Sobre qual saldo incidem os juros no segundo mês do exemplo?', 'O primeiro mês terminou com R$ 1.010.', 2, 'R$ 1.000', 'R$ 1.010', 'R$ 1.020,10 antes do mês começar'),
      truth('Uma taxa ilustrativa garante rendimento futuro.', false, 'O exemplo mostra uma fórmula. O resultado real depende do produto e dos custos.'),
      pick('cloze', 'Os juros compostos usam como base o saldo ___.', 'Os rendimentos anteriores podem permanecer no saldo e participar do cálculo seguinte.', 1, 'acumulado', 'do orçamento alheio', 'que nunca muda'),
      simulation('Com 1% ao mês ilustrativo, procure aportar o necessário para chegar a R$ 303,01 em três meses.', 3, 0.01, 303.01, 100, 'R$ 100 × (1,01² + 1,01 + 1) dá R$ 303,01, com depósitos no fim de cada mês.'),
    ],
    exam: pick('choice', 'Em um mês a 1% ilustrativo, quanto rendem R$ 500 antes de custos?', '1% de R$ 500 é R$ 5.', 3, 'R$ 0,50', 'R$ 50', 'R$ 5'),
  },
  {
    id: 'pou-compromissos', title: 'Priorize metas concorrentes', objective: 'Ajustar aportes conforme urgência e consequências.', practice: 'purchases',
    reading: ['A mesma sobra tem vários destinos', 'Compare prazo e prioridade. Revise a divisão quando houver mudanças no orçamento.', 'Com R$ 200 livres, você pode separar R$ 150 para um objetivo com data próxima e R$ 50 para outro mais flexível.'],
    exercises: [
      truth('O total de aportes programados deve caber no dinheiro que você pode guardar.', true, 'Metas em conjunto precisam respeitar despesas e prioridades.'),
      pick('choice', 'Qual informação ajuda a priorizar duas metas?', 'Compare o impacto de adiar cada uma e o prazo de que precisa.', 3, 'O tamanho da imagem da meta', 'A ordem do cadastro', 'Prazo e consequência de adiar'),
      order('Como reorganizar aportes após perder parte da renda?', ['Redistribuir aportes', 'Conferir o orçamento atualizado', 'Rever prazos e prioridades'], [2, 3, 1], 'O novo valor disponível orienta prioridades e aportes.'),
      pick('scenario', 'Você tem R$ 180 livres, mas os aportes somam R$ 230. Qual ajuste?', 'Reduza R$ 50 do total e reavalie os prazos.', 2, ['Pagar a diferença com renda que não entrou', 'A renda é incerta.'], 'Redistribuir os aportes dentro de R$ 180', ['Aumentar os dois aportes', 'Isso aumenta o descompasso.']),
    ],
    exam: pick('choice', 'Se R$ 140 de R$ 200 disponíveis foram destinados a uma meta, quanto resta?', 'R$ 200 menos R$ 140 são R$ 60.', 1, 'R$ 60', 'R$ 140', 'R$ 340'),
  },
  {
    id: 'pou-ritmo', title: 'Acompanhe e ajuste sua meta', objective: 'Calcular o percentual e revisar o plano com o saldo real.', practice: 'savings',
    reading: ['Meça a evolução pelo saldo', 'Compare o valor guardado ao alvo. Se o preço, a renda ou o prazo mudar, recalcule o aporte restante.', 'R$ 300 guardados para uma meta de R$ 1.200 representam 25%.'],
    exercises: [
      pick('choice', 'Qual porcentagem representam R$ 240 de uma meta de R$ 800?', 'R$ 240 ÷ R$ 800 = 0,30, ou 30%.', 3, '20%', '40%', '30%'),
      truth('Uma mudança no preço pode alterar quanto falta para completar a meta.', true, 'Atualize o valor-alvo para comparar com o saldo correto.'),
      pick('cloze', 'Quanto falta é o valor-alvo menos o saldo ___.', 'Considere o saldo separado para aquele objetivo.', 1, 'guardado', 'da renda bruta', 'de compras de outra pessoa'),
      pick('scenario', 'O preço de R$ 850 caiu para R$ 800 e você guardou R$ 600. Quanto falta?', 'Com o novo preço, R$ 800 menos R$ 600 são R$ 200.', 2, ['R$ 250', 'Esse era o valor anterior.'], 'R$ 200', ['R$ 50', 'Esse é só o desconto.']),
    ],
    exam: pick('choice', 'R$ 450 de um alvo de R$ 900 equivalem a quanto?', 'R$ 450 corresponde à metade de R$ 900.', 2, '25%', '50%', '75%'),
  },
]);
