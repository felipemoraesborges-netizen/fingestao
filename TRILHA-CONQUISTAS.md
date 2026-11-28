# Trilha de Conquistas do FinGestão

## Funcionamento

- **Guardar dinheiro** e **Retirar** movimentam apenas o saldo da Trilha. Em **Histórico de aportes**, é possível editar ou excluir cada lançamento. Correções que reduzam o saldo também reposicionam o personagem. As conquistas, os marcos já premiados e as patentes alcançadas continuam registrados.
- A previsão usa aportes menos retiradas nos últimos 90 dias, com pelo menos 30 dias como base de cálculo. Ela aparece para produtos pendentes quando o ritmo líquido é positivo.
- Os movimentos por produto continuam disponíveis em **Gerenciar produtos e movimentos por meta**, com o histórico separado. Os requisitos das patentes vêm de `patentes.conquistas_necessarias`.

## Contrato do Supabase

Este incremento requer zero colunas novas. A [migração aditiva anterior](src/database/trilha-conquistas.sql) é referência para ambientes de teste sem os campos já usados na versão publicada. A posição de cada produto é calculada pelo app.

| Objeto | Campos usados |
| --- | --- |
| `public.aportes_trilha` | `id` UUID, `user_id` UUID, `valor` numérico positivo, `tipo` (`aporte` ou `retirada`), `observacao` texto, `data` data, `created_at` com preenchimento pelo banco |
| `public.total_trilha` | `user_id` UUID e `total` numérico com a soma dos aportes menos retiradas por conta |

As operações esperam acesso pelo papel autenticado e RLS por conta. A view deve respeitar essas mesmas políticas. No Supabase **gestao financeira**, os dois objetos acima estavam ausentes na inspeção. Enquanto o saldo próprio estiver indisponível, a tela mostra o aviso e mantém acessíveis as metas, a galeria, o avatar e as patentes.

Antes de cada alteração, o app consulta o saldo atual e valida o valor em centavos. Abas compatíveis do mesmo navegador compartilham um bloqueio para as gravações. Para impedir saldo negativo com gravações simultâneas em dispositivos distintos, é necessária uma validação transacional no backend. Confira essa proteção no ambiente de destino antes de publicar.

## Teste local

1. Use Node.js 24, rode `npm ci` e depois `npm run dev`. Abra o endereço exibido e selecione **Jogo → Metas**. Em Modo Local, o Jogo oferece o botão de conexão. O mesmo cadastro aparece em **Clássico → Metas de compra**.
2. Para testar o fluxo conectado, configure a URL e a chave pública de um Supabase de teste em **Configurações e nuvem** ou num `.env.local` baseado em `.env.example`. Confira o contrato das tabelas e da view e entre com uma conta de teste.
3. Com saldo inicial zero e R$ 100 por casa, adicione micro-ondas de R$ 800 e geladeira de R$ 4.000. Eles devem aparecer nas casas 8 e 48. Abra a Galeria para conferir os cards bloqueados.
4. Use **Guardar dinheiro** para lançar R$ 100 e depois R$ 4.700. Confira a previsão após o primeiro aporte, a passagem do personagem pelos produtos, os modais em ordem e a abertura da galeria com os cards novos destacados.
5. Tente retirar R$ 5.000 para ver a recusa e então confirme uma retirada de R$ 4.500. O personagem volta à casa 3. Edite e exclua um lançamento no histórico. Recarregue para conferir o saldo, as conquistas e as comemorações já vistas.
6. Em **Meu Personagem**, altere cabelo, roupa e cor, guarde um look, salve e recarregue a tela. Confira o personagem no tabuleiro e em **Patentes**.
7. Confira os requisitos das patentes no Supabase. Crie conquistas manuais até atingir a próxima patente. Confira a promoção e o histórico, depois oculte uma conquista e confirme que só a contagem muda até uma confirmação explícita de rebaixamento.
8. Cadastre ou altere um investimento e volte à Trilha. Compare o saldo e a casa com os valores anteriores. Rode `npm run build` para compilar TypeScript e gerar o pacote de produção.

O jogo atualiza após as gravações e ao voltar à Trilha. Saltos muito grandes compactam trechos comuns para manter a animação breve e passam pelas casas dos produtos. As comemorações são reservadas no banco ao abrir. O som e as notificações dependem das permissões e do suporte do navegador.

## Publicação após aprovação

Depois de validar a Trilha com o banco de destino, revise o diff e versione o código e a documentação com `git add src tsconfig.app.json tsconfig.node.json GAMIFICATION_SQL.md TRILHA-CONQUISTAS.md`. Em seguida, use `git commit -m "Separa o saldo da Trilha de Conquistas"` e `git push` para o ramo ligado à Vercel. Acompanhe a compilação no painel da Vercel e mantenha os arquivos de configuração local fora do Git.
