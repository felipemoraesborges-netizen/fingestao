import { defineWorld, order, pick, simulation, truth } from './buildWorld.ts';

export const orcamento = defineWorld({
  id: 'orcamento', title: 'Orçamento', description: 'Planeje o mês e escolha limites que caibam na sua realidade.',
  icon: 'calculator', color: '#1d4ed8', badge: 'Orçamento em Dia',
}, [
  {
    id: 'orc-mapa', title: 'Monte um orçamento simples', objective: 'Distribuir a renda antes de gastar.', practice: 'categories',
    reading: ['Dê uma função à renda', 'Liste as receitas líquidas e as despesas previstas. Use o saldo para revisar escolhas e planejar metas.', 'Com R$ 2.400 de renda e R$ 2.100 de despesas previstas, ficam R$ 300 para distribuir.'],
    exercises: [
      pick('choice', 'Qual valor de salário entra no orçamento de caixa?', 'Use o valor recebido após descontos.', 2, 'O maior salário visto num anúncio', 'O salário líquido', 'O limite total do cartão'),
      truth('Uma despesa anual pode fazer parte do planejamento mensal.', true, 'Dividir a estimativa pelos meses de preparação ajuda a reservar o valor.'),
      order('Em que ordem você montaria o plano?', ['Ajustar os limites', 'Estimar a renda', 'Listar os gastos'], [2, 3, 1], 'Conheça a entrada, estime as saídas e ajuste os tetos com esses números.'),
      pick('scenario', 'Você prevê R$ 2.200 de entradas e R$ 2.300 de saídas. O que fazer?', 'Localize despesas ajustáveis e confira prazos e custos antes de assumir crédito.', 3, ['Ignorar os R$ 100', 'O saldo já está abaixo de zero.'], ['Tratar o limite como salário', 'Crédito precisará ser pago.'], 'Revisar as despesas previstas'),
    ],
    exam: pick('choice', 'Qual é a sobra prevista com R$ 3.100 de renda e R$ 2.850 de despesas?', 'R$ 3.100 menos R$ 2.850 dá R$ 250.', 2, 'R$ 150', 'R$ 250', 'R$ 350'),
  },
  {
    id: 'orc-regra', title: 'Entenda a regra 50/30/20', objective: 'Usar percentuais como ponto de partida.', practice: 'categories',
    reading: ['Três grupos para organizar', 'Uma versão da regra separa 50% da renda líquida para necessidades, 30% para desejos e 20% para guardar ou acelerar a quitação de dívidas. Ajuste conforme sua situação.', 'Com R$ 3.000, o exemplo separa R$ 1.500, R$ 900 e R$ 600.'],
    exercises: [
      pick('cloze', 'No exemplo, a base das porcentagens é a renda ___.', 'A renda líquida corresponde ao que você pode distribuir.', 1, 'líquida', 'bruta de outra pessoa', 'prevista para o ano seguinte'),
      truth('É possível ajustar os percentuais se as contas essenciais passam de 50%.', true, 'A regra é uma referência. Os limites precisam refletir contas e prioridades reais.'),
      pick('choice', 'Quanto dá 20% de R$ 2.500?', '0,20 × R$ 2.500 = R$ 500.', 3, 'R$ 250', 'R$ 750', 'R$ 500'),
      pick('scenario', 'A renda de Paula oscila. Como testar a regra?', 'Uma estimativa conservadora cabe melhor em meses fracos. Reavalie o plano quando as entradas mudarem.', 2, ['Usar sempre o melhor mês', 'Um pico de renda pode não se repetir.'], 'Usar uma base conservadora', ['Partir do limite do cartão', 'Esse limite é crédito.']),
    ],
    exam: pick('choice', 'Em uma renda líquida de R$ 4.000, quanto representa o grupo de 30%?', '30% de R$ 4.000 corresponde a R$ 1.200.', 1, 'R$ 1.200', 'R$ 800', 'R$ 2.000'),
  },
  {
    id: 'orc-tipos', title: 'Fixos, variáveis e ocasionais', objective: 'Classificar gastos pelo comportamento ao longo do tempo.', practice: 'transactions',
    reading: ['Frequência e valor são diferentes', 'Algumas contas se repetem com valor previsível. Outras variam conforme o uso. Gastos ocasionais também podem ser planejados.', 'Um aluguel de R$ 900 é previsível. Energia pode variar de um mês para o outro.'],
    exercises: [
      truth('Uma despesa variável pode ser essencial.', true, 'A conta de água varia com o consumo e pode continuar sendo essencial.'),
      pick('choice', 'Qual caso costuma ter o valor mais previsível durante um contrato?', 'Consulte o contrato, que pode prever reajustes em datas definidas.', 3, 'Mercado', 'Transporte por aplicativo', 'Aluguel mensal contratado'),
      pick('cloze', 'O prêmio anual do seguro é um gasto que pode ser ___.', 'Uma despesa anual conhecida pode ser provisionada todos os meses.', 2, 'contado como renda', 'provisionado', 'ignorado até o vencimento'),
      pick('scenario', 'A energia ficou em R$ 100, R$ 120 e R$ 140. Qual é a média?', 'A soma é R$ 360. Dividindo pelos três meses obtemos R$ 120.', 1, 'R$ 120', ['R$ 140', 'Esse é o maior valor, e não a média.'], ['R$ 360', 'Esse é o total do período.']),
    ],
    exam: pick('choice', 'Quanto reservar por mês para uma despesa de R$ 600 que vence em seis meses?', 'R$ 600 divididos em seis partes resultam em R$ 100.', 3, 'R$ 60', 'R$ 120', 'R$ 100'),
  },
  {
    id: 'orc-tetos', title: 'Defina tetos por categoria', objective: 'Escolher limites realistas e reagir quando o plano mudar.', practice: 'categories',
    reading: ['Um teto ajuda a decidir', 'Use o histórico para definir quanto pode gastar em cada grupo. Compare o gasto já feito com o limite e revise o restante do mês.', 'Com teto de R$ 500 para mercado e R$ 360 usados, restam R$ 140.'],
    exercises: [
      pick('choice', 'Já usei R$ 180 de um teto de R$ 240. Quanto resta?', 'R$ 240 menos R$ 180 são R$ 60.', 1, 'R$ 60', 'R$ 180', 'R$ 420'),
      truth('Mudar o teto no app altera o valor que já foi gasto.', false, 'A edição altera o plano, enquanto os lançamentos mostram o que ocorreu.'),
      order('Qual ordem ajuda a revisar um teto?', ['Definir o limite', 'Conferir gastos anteriores', 'Acompanhar o uso'], [2, 1, 3], 'O histórico orienta o teto. O acompanhamento mostra se ele precisa de ajustes.'),
      pick('scenario', 'Você quase atingiu o teto de lazer na metade do mês. Qual ação cabe no plano?', 'O gasto ainda possível depende do saldo e das prioridades do restante do mês.', 3, ['Apagar recibos', 'Apagar o registro não devolve dinheiro.'], ['Aumentar todos os tetos', 'Isso pode comprometer outras despesas.'], 'Revisar os próximos gastos de lazer'),
    ],
    exam: pick('choice', 'Se você gastou R$ 225 de um teto de R$ 300, qual parte foi usada?', 'R$ 225 ÷ R$ 300 = 0,75, ou 75%.', 2, '25%', '75%', '90%'),
  },
  {
    id: 'orc-revisao', title: 'Feche o mês e ajuste o próximo', objective: 'Comparar o plano com os valores registrados.', practice: 'dashboard',
    reading: ['Compare o previsto com o realizado', 'Conferir a diferença ajuda a identificar gastos incomuns e a preparar o próximo mês.', 'Mercado previsto de R$ 450 e realizado de R$ 520 dá diferença de R$ 70 acima do plano.'],
    exercises: [
      pick('choice', 'O que consultar antes de explicar a diferença do mês?', 'Confira os lançamentos. Pode haver uma compra excepcional ou algum registro em duplicidade.', 2, 'Só o saldo do cartão', 'Os lançamentos e recibos', 'A meta de outra pessoa'),
      truth('O gasto realizado pode ficar abaixo do previsto.', true, 'O orçamento é uma estimativa. O resultado depende do que aconteceu naquele período.'),
      pick('cloze', 'Gasto realizado menos gasto planejado indica a ___.', 'Essa diferença mostra se houve excesso ou folga naquela categoria.', 1, 'diferença do orçamento', 'renda bruta', 'pontuação de crédito'),
      pick('scenario', 'Sua conta de energia subiu por três meses. O que testar?', 'Uma mudança persistente merece revisão do teto e dos hábitos de consumo.', 3, ['Apagar a categoria', 'A conta continuará existindo.'], ['Repetir o valor antigo automaticamente', 'O histórico recente sugere outra estimativa.'], 'Ajustar a previsão e revisar o consumo'),
    ],
    exam: pick('choice', 'O transporte tinha R$ 200 previstos e custou R$ 260. Quanto passou do plano?', 'R$ 260 menos R$ 200 são R$ 60.', 1, 'R$ 60', 'R$ 200', 'R$ 460'),
  },
]);

