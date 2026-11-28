import { defineWorld, order, pick, truth } from './buildWorld.ts';

export const investimentos = defineWorld({
  id: 'investimentos-iniciais', title: 'Investimentos para iniciantes', description: 'Compare produto, prazo, risco e poder de compra.',
  icon: 'chart-no-axes-combined', color: '#4338ca', badge: 'Investidor em Formação',
}, [
  {
    id: 'inv-tipos', title: 'Renda fixa e renda variável', objective: 'Distinguir regra de remuneração de preço de mercado.', practice: 'investments',
    reading: ['O que você sabe no momento da compra', 'Na renda fixa, a remuneração ou sua fórmula é conhecida na aplicação. Na renda variável, o retorno depende do desempenho e dos preços de mercado.', 'Um título prefixado tem taxa definida. O preço de uma ação pode subir ou cair ao longo do dia.'],
    exercises: [
      pick('choice', 'Qual é um exemplo típico de renda variável?', 'Ações são participações em empresas negociadas a preços que variam.', 2, 'CDB prefixado', 'Ação negociada em bolsa', 'Tesouro Prefixado'),
      truth('Investimentos de renda fixa também apresentam riscos.', true, 'Crédito, liquidez e oscilação de preço são exemplos de riscos possíveis.'),
      pick('cloze', 'Num título pós-fixado, a fórmula combina as regras do contrato com um ___.', 'O indicador de referência pode variar durante o prazo.', 1, 'indicador de referência', 'preço futuro garantido de uma ação', 'sorteio'),
      pick('scenario', 'A taxa de um título prefixado é conhecida. O que conferir antes de vender antecipadamente?', 'O preço de venda pode variar. Confira o valor de mercado e as condições de negociação.', 3, ['Só a taxa de compra', 'A taxa contratada não define sozinha a venda antes do vencimento.'], ['A cor do cartão', 'Ela não tem relação com o preço de mercado.'], 'O preço de venda e as regras'),
    ],
    exam: pick('choice', 'Que afirmação descreve renda fixa?', 'A regra de remuneração é conhecida, e riscos continuam existindo.', 1, 'A fórmula de remuneração é conhecida na compra', 'Todo resgate dá lucro garantido', 'O preço nunca varia'),
  },
  {
    id: 'inv-tesouro', title: 'Conheça o Tesouro Direto', objective: 'Reconhecer títulos públicos e o efeito de vender antes do prazo.', practice: 'investments',
    reading: ['Investir em títulos públicos federais', 'O Tesouro Direto permite comprar títulos públicos. As formas de rendimento incluem taxa prefixada, vínculo com a Selic e vínculo com a inflação. Confira o vencimento e o preço da venda antecipada.', 'Um Tesouro IPCA+ combina a variação do IPCA com uma taxa contratada, conforme as condições do título.'],
    exercises: [
      pick('choice', 'Quem emite os títulos do Tesouro Direto?', 'Os títulos são emitidos pelo Tesouro Nacional para financiar o governo federal.', 3, 'Uma empresa escolhida pelo comprador', 'O banco que instalou o aplicativo', 'O Tesouro Nacional'),
      truth('Um título pode valer menos na venda antes do vencimento.', true, 'A venda antecipada ocorre de acordo com preços de mercado e condições aplicáveis.'),
      pick('cloze', 'O Tesouro Selic tem remuneração ligada à taxa ___.', 'A taxa de referência pode mudar ao longo do tempo.', 1, 'Selic', 'do cartão do investidor', 'de câmbio do balcão'),
      pick('scenario', 'O dinheiro tem data certa para uso. O que verificar em um título?', 'Compare o vencimento e as condições de resgate com a data em que vai precisar dos recursos.', 2, ['Somente o nome do emissor', 'O nome não indica o prazo da aplicação.'], 'Vencimento e regras de venda', ['Número de curtidas', 'Isso não informa preço ou disponibilidade.']),
    ],
    exam: pick('choice', 'O que pode ocorrer se vender um Tesouro Prefixado antes do vencimento?', 'O valor de venda é sujeito ao preço de mercado do dia.', 2, 'A venda sempre repete o valor projetado para o vencimento', 'O preço pode diferir da projeção usada na compra', 'O prazo original deixa de existir para todos'),
  },
  {
    id: 'inv-cdb', title: 'Leia as condições de um CDB', objective: 'Identificar emissor, liquidez, custos e limites de proteção.', practice: 'investments',
    reading: ['Um título emitido por banco', 'Ao comprar um CDB, você empresta recursos ao banco emissor. Taxa, vencimento e liquidez variam. O FGC pode cobrir CDBs elegíveis conforme suas regras e limites.', 'Dois CDBs podem anunciar a mesma taxa e ter prazos de resgate diferentes.'],
    exercises: [
      pick('choice', 'De quem é a obrigação contratual de pagar um CDB?', 'O banco emissor é o devedor do título.', 1, 'Do banco emissor', 'Da bolsa de valores em todos os casos', 'Do vendedor da loja ao lado'),
      truth('Todo CDB tem liquidez diária.', false, 'A disponibilidade para resgate depende das condições de cada oferta.'),
      pick('cloze', 'A proteção do FGC tem regras e ___.', 'Consulte as condições oficiais do fundo e as informações do emissor.', 2, 'preço fixo para qualquer ativo', 'limites', 'cobertura ilimitada'),
      pick('scenario', 'O CDB tem carência até dezembro e você precisa do dinheiro em agosto. O que isso indica?', 'O resgate pode ficar indisponível quando você precisar.', 3, ['A data pode ser ignorada', 'A carência faz parte do contrato.'], ['O nome CDB garante saque imediato', 'O nome do produto não define sua liquidez.'], 'O prazo de acesso pode ser inadequado'),
    ],
    exam: pick('choice', 'Quais itens comparar além da taxa anunciada?', 'Emissor, liquidez e tributação afetam a segurança e o dinheiro disponível.', 2, 'A cor da interface', 'Emissor, prazo de resgate e custos aplicáveis', 'Apenas a quantidade de anúncios'),
  },
  {
    id: 'inv-inflacao', title: 'Rendimento e poder de compra', objective: 'Distinguir rendimento nominal de rendimento real.', practice: 'investments',
    reading: ['Quanto o dinheiro consegue comprar', 'Inflação representa a alta média de preços de uma cesta. Retorno real compara a variação de um valor com a inflação no mesmo período.', 'Se o saldo cresce 5% e os preços médios sobem 5%, o poder de compra fica estável nesse exemplo, antes de custos.'],
    exercises: [
      truth('Ter mais reais na conta pode coincidir com menor poder de compra.', true, 'Isso ocorre quando o saldo cresce menos que os preços no mesmo período.'),
      pick('choice', 'Qual comparação faz sentido para encontrar o retorno real?', 'Compare o crescimento nominal e a inflação em períodos iguais.', 3, 'Saldo anual com a cor do aplicativo', 'Rendimento mensal com inflação de dez anos', 'Rendimento anual com inflação do mesmo ano'),
      pick('cloze', 'O retorno real considera o efeito da ___.', 'A inflação afeta quanto os reais compram.', 2, 'data de cadastro', 'inflação', 'ordem alfabética'),
      pick('scenario', 'O saldo cresceu 4% e a inflação foi de 6% no período. O poder de compra aumentou?', 'Os preços cresceram mais que o saldo; por isso o poder de compra diminuiu.', 1, 'Diminuiu', ['Aumentou 4%', 'Essa é a variação nominal do saldo.'], ['Ficou igual', 'As duas taxas foram diferentes.']),
    ],
    exam: pick('choice', 'Qual é o resultado real se o valor multiplicou por 1,10 e os preços por 1,10, antes de custos?', 'A razão 1,10 ÷ 1,10 é 1. A variação real foi de 0%.', 1, '0%', '10%', '20%'),
  },
  {
    id: 'inv-perfil', title: 'Risco, liquidez e diversificação', objective: 'Relacionar objetivos, prazos e tolerância a perdas.', practice: 'investments',
    reading: ['Riscos diferentes para objetivos diferentes', 'Perfil de investidor considera tolerância a perdas, capacidade financeira, prazo e objetivos. Distribuir o dinheiro entre riscos diferentes pode reduzir concentração.', 'Ter vários ativos da mesma empresa continua expondo você a problemas daquela empresa.'],
    exercises: [
      pick('choice', 'Qual decisão reduz concentração em um único emissor?', 'Distribuir entre emissores reduz o peso de um único problema, dentro das condições da carteira.', 2, 'Comprar várias vezes exatamente o mesmo título', 'Distribuir em emissores com riscos diferentes', 'Trocar o nome dos investimentos'),
      truth('Diversificar elimina a possibilidade de perdas.', false, 'Diversificar reduz certos riscos de concentração, mas perdas continuam possíveis.'),
      order('Organize uma avaliação inicial.', ['Comparar produtos', 'Definir objetivo e prazo', 'Avaliar liquidez e risco aceitáveis'], [2, 3, 1], 'O objetivo e o prazo orientam as condições que você procura no produto.'),
      pick('scenario', 'Você vai usar o dinheiro em breve. Que informação pesa mais nessa comparação?', 'Confira liquidez, risco de perda e compatibilidade com o prazo.', 3, ['O maior retorno anunciado', 'O anúncio sozinho não garante disponibilidade ou retorno.'], ['O que um amigo escolheu', 'Ele pode ter outro prazo e outra tolerância.'], 'Acesso e risco no prazo do objetivo'),
    ],
    exam: pick('choice', 'O que diferencia seus objetivos de curto e de longo prazo?', 'O tempo disponível muda a necessidade de liquidez e a capacidade de encarar oscilações.', 2, 'O nome dos bancos', 'Prazos e capacidade de suportar oscilações', 'Somente a quantidade de aplicações'),
  },
]);

