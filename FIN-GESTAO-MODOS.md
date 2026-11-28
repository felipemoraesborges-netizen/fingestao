# FinGestão — Etapa 3

## Como os modos funcionam

- O Clássico mantém as telas financeiras e inclui **Metas de compra** em `/classico/metas-de-compra`. A lista distribui o saldo compartilhado entre as metas em ordem de preço. O tabuleiro é a apresentação das mesmas metas no Jogo.
- O Jogo abre em `/jogo/aprender` e tem rotas próprias para Praticar, Metas, histórico, Conquistas, Personagem, Patentes e Perfil. **Praticar** abre ferramentas clássicas. **Voltar ao Jogo** retorna à tela de origem sem salvar outra preferência de modo.
- O seletor preserva a tela e os formulários abertos ao alternar durante a sessão. A conta guarda o modo preferido e a opção de desativar o jogo. Usuários desconectados continuam usando o Clássico e podem conectar a conta ao entrar no Jogo.
- A Biblioteca pode ser mostrada ou ocultada em Configurações. Os artigos entram com o currículo. As lições pontuadas e o motor de aprendizado entram na Etapa 4.

## Teste local

1. Use `npm ci`, rode `npm run dev` e abra a URL local. Pule a escolha inicial para entrar no Clássico. Abra **Nova Despesa**, preencha uma descrição, alterne para o Jogo e volte. Confira o rascunho.
2. Num Supabase de teste, aplique a migração da Etapa 2 e confira se `aportes_trilha` e `total_trilha` estão disponíveis. Conecte a conta em **Configurações & Nuvem**. O modo e a opção da Biblioteca persistem na conta após recarregar.
3. Cadastre um produto em **Metas de compra** e use **Guardar dinheiro**. Confira o saldo e a barra da meta no Clássico. Abra **Metas** no Jogo e confira o produto, o saldo e a conquista, se o aporte já tiver atingido a casa indicada. Abra **Meu Personagem** para testar a continuidade do editor.
4. Em **Praticar**, abra a tela de Transações e use **Voltar ao Jogo**. Em **Configurações**, desative o Modo Jogo, tente abrir `/jogo/metas` diretamente e confira o redirecionamento ao Clássico. Reative pela mesma tela.
5. Rode `npm run build`. Use `npm run preview` para conferir rotas e navegação na compilação local.

## Publicação

Crie um branch de revisão e versione os arquivos já testados com `git add src supabase vercel.json tsconfig.app.json tsconfig.node.json GAMIFICATION_SQL.md TRILHA-CONQUISTAS.md FIN-GESTAO-MODOS.md`. Use `git commit -m "Separa os modos Classico e Jogo"` e `git push -u origin HEAD` nesse branch. Teste também a abertura direta de `/classico/metas-de-compra` e `/jogo/metas` na prévia da Vercel.

A publicação com aportes depende dos dois objetos de saldo no Supabase de destino. Enquanto eles estiverem ausentes, a lista preserva o cadastro de produtos e apresenta o saldo como indisponível. A liberação de retiradas simultâneas entre dispositivos depende da proteção transacional descrita na documentação da Trilha.