export const controle = defineWorld({
  id: 'controle-de-gastos', title: 'Controle de gastos', description: 'Transforme lançamentos em uma rotina que ajuda nas decisões.',
  icon: 'list', color: '#0e7490', badge: 'Gastos Sob Controle',
}, [
  {
    id: 'ctl-registro', title: 'Faça um lançamento completo', objective: 'Anotar valor, data e finalidade de cada gasto.', practice: 'transactions',
    reading: ['Registre quando puder conferir', 'Anote valor, data e categoria com um rótulo fácil de reconhecer. Um recibo ou extrato ajuda a conferir.', 'Café de R$ 9 pago por Pix pode entrar como alimentação, com a data da compra.'],
    exercises: [
      pick('choice', 'Qual descrição facilita encontrar a transação?', 'Um rótulo específico ajuda na conferência.', 3, 'Coisa', 'Vários', 'Ônibus para o trabalho'),
      truth('Um gasto pago em dinheiro pode ser registrado sem aparecer no extrato bancário.', true, 'O app aceita lançamentos manuais para registrar pagamentos em espécie.'),
      order('Organize o lançamento de um recibo.', ['Salvar', 'Conferir o valor e a data', 'Selecionar a categoria'], [2, 3, 1], 'Verifique os dados do comprovante, classifique e salve.'),
      pick('scenario', 'Você já registrou cada compra do cartão. Ao pagar a fatura, como evitar duplicar o gasto?', 'Mantenha o critério de registro e confira a quitação sem duplicar os itens.', 2, ['Adicionar toda a fatura como nova despesa', 'Assim a compra entraria duas vezes.'], 'Conferir o pagamento com as compras já registradas', ['Apagar as compras', 'Você perderia o detalhamento.']),
    ],
    exam: pick('choice', 'Pagou R$ 18 por uma corrida para o trabalho. Que categoria ajuda na análise?', 'Uma categoria coerente agrupa deslocamentos semelhantes.', 2, 'Receitas', 'Transporte', 'Saúde'),
  },
  {
    id: 'ctl-categorias', title: 'Organize categorias úteis', objective: 'Agrupar gastos de forma consistente.', practice: 'categories',
    reading: ['Categorias respondem perguntas', 'Crie grupos que ajudem a tomar decisões. Um grupo pode ser separado se o detalhe tiver utilidade.', 'Separar refeições fora de compras de mercado pode ajudar a ajustar o gasto com alimentação.'],
    exercises: [
      truth('Gastos parecidos podem ficar na mesma categoria ao longo dos meses.', true, 'A classificação consistente melhora a comparação de períodos.'),
      pick('choice', 'Quando vale dividir uma categoria?', 'Separe quando houver uma decisão que dependa daquele detalhe.', 1, 'Para acompanhar um gasto específico', 'Sempre que houver só uma compra', 'Para ocultar um lançamento errado'),
      pick('cloze', 'Categorias consistentes ajudam a ___ meses.', 'O agrupamento constante torna a comparação mais confiável.', 3, 'apagar', 'duplicar', 'comparar'),
      pick('scenario', 'Você sempre agrupa passagem e combustível em Transporte. Onde colocar uma nova passagem?', 'Use a mesma regra para comparar o mês com o anterior.', 2, ['Renda', 'Passagem é uma saída.'], 'Transporte', ['Mercado', 'Esse grupo descreve outro tipo de consumo.']),
    ],
    exam: pick('choice', 'Qual agrupamento traz clareza se você quer medir refeições fora?', 'Um grupo separado cumpre o objetivo e preserva as compras de mercado.', 1, 'Refeições fora separadas de mercado', 'Todas as despesas em Outros', 'Um grupo diferente para cada data'),
  },
  {
    id: 'ctl-invisiveis', title: 'Encontre gastos invisíveis', objective: 'Identificar despesas pequenas ou automáticas que se acumulam.', practice: 'transactions',
    reading: ['Pequeno por vez, maior no mês', 'Assinaturas, tarifas e compras frequentes podem passar despercebidas. Procure valores semelhantes no extrato.', 'Uma compra de R$ 12 repetida dez vezes soma R$ 120.'],
    exercises: [
      pick('choice', 'Uma assinatura de R$ 29 por mês custa quanto em 12 meses, sem reajuste?', 'R$ 29 × 12 = R$ 348.', 2, 'R$ 290', 'R$ 348', 'R$ 312'),
      truth('Toda despesa recorrente precisa ser cancelada.', false, 'Avalie uso, custo e condições antes de decidir o que manter.'),
      pick('cloze', 'O extrato ajuda a identificar cobranças ___.', 'Cobranças repetidas podem indicar assinaturas e débitos automáticos.', 3, 'da próxima década', 'apenas em espécie', 'recorrentes'),
      pick('scenario', 'Apareceu uma cobrança mensal que você não reconhece. O que fazer?', 'Confira nos canais oficiais e peça esclarecimento ou conteste conforme o caso.', 1, 'Verificar a origem em canal oficial', ['Enviar a senha por mensagem', 'A senha deve ficar protegida.'], ['Ignorar para sempre', 'A cobrança pode continuar.']),
    ],
    exam: pick('choice', 'Cinco compras de R$ 8 somam quanto?', 'Cinco vezes R$ 8 são R$ 40.', 3, 'R$ 13', 'R$ 32', 'R$ 40'),
  },
  {
    id: 'ctl-rotina', title: 'Crie uma rotina de conferência', objective: 'Construir um hábito curto de registrar e conferir.', practice: 'transactions',
    reading: ['Um horário fácil de repetir', 'Escolha uma frequência que combine com sua rotina, anote gastos e confira com o extrato quando possível.', 'Depois do jantar, separe alguns minutos para registrar o que gastou no dia.'],
    exercises: [
      truth('Um dia sem compras pode fazer parte de uma rotina consistente.', true, 'O hábito é conferir o que aconteceu; não exige criar despesas.'),
      order('Em que ordem conferir uma semana?', ['Revisar diferenças', 'Reunir registros', 'Comparar com extratos e recibos'], [2, 3, 1], 'Reúna os dados, compare e investigue diferenças antes de corrigir.'),
      pick('choice', 'Que evidência ajuda com um lançamento esquecido?', 'Um comprovante permite recuperar a data e o valor.', 2, 'A estimativa de outra pessoa', 'Recibo ou extrato', 'O limite disponível no cartão'),
      pick('scenario', 'Você deixou de anotar dois dias. Qual retomada é prática?', 'Use comprovantes para preencher o que for possível e retome o hábito a partir de hoje.', 3, ['Recomeçar apagando tudo', 'O histórico anterior continua útil.'], ['Inventar valores exatos', 'Isso introduz erro no controle.'], 'Conferir comprovantes e retomar a rotina'),
    ],
    exam: pick('choice', 'Dois lançamentos têm mesmo valor, data e descrição. Qual passo vem antes de excluir?', 'É possível que sejam duas compras legítimas. Confira os comprovantes.', 2, 'Excluir os dois', 'Verificar se houve duplicidade', 'Trocar os dois para receita'),
  },
  {
    id: 'ctl-decisoes', title: 'Escolha o que ajustar', objective: 'Usar o histórico para testar uma mudança viável.', practice: 'dashboard',
    reading: ['Uma mudança que você consegue medir', 'Identifique a categoria que pesa no orçamento e teste um ajuste que preserve os gastos prioritários.', 'Diminuir de quatro para duas entregas de R$ 30 no mês deixa R$ 60 para outra prioridade.'],
    exercises: [
      pick('choice', 'Que comparação ajuda a verificar o efeito de um ajuste?', 'Considere períodos equivalentes e interprete mudanças incomuns.', 1, 'Gasto da mesma categoria em meses comparáveis', 'Dia do mês com nome mais curto', 'Categoria com a cor que você prefere'),
      truth('O maior gasto sempre é o mais fácil de cortar.', false, 'Uma despesa alta pode ser essencial ou ter contrato. Avalie a possibilidade real de ajuste.'),
      pick('cloze', 'Uma mudança mensurável pode ter um valor e um ___.', 'Definir prazo ajuda a conferir o resultado.', 2, 'extrato alheio', 'prazo', 'rótulo aleatório'),
      pick('scenario', 'Uma entrega de R$ 32 passa de quatro para duas vezes no mês. Qual a economia?', 'Duas compras a menos a R$ 32 cada liberam R$ 64.', 3, ['R$ 32', 'Esse é o preço de uma entrega.'], ['R$ 128', 'Esse era o gasto com as quatro.'], 'R$ 64'),
    ],
    exam: pick('choice', 'Se o gasto com aplicativos caiu de R$ 180 para R$ 120, qual foi a diferença?', 'R$ 180 menos R$ 120 são R$ 60.', 1, 'R$ 60', 'R$ 120', 'R$ 300'),
  },
]);

