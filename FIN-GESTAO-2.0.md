# FinGestão 2.0 · Versão de avaliação local

`2.0.0-dev.1` está na ramificação local `fingestao-2.0`. A base do projeto inclui React, TypeScript, Vite, Tailwind e Supabase. O Modo Profissional e o FinGestão Play usam a mesma conta e os mesmos registros financeiros. Cidades, inventário, XP, respostas e escolhas da história têm armazenamento próprio.

## Executar a avaliação

Requisitos de desenvolvimento validados com Node.js 24 e npm. Na pasta extraída, execute:

```powershell
npm ci
npm run avaliar
```

Abra o endereço de avaliação impresso no terminal. Ele inicia uma conta fictícia e um PostgreSQL em memória usando as migrações do projeto. O servidor escuta somente na máquina local. Use o terminal para encerrar a sessão e descartar os dados de avaliação. Configure um Supabase de desenvolvimento se precisar testar autenticação real ou preservar registros entre sessões.

## Manual de uso

- **Profissional** reúne Visão Geral, Transações, Pastas, Categorias & Tetos, Investimentos, Metas de Poupança, Metas de compra, Relatórios e Configurações. **Meu progresso financeiro** mostra taxa de poupança, gastos por categoria, meses de cobertura e o cálculo do indicador educativo.
- Em **Transações → Importar extrato**, selecione um OFX ou CSV, revise as linhas e confirme. Use até 500 linhas e 2 MB. Para CSV, informe Data, Descrição e Valor. Tipo e Categoria são opcionais. Um tipo ausente usa o sinal do valor. A importação confirma o lote em uma transação e detecta registros já importados pela mesma referência. Compare a prévia com os lançamentos feitos manualmente.
- Nas **Metas de Poupança**, abra **Cofrinho e histórico** para registrar aportes ou retiradas e consultar os movimentos. O saldo antigo continua disponível. O histórico começa após a migração, e ajustes feitos no formulário da meta continuam sendo correções de saldo. Os valores são registros do usuário. O FinGestão não transfere dinheiro.
- **Vale a pena comprar?** compara preço à vista, custo parcelado, horas de trabalho, orçamento e aportes. O usuário escolhe se quer guardar uma reflexão de 24, 48 ou 72 horas. Ela fica na própria conta ou no navegador em modo local.
- Em **Aprender**, termine uma lição para liberar a próxima. O quiz repete uma pergunta errada no fim, oferece revisão e permite Treinar com zero vidas. A Biblioteca reúne os textos dos nove mundos em formato de leitura. Ative-a em Configurações do Profissional.
- Em **Cidade**, selecione um terreno. A Escola inicial é gratuita. Use as setas dentro do mapa ou os botões de navegação. Prédios podem ser movidos, melhorados e usados para abrir lições. A residência e a Árvore da Prosperidade avançam com o estudo e as conquistas.
- Em **Loja**, use FinCoins para adquirir acessórios, companheiros e proteções de sequência. A aba Companheiros permite trocar o animal que acompanha as lições. Ative ou desative o ranking e o lembrete em **Perfil**. O ranking usa pseudônimos e XP de estudo da semana entre amizades aceitas. O lembrete aparece com o Play aberto.
- Em **História**, faça escolhas ao longo de oito capítulos com renda, despesas e dívidas fictícias. Em **Simuladores**, ajuste parâmetros ilustrativos e abra a tabela do gráfico. Os cenários não alteram transações reais. **Habilidades** reúne seis especializações e uma temporada por trimestre.
- **Reduzir movimento** está no cabeçalho do Play. **Desativar o Modo Jogo** fica em Configurações e recolhe a navegação do jogo. A escolha e o histórico da conta são preservados.

## Progresso da implementação

