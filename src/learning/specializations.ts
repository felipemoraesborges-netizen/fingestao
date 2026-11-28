export const specializations = [
  { id: 'guardiao', title: 'Guardião Financeiro', description: 'Prepare a reserva, reconheça riscos e proteja seus dados.',
    nodes: [['Mede a cobertura da reserva', 'res-tamanho'], ['Lê condições de proteção', 'pro-seguros'], ['Reconhece fraudes', 'pro-golpes']] },
  { id: 'estrategista', title: 'Estrategista', description: 'Planeje o mês, compare o resultado e ajuste dívidas.',
    nodes: [['Monta um orçamento', 'orc-mapa'], ['Fecha o mês', 'orc-revisao'], ['Compara estratégias para quitar dívidas', 'div-pagamento']] },
  { id: 'investidor', title: 'Investidor', description: 'Pratique comparações de prazo, poder de compra e risco.',
    nodes: [['Distingue os tipos de investimento', 'inv-tipos'], ['Compara poder de compra', 'inv-inflacao'], ['Entende risco e liquidez', 'inv-perfil']] },
  { id: 'empreendedor', title: 'Empreendedor', description: 'Planeje caixa, compare crédito e organize registros do negócio.',
    nodes: [['Entende o fluxo do mês', 'pp-fluxo'], ['Compara custo do crédito', 'div-juros'], ['Separa os registros do MEI', 'pro-mei']] },
  { id: 'cacador', title: 'Caçador de Metas', description: 'Traduza objetivos em valores, aportes e prazos.',
    nodes: [['Define um objetivo mensurável', 'pou-objetivo'], ['Calcula um aporte', 'pou-aporte'], ['Planeja uma compra grande', 'comp-planejamento']] },
  { id: 'mestre', title: 'Mestre Financeiro', description: 'Reúna as habilidades das provas de orçamento, proteção e compras.',
    nodes: [['Conclui Orçamento', 'orcamento-prova'], ['Conclui Impostos e proteção', 'impostos-e-protecao-prova'], ['Conclui Grandes compras', 'grandes-compras-prova']] },
] as const;

const seasonTitles = ['Ilha da Prosperidade', 'Reino das Dívidas', 'Universo dos Investimentos', 'Cidade do Futuro'];
const monthlyThemes = [
  ['Janeiro do planejamento', 'orc-mapa'], ['Fevereiro da economia', 'pou-compromissos'], ['Mês da reserva de emergência', 'res-funcao'],
  ['Rota da negociação', 'div-pagamento'], ['Trilha da organização', 'ctl-rotina'], ['Semana do empreendedorismo', 'pro-mei'],
  ['Mês do poder de compra', 'inv-inflacao'], ['Riscos sob controle', 'inv-perfil'], ['Planejamento de longo prazo', 'pro-previdencia'],
  ['Proteção contra golpes', 'pro-golpes'], ['Black Friday consciente', 'comp-negociacao'], ['Natal financeiro', 'comp-planejamento'],
];

export function seasonFor(day: string) {
  const year = day.slice(0, 4);
  const month = Number(day.slice(5, 7));
  const quarter = Math.floor((month - 1) / 3);
  const startMonth = quarter * 3 + 1;
  const start = year + '-' + String(startMonth).padStart(2, '0') + '-01';
  const end = quarter === 3 ? (Number(year) + 1) + '-01-01' : year + '-' + String(startMonth + 3).padStart(2, '0') + '-01';
  return { title: seasonTitles[quarter], start, end, key: 'temporada:' + year + ':' + (quarter + 1),
    highlight: { title: monthlyThemes[month - 1][0], lessonId: monthlyThemes[month - 1][1] } };
}