export const reserva = defineWorld({
  id: 'reserva-de-emergencia', title: 'Reserva de emergência', description: 'Prepare uma proteção para despesas imprevistas.',
  icon: 'shield', color: '#047857', badge: 'Reserva em Construção',
}, [
  {
    id: 'res-funcao', title: 'Saiba quando usar a reserva', objective: 'Diferenciar imprevistos de despesas planejadas.', practice: 'savings',
    reading: ['Proteção para imprevistos', 'A reserva serve para situações importantes que fogem do orçamento. Uma compra planejada pode ter uma meta separada.', 'Um conserto urgente para voltar ao trabalho pode exigir reserva. Uma viagem de férias pode ser planejada.'],
    exercises: [
      pick('choice', 'Qual caso combina melhor com uma reserva de emergência?', 'Uma perda inesperada de renda pode exigir cobertura de contas essenciais.', 2, 'Férias marcadas há um ano', 'Perda inesperada de renda', 'Assinatura opcional prevista'),
      truth('É útil manter uma meta separada para gastos previstos.', true, 'Separar compromissos ajuda a preservar a reserva para o que foge ao plano.'),
      pick('cloze', 'A reserva ajuda a atravessar um ___.', 'O dinheiro separado sustenta despesas prioritárias em situações inesperadas.', 1, 'imprevisto', 'parcelamento de lazer previsto', 'resgate sem prazo'),
      pick('scenario', 'Uma despesa escolar anual já tem data. Onde ela entra?', 'Gastos previsíveis podem ser provisionados ao longo do ano.', 3, ['Só na reserva', 'A data permite planejar antes.'], ['Como renda futura', 'Trata-se de saída de dinheiro.'], 'No orçamento ou em uma meta separada'),
    ],
    exam: pick('choice', 'Qual evento é mais compatível com usar a reserva?', 'Uma conta essencial e urgente, que fugiu ao plano, pode justificar o uso.', 1, 'Remédio urgente não previsto', 'Promoção programada', 'Assinatura de streaming'),
  },
  {
    id: 'res-tamanho', title: 'Estime quantos meses proteger', objective: 'Multiplicar os gastos essenciais pelo período desejado.', practice: 'savings',
    reading: ['Comece pelos gastos essenciais', 'Some o que precisa continuar sendo pago em um período difícil. Escolha o horizonte considerando a estabilidade da renda, dependentes e outras proteções.', 'Se os gastos essenciais somam R$ 1.500, uma meta ilustrativa de três meses chega a R$ 4.500.'],
    exercises: [
      pick('choice', 'Quanto são dois meses de gastos essenciais de R$ 1.600?', 'R$ 1.600 × 2 = R$ 3.200.', 3, 'R$ 2.600', 'R$ 1.600', 'R$ 3.200'),
      truth('Pessoas com a mesma renda podem precisar planejar reservas diferentes.', true, 'Gastos essenciais, estabilidade e responsabilidades influenciam o cálculo.'),
      pick('cloze', 'Dividir a reserva pelos gastos essenciais mensais estima quantos ___ ela cobre.', 'Compare os valores na mesma unidade monetária.', 2, 'contratos', 'meses', 'cartões'),
      pick('scenario', 'Ana tem R$ 3.600 separados e gasta R$ 1.200 por mês com o essencial. Qual é a cobertura?', 'R$ 3.600 ÷ R$ 1.200 = 3 meses.', 1, 'Três meses', ['Dois meses', 'Dois meses custariam R$ 2.400.'], ['Quatro meses', 'Quatro meses custariam R$ 4.800.']),
    ],
    exam: pick('choice', 'Qual a cobertura de R$ 2.000 se o essencial custa R$ 800 por mês?', 'R$ 2.000 ÷ R$ 800 = 2,5 meses.', 3, '1,5 mês', '2 meses', '2,5 meses'),
  },
  {
    id: 'res-liquidez', title: 'Considere o acesso ao dinheiro', objective: 'Avaliar prazo de resgate e risco para emergências.', practice: 'investments',
    reading: ['Confira quando o dinheiro fica disponível', 'Liquidez descreve a facilidade de transformar o ativo em dinheiro. Veja carência, prazo, horário de resgate e os riscos do produto.', 'Uma alternativa com carência de seis meses pode não atender uma conta urgente.'],
    exercises: [
      truth('Um prazo de carência pode impedir o resgate quando aparece uma emergência.', true, 'O contrato pode limitar a retirada até uma data definida.'),
      pick('choice', 'Que informação é mais urgente conferir para a reserva?', 'A reserva precisa estar disponível dentro do prazo em que a despesa precisa ser paga.', 1, 'Prazo e condições de acesso', 'Cor do aplicativo', 'Nome da campanha promocional'),
      pick('cloze', 'Transformar um ativo em dinheiro com facilidade tem relação com a ___.', 'Liquidez não elimina os demais riscos de uma aplicação.', 2, 'assinatura', 'liquidez', 'folha salarial'),
      pick('scenario', 'Uma conta vence hoje, e o resgate só cai daqui a cinco dias. Qual é o problema?', 'O prazo de crédito do resgate não combina com a urgência.', 3, ['A data não importa', 'O pagamento vence antes da disponibilidade.'], ['Todo resgate é imediato', 'As regras de liquidação variam.'], 'Há um desencontro entre os prazos'),
    ],
    exam: pick('choice', 'O que perguntar ao comparar opções para o dinheiro de uma emergência?', 'Confira as condições para sacar e os possíveis riscos.', 2, 'A tela mostra meu nome?', 'Em quanto tempo consigo resgatar e sob quais condições?', 'Qual tem a propaganda mais chamativa?'),
  },
  {
    id: 'res-aportes', title: 'Construa a reserva aos poucos', objective: 'Planejar aportes viáveis sem depender de rentabilidade.', practice: 'savings',
    reading: ['Um aporte que cabe no mês', 'Defina um primeiro marco e separe um valor possível depois das contas essenciais. Combine prazo e aporte.', 'Guardar R$ 100 por mês por cinco meses reúne R$ 500, sem rendimentos.'],
    exercises: [
      simulation('Ajuste o aporte mensal para juntar R$ 720 em seis meses, sem rendimentos.', 6, 0, 720, 120, 'R$ 120 × 6 = R$ 720.'),
      pick('choice', 'O que ajustar se o aporte compromete contas essenciais?', 'Diminuir o aporte e estender o prazo é uma forma de caber no orçamento.', 2, 'Somar o limite do cartão ao saldo', 'Reduzir o aporte e rever o prazo', 'Pagar despesas essenciais com dinheiro imaginário'),
      truth('Um pequeno aporte recorrente pode ajudar a construir a reserva.', true, 'Vários aportes se acumulam ao longo do tempo.'),
      pick('scenario', 'Você separou R$ 65 no primeiro mês e R$ 85 no segundo. Qual o saldo sem rendimento?', 'A soma dos aportes é R$ 150.', 1, 'R$ 150', ['R$ 85', 'Esse foi apenas o último aporte.'], ['R$ 20', 'Essa é a diferença entre os aportes.']),
    ],
    exam: pick('choice', 'Qual o total de cinco aportes mensais de R$ 90, sem juros?', 'R$ 90 × 5 = R$ 450.', 3, 'R$ 350', 'R$ 500', 'R$ 450'),
  },
  {
    id: 'res-repor', title: 'Reponha depois de usar', objective: 'Reconhecer o saldo restante e retomar o plano.', practice: 'savings',
    reading: ['Volte ao plano com o saldo real', 'Depois de uma emergência, registre a retirada, confira a cobertura restante e organize os próximos aportes conforme o orçamento.', 'Se havia R$ 2.200 e você usou R$ 600, restam R$ 1.600.'],
    exercises: [
      order('Organize a reposição.', ['Definir novos aportes', 'Registrar o uso', 'Medir a cobertura restante'], [2, 3, 1], 'A retirada atualiza o saldo; a cobertura ajuda a decidir o ritmo de reposição.'),
      truth('A reserva pode ser usada e reconstruída.', true, 'A função da reserva é proteger em momentos difíceis. Depois, pode ser recomposta aos poucos.'),
      pick('cloze', 'Calcule a meta menos o saldo atual para saber o valor a ___.', 'A diferença guia os aportes de reposição.', 1, 'repor', 'retirar novamente', 'contar como renda'),
      pick('scenario', 'Sua meta é R$ 3.000 e ficaram R$ 2.400. Quanto falta repor?', 'R$ 3.000 menos R$ 2.400 são R$ 600.', 2, ['R$ 2.400', 'Esse é o saldo atual.'], 'R$ 600', ['R$ 5.400', 'A reposição usa a diferença, não a soma.']),
    ],
    exam: pick('choice', 'Após usar R$ 800 de R$ 2.300, quanto resta?', 'R$ 2.300 − R$ 800 = R$ 1.500.', 1, 'R$ 1.500', 'R$ 1.700', 'R$ 3.100'),
  },
]);