| Área | Entregue nesta versão |
| --- | --- |
| Base e modos | Ramificação local, navegação separada, alternância sem novo login, preservação de finanças e Tabuleiro de Metas. |
| Gestão e educação | Importação OFX e CSV, cofrinhos, painel e roteiro de recuperação, comparador de compras, Biblioteca, 9 mundos, 46 lições, 9 provas e 229 questões. |
| Cidade e personagens | 30 tipos contando a residência, 10 estágios da residência, 10 da Árvore, mapa isométrico com seleção, navegação, zoom, construção, melhoria e reposicionamento, Finny e 20 companheiros. |
| Jogo e hábitos | XP e nível de estudo, FinCoins, vidas, revisão, sequência, desafios de economia, missões diárias, semanais e mensais, loja, amizades, oito faixas de liga, temporadas trimestrais e destaques mensais. |
| Simulação | 15 simuladores com hipóteses ajustáveis, gráfico e tabela. História com 8 capítulos e finais diferentes. |

Ainda faltam o currículo completo de 20 mundos, 200 fases e mais de 2.000 questões revisadas, o catálogo de 150 conquistas e as batalhas animadas com vilões. O documento-mestre também prevê contas bancárias e faturas gerenciadas, calendário financeiro, registro de contratos de dívida, planejamento anual, exportação XLSX, Modo Família, Finny IA e painel administrativo com permissões. Permanecem parciais as animações ambientais, personalização do mascote, conteúdo exclusivo das temporadas, ligas competitivas, ranking global e instalação como PWA. O lembrete entregue é interno ao Play. Autenticação com o Supabase real, recuperação de senha, portabilidade e exclusão completas e validação de implantação demandam homologação adicional.

## Roteiro de teste

1. Alterne entre Profissional e Jogo e confira se os registros permanecem. Abra a primeira lição, erre uma pergunta e volte ao mapa. Confirme a retomada, a perda de uma vida e a repetição da pergunta ao final.
2. Registre uma despesa no Profissional. Confira a recompensa em Aprender. Complete uma lição, compre um item com FinCoins e habilite a personalização na Loja.
3. Construa a Escola no mapa, selecione-a e abra a lição indicada. Mova a construção, mude o zoom e use as setas do teclado. Registre um aporte no cofrinho e verifique o saldo e o histórico.
4. Importe o mesmo extrato duas vezes e confira a contagem do lote. Teste uma projeção de R$ 1.000 a 1% ao mês por dois meses, com zero aportes, que resulta em R$ 1.020,10.
5. No Perfil, teste um código com a participação autorizada de uma segunda conta de desenvolvimento. Desative o Modo Jogo e confira o redirecionamento ao Profissional. Confirme que relatórios, Metas de compra e Tabuleiro continuam acessíveis nos modos correspondentes.

```powershell
npm run build
npm run lint
npm test
npm run test:e2e
```

O teste de navegador usa Chromium do Playwright. Instale-o com `npx playwright-core install chromium`, ou defina `FINGESTAO_CHROME_PATH` com o caminho de um Chrome local. O PostgreSQL dos testes é PGlite, e o navegador acessa a aplicação e as funções SQL via adaptador HTTP de teste. A avaliação é separada da configuração usada pela Vercel.

## Instalação com Supabase de desenvolvimento

1. Em um projeto Supabase separado, aplique `src/database/schema.sql` para instalar a base quando o projeto estiver vazio. Em uma cópia de dados existentes, compare o schema e preserve as tabelas. Em seguida, aplique as migrações versionadas de `supabase/migrations/` em ordem.
2. Configure `.env.local` com a URL do projeto de desenvolvimento, `VITE_SUPABASE_ANON_KEY` e `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`. Use o prefixo `VITE_` apenas para valores públicos. O servidor aceita `SUPABASE_URL` para explicitar o destino. Use o mesmo projeto no navegador e no servidor.
3. Rode `npm run dev` e entre com uma conta de teste. Faça o roteiro acima. Use `npm run build` e `npm run preview` para revisar a versão compilada.

A consulta de metadados do Supabase de produção encontrou `savings_goals.id` como UUID. O schema do repositório usa texto. A migração detecta o tipo antes de criar a chave estrangeira do cofrinho. Também cria `aportes_trilha` e `total_trilha` quando ausentes e reaproveita os dados da Trilha.

