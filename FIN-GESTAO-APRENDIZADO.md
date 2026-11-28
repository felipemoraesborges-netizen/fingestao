# FinGestão · Etapa 4

## O que está disponível

`/jogo/aprender` abre o mundo **Primeiros passos**, com seis lições e uma prova. As lições combinam leitura, múltipla escolha, lacunas, verdadeiro ou falso, cenários, ordenação, associação e uma simulação de aportes. A prova fica disponível após as seis lições e exige 60% na primeira resposta de cada pergunta. Um erro faz a pergunta voltar uma vez ao fim da tentativa. O personagem mostra o feedback, e o resultado dá de uma a três estrelas.

O Modo Jogo registra XP por acerto no estudo normal e premia a primeira conclusão de cada lição, a nota máxima, a prova e as missões. O Treinar permite seguir com zero vidas. Uma vida volta a cada 30 minutos. Treinar ou revisar uma lição concluída recupera uma vida por lição por dia. A revisão prioriza perguntas com revisão vencida. A sequência e as missões usam o horário de São Paulo. Os congelamentos conquistados são usados automaticamente para cobrir dias perdidos na sequência.

O registro de um gasto no Clássico aciona a missão em segundo plano. O servidor confirma que a conta registrou uma despesa naquele dia. A recompensa aparece em Aprender. **Praticar agora** leva à ferramenta do Clássico correspondente, com um botão de retorno à lição.

## Arquivos

- `src/learning/content/primeirosPassos.ts` contém os textos e as respostas. O esquema fica em `src/learning/content/schema.ts`. Os IDs identificam o histórico da conta e devem permanecer estáveis. O conteúdo fica versionado em arquivos para permitir revisão antes de publicar.
- `src/components/learning/` contém o mapa, as missões e os exercícios. `src/services/learningService.ts` envia as ações com a sessão da conta.
- `api/aprendizado.ts` é a Vercel Function. `server/learningHttp.ts` valida a sessão, e `server/learningEngine.ts` corrige as respostas e calcula a próxima mudança. O navegador recebe a etapa atual e só recebe a explicação após responder.
- `supabase/migrations/20261128103746_fin_gestao_motor_aprendizado.sql` adiciona as funções usadas pelo servidor e protege a revisão da sessão. A migração pode ser reaplicada e preserva as linhas existentes.

## Configuração e teste local

1. Em um Supabase de teste com as tabelas do app, aplique os arquivos de `supabase/migrations/` em ordem. A migração `fin_gestao_play` cria `aportes_trilha` e `total_trilha` quando faltam. Veja `FIN-GESTAO-2.0.md` para o procedimento atual.
2. Configure `.env.local` com `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `SUPABASE_SECRET_KEY` do mesmo projeto. Uma chave legada `SUPABASE_SERVICE_ROLE_KEY` também é aceita no servidor. Se usar `SUPABASE_URL`, aponte para o mesmo projeto das sessões do navegador. Use o prefixo `VITE_` somente para valores públicos.
3. Rode `npm ci`, `npm run dev` e entre com uma conta de teste. Abra o Jogo e comece a primeira lição. Responda errado, alterne para o Clássico, volte e confira a mesma etapa. Recarregue a página e use **Continuar** no mapa. Conclua a lição e teste o botão **Praticar agora**.
4. Registre uma despesa no Clássico. Abra Aprender e confira a missão **Registre um gasto hoje** e sua recompensa. Em uma conta de teste, desative o jogo nas configurações e confirme que o acesso direto a `/jogo/aprender` volta ao Clássico.
5. Rode `npm run build`. O comando `npm run preview` usa a mesma rota de aprendizado com o servidor local do Vite.

## Prévia na Vercel

Quando houver autorização, prepare o Supabase de destino e configure as variáveis públicas e a chave secreta do servidor no ambiente **Preview** da Vercel. Depois use um branch de revisão e confirme o que será enviado antes de criar o commit.

```powershell
git switch -c codex/fin-gestao-aprendizado
git add .env.example api server src supabase vite.config.ts vercel.json package.json package-lock.json tsconfig.app.json tsconfig.node.json FIN-GESTAO-APRENDIZADO.md FIN-GESTAO-MODOS.md GAMIFICATION_SQL.md TRILHA-CONQUISTAS.md
git diff --cached --stat
git commit -m 'Adiciona o motor de aprendizado do FinGestão'
git push -u origin HEAD
```

Na prévia, confira o acesso direto a `/jogo/aprender`, entre com uma conta de teste e conclua uma lição. A URL e as credenciais do frontend devem ser do projeto Supabase configurado na função. O XP total ainda usa a coluna compartilhada com as patentes e a Trilha de Metas. As recompensas desta etapa têm um registro separado, com uma chave única por evento de aprendizado.