export const protecao = defineWorld({
  id: 'impostos-e-protecao', title: 'Impostos e proteção', description: 'Organize documentos, conheça coberturas e reconheça fraudes.',
  icon: 'shield-check', color: '#334155', badge: 'Finanças Protegidas',
}, [
  {
    id: 'pro-ir', title: 'Organize o Imposto de Renda', objective: 'Reconhecer informes e consultar as regras do exercício correto.', practice: 'reports',
    reading: ['A declaração usa dados de um período', 'As condições de entrega podem variar por exercício. Consulte a Receita Federal e guarde informes e comprovantes usados para preencher a declaração.', 'Um informe do banco ajuda a conferir rendimentos e saldos antes de declarar.'],
    exercises: [
      pick('choice', 'Onde conferir se precisa entregar a declaração este ano?', 'Use as regras oficiais do exercício e compare com sua situação.', 1, 'Receita Federal', 'Mensagem de um número desconhecido', 'Tabela antiga de qualquer ano'),
      truth('Os comprovantes ajudam a revisar os valores declarados.', true, 'Guardar a documentação permite conferir dados e corrigir divergências.'),
      pick('cloze', 'O informe de rendimentos é um ___.', 'O documento registra informações úteis para a declaração.', 3, 'código de desbloqueio', 'cartão bancário', 'documento de conferência'),
      pick('scenario', 'Um post afirma que todo Pix é um imposto. Qual resposta faz sentido?', 'Pix é um meio de pagamento. A tributação depende da operação e das regras aplicáveis.', 2, ['Pagar um boleto do post', 'A cobrança pode ser fraudulenta.'], 'Consultar a Receita em seu canal oficial', ['Enviar dados bancários a quem publicou', 'Seus dados devem ficar protegidos.']),
    ],
    exam: pick('choice', 'Qual etapa ajuda antes de enviar uma declaração?', 'Revise os valores com documentos do exercício correto.', 3, 'Usar um informe aleatório', 'Ignorar rendimentos divergentes', 'Conferir os informes e valores'),
  },
  {
    id: 'pro-seguros', title: 'Leia o que o seguro cobre', objective: 'Entender prêmio, cobertura, exclusões e franquia.', practice: 'categories',
    reading: ['Cobertura tem condições', 'Prêmio é o custo do seguro. A apólice descreve coberturas, exclusões e limites. Alguns seguros têm franquia, uma parcela do prejuízo assumida pelo segurado conforme o contrato.', 'Duas apólices com preço parecido podem cobrir eventos diferentes.'],
    exercises: [
      pick('choice', 'Onde conferir exclusões de cobertura?', 'As condições contratuais explicam os eventos cobertos e excluídos.', 2, 'Na placa de uma loja', 'Na apólice e condições do seguro', 'No extrato de outra pessoa'),
      truth('Coberturas diferentes podem mudar o valor de um prêmio.', true, 'A extensão da proteção e as condições influenciam o preço.'),
      pick('cloze', 'O valor cobrado pelo seguro se chama ___.', 'Prêmio é o nome do pagamento da cobertura contratada.', 1, 'prêmio', 'salário', 'aplicação automática'),
      pick('scenario', 'Um dano está expressamente excluído da proposta. O que considerar?', 'Leia a exclusão e compare se outra oferta atende à necessidade.', 3, ['Contar com a cobertura mesmo assim', 'A exclusão delimita a proteção.'], ['Escolher só pelo preço', 'Um preço baixo pode deixar uma necessidade de fora.'], 'Comparar propostas com cobertura adequada'),
    ],
    exam: pick('choice', 'Que informações comparar em duas propostas?', 'Cobertura, exclusões, limites e franquia afetam o uso da proteção.', 2, 'Somente a marca', 'Coberturas, exclusões, limites e franquia', 'Só o tamanho do papel'),
  },
  {
    id: 'pro-previdencia', title: 'Entenda a previdência complementar', objective: 'Identificar custos e condições de um plano de longo prazo.', practice: 'investments',
    reading: ['Complementar a renda futura', 'Planos de previdência aberta e produtos de acumulação têm regras próprias. Confira taxas, riscos, tributação, resgate e opções de receber recursos.', 'Antes de comparar PGBL e VGBL, confira o regime tributário e como se aplica à sua situação.'],
    exercises: [
      truth('Planos podem cobrar taxas diferentes.', true, 'Confira os custos que incidem durante a acumulação ou em outros momentos.'),
      pick('choice', 'O que comparar para uma meta de longo prazo?', 'Custos, regras de retirada e riscos podem afetar o saldo ao longo dos anos.', 3, 'A cor do contrato', 'Somente o nome do plano', 'Custos, riscos e condições de resgate'),
      pick('cloze', 'Um plano pode complementar a renda na ___.', 'O prazo longo ajuda a planejar rendimentos futuros.', 1, 'aposentadoria', 'compra de pão de amanhã', 'próxima hora'),
      pick('scenario', 'Você considera um plano só porque alguém mencionou uma dedução. Que passo ajuda?', 'Verifique as condições aplicáveis à sua declaração e os custos do plano.', 2, ['Assinar sem ler', 'Condições fiscais e contratuais importam.'], 'Consultar regras oficiais e examinar o contrato', ['Presumir que todos recebem a mesma dedução', 'O tratamento depende das condições.']),
    ],
    exam: pick('choice', 'Antes de contratar, o que procurar no regulamento?', 'O regulamento ajuda a entender quando e como os valores podem ser recebidos.', 3, 'Propaganda', 'A senha de outra pessoa', 'Taxas e opções de resgate ou benefício'),
  },
  {
    id: 'pro-mei', title: 'Separe as contas do MEI', objective: 'Distinguir obrigações do negócio e da pessoa física.', practice: 'transactions',
    reading: ['Acompanhe o dinheiro do negócio', 'Registre receitas da atividade e guarde documentos. Consulte o Portal do Empreendedor para as obrigações do MEI, como o DAS e a declaração anual. A pessoa física verifica separadamente suas regras de IR.', 'Um Pix de cliente é registrado no controle do negócio; uma compra de casa pode ficar no orçamento pessoal.'],
    exercises: [
      pick('choice', 'Onde gerar e conferir o DAS?', 'Consulte um canal oficial do governo para evitar boletos falsos.', 2, 'Mensagem com cobrança urgente', 'Portal oficial ou aplicativo oficial', 'Link enviado por desconhecido'),
      truth('O simples fato de ser MEI obriga a declarar IR como pessoa física em todos os casos.', false, 'A pessoa física avalia as condições do exercício. As obrigações do CNPJ seguem suas próprias regras.'),
      pick('cloze', 'Guardar notas ajuda a conferir receitas do ___.', 'Organizar documentos facilita acompanhar a atividade.', 1, 'negócio', 'vizinho', 'cartão de outra pessoa'),
      pick('scenario', 'Um e-mail diz que cobra para enviar a declaração do MEI e pede sua senha. O que fazer?', 'Entre diretamente no portal oficial e verifique as orientações.', 3, ['Responder com a senha', 'Compartilhar senha expõe o acesso à conta.'], ['Pagar antes de conferir', 'A cobrança pode ser falsa.'], 'Usar o portal oficial por conta própria'),
    ],
    exam: pick('choice', 'Como facilitar a conferência das contas?', 'Separar os registros ajuda a identificar despesas e receitas do negócio.', 1, 'Registrar atividade e gastos pessoais separadamente', 'Guardar só os pagamentos em dinheiro', 'Misturar tudo sem descrição'),
  },
  {
    id: 'pro-golpes', title: 'Reconheça golpes financeiros', objective: 'Verificar canais, proteger credenciais e reagir a fraudes.', practice: 'dashboard',
    reading: ['Urgência pode fazer parte do golpe', 'Ignore pedidos de senha, código ou acesso remoto. Confira o destinatário, acesse o banco por conta própria e, diante de fraude, procure sua instituição rapidamente.', 'Se alguém diz que enviou um Pix por engano, confira o extrato e use os recursos oficiais de devolução do próprio Pix quando aplicável.'],
    exercises: [
      truth('Um suposto atendente deve receber a senha da sua conta para verificar segurança.', false, 'Senhas e códigos de autenticação devem permanecer com você.'),
      pick('choice', 'Qual canal usar quando uma mensagem diz que sua conta está bloqueada?', 'Abra o aplicativo oficial ou contate o número oficial que você já conhece.', 3, 'Responder no mesmo link', 'Um número aleatório que chegou junto', 'Aplicativo ou contato oficial'),
      order('Recebeu pedido urgente de um suposto parente. Como conferir?', ['Decidir se faz a transferência', 'Parar e não clicar no link', 'Confirmar com a pessoa por outro canal conhecido'], [2, 3, 1], 'Confirme por um canal independente antes de tomar uma decisão.'),
      pick('scenario', 'Você percebeu que enviou um Pix em um golpe. Qual é o primeiro passo?', 'Relate o ocorrido à instituição por canal oficial e preserve comprovantes.', 2, ['Apagar comprovantes', 'Os registros ajudam no atendimento e na apuração.'], 'Contatar o banco rapidamente pelo canal oficial', ['Transferir mais dinheiro para recuperar', 'Isso pode aumentar o prejuízo.']),
    ],
    exam: pick('choice', 'O que checar antes de confirmar um Pix?', 'Confira valor e destinatário na tela do seu banco.', 1, 'Valor e destinatário', 'Só a foto da conversa', 'A hora do último anúncio'),
  },
]);