As três migrações do FinGestão 2.0 foram aplicadas ao projeto `gestao financeira` em 28/11/2026. Os nomes dos arquivos acompanham as versões registradas no Supabase. A conferência após a migração verificou as contagens dos registros existentes e o acesso às novas funções pelo papel de serviço. O catálogo e as funções também foram consultados sem escrever dados de teste em produção.

## Manual de manutenção

- Os mundos, leituras e questões estão em `src/learning/content/`. Preserve os IDs ao editar conteúdo publicado. O esquema Zod valida a estrutura de cada mundo e a composição completa rejeita IDs duplicados. O build disponibiliza à Biblioteca apenas as leituras.
- O motor de lições está em `server/learningEngine.ts`. A entrada HTTP e a validação da sessão ficam em `api/aprendizado.ts` e `server/learningHttp.ts`. A API entrega a atividade atual e retorna a explicação após a resposta. Os testes cobrem cálculos, desbloqueio, tentativa repetida e separação de contas.
- O catálogo da cidade e da loja está na migração `fin_gestao_play`. Em banco já inicializado, modifique preços, nomes e níveis em uma nova migração. Use identificadores permanentes para manter o inventário e o mapa existentes.
- Os arquivos WebP estão em `public/cidade/` e `public/companheiros/`. As ilustrações originais foram geradas com ImageGen com a referência de arquitetura sustentável. As folhas de sprites reuniram casas com dez evoluções, prédios urbanos, estágios da árvore e companheiros, recortados para renderização individual. Consulte as condições de cada simulador ao alterar fórmulas.
- Conteúdo atual segue explicações de orçamento, crédito, investimentos, seguros, obrigações do MEI e segurança no Pix das fontes oficiais. [Banco Central · Educação Financeira](https://www.bcb.gov.br/pre/pef/port/caderno_cidadania_financeira.pdf) [Banco Central · Segurança no Pix](https://www.bcb.gov.br/estabilidadefinanceira/pix-seguranca) [CVM · Características dos investimentos](https://www.gov.br/investidor/pt-br/investir/antes-de-investir/entenda-as-caracteristicas-dos-investimentos) [Receita Federal · MEI e IRPF](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/perguntas-frequentes/imposto-de-renda/dirpf/obrigacao/mei)

## Segurança, backup e publicação futura

RLS protege os registros por conta. A correção e o saldo virtual usam sessão validada no servidor e funções restritas ao papel de serviço. Compras usam chaves idempotentes, bloqueiam o saldo durante a gravação e rejeitam terrenos ocupados. O ranking expõe pseudônimo e XP de estudo. A importação processa o arquivo no navegador e transmite o lote confirmado. O modo de avaliação usa dados sintéticos e fica ligado somente ao endereço local.

O XP antigo da trilha e o cadastro financeiro continuam editáveis pelo titular. O ranking e o nível da cidade usam eventos verificados de estudo. Os desafios dependem dos registros da conta, sem comprovação bancária. Antes da oferta comercial, faça homologação no Supabase real com duas contas, verifique políticas e permissões em todas as rotas e revise recuperação de senha, limites de requisição, retenção, portabilidade e exclusão. Este relatório descreve os controles testados no projeto local.

Use **Configurações & Nuvem** para o JSON dos dados clássicos, conforme os tipos disponíveis nessa tela. Para backup completo, use o recurso de backup do projeto ou a exportação de papéis, schema e dados prevista pelo Supabase. Guarde a cópia fora do Git e valide a restauração em um projeto separado antes de migrar. O backup da nuvem deve cobrir também metadados de Auth e eventuais objetos de Storage. [Supabase · Backup e restauração](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)

O `vercel.json` desativa a implantação automática nas ramificações `main` e `fingestao-2.0` para permitir integrar o código no GitHub antes de publicar o site. Depois da autorização de publicação, prepare uma prévia com variáveis de homologação e valide as rotas. Para reativar a implantação por push, revise explicitamente a regra da ramificação. [Vercel · Configuração Git](https://vercel.com/docs/project-configuration/git-configuration) [Vercel · Ambientes e variáveis](https://vercel.com/docs/environment-variables)
