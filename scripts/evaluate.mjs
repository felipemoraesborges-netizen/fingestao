import { randomUUID } from 'node:crypto';
import { createServer } from 'vite';
import { createFixture, knownUsers } from '../test/dbFixture.mjs';
import { startBrowserFixture } from '../test/browserFixture.mjs';
import { studyCalendar } from '../server/learningEngine.ts';

const db = await createFixture();
const user = knownUsers.player;
const food = randomUUID();
const pay = randomUUID();
const today = studyCalendar(new Date()).day;
await db.query(`INSERT INTO public.categories(id,user_id,name,type,budget_limit) VALUES
  ($1,$3,'Alimentação','expense',600),($2,$3,'Salário','income',0)`, [food, pay, user]);
await db.query(`INSERT INTO public.transactions(user_id, type, amount, date, description, category_id) VALUES
  ($1,'income',2800,$4,'Renda fictícia',$2),($1,'expense',72.80,$4,'Mercado fictício',$3)`, [user, pay, food, today]);
await db.query("INSERT INTO public.savings_goals(user_id,name,target_amount,saved_amount) VALUES ($1,'Reserva de avaliação',6000,750)", [user]);
await db.query(`INSERT INTO public.progresso_usuario(user_id,modo_escolhido_em,biblioteca_visivel)
  VALUES ($1,now(),true) ON CONFLICT (user_id) DO UPDATE SET modo_escolhido_em=now(),biblioteca_visivel=true`, [user]);

const fixture = await startBrowserFixture(db);
Object.assign(process.env, { SUPABASE_URL: fixture.endpoint, SUPABASE_SECRET_KEY: fixture.serverKey, VITE_SUPABASE_URL: fixture.endpoint,
  VITE_SUPABASE_ANON_KEY: 'chave-publica-do-teste' });
const server = await createServer({
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{
    name: 'fingestao-avaliacao-local',
    configureServer(vite) {
      vite.middlewares.use('/_avaliacao', (_request, response) => {
        const session = JSON.stringify(fixture.session);
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        response.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>FinGestão 2.0 · Avaliação local</title>
          <p>Abrindo o FinGestão com dados fictícios de avaliação.</p><script>
          localStorage.setItem('sb-127-auth-token', JSON.stringify(${session}));
          localStorage.setItem('fingestao_supabase_url', ${JSON.stringify(fixture.endpoint)});
          localStorage.setItem('fingestao_supabase_anon_key', 'chave-publica-do-teste');
          location.replace('/classico/visao-geral');
          </script></html>`);
      });
    },
  }],
});
await server.listen();
const url = 'http://127.0.0.1:' + server.httpServer.address().port + '/_avaliacao';
console.log('Avaliação local com banco em memória e dados fictícios.');
console.log(url);
console.log('Encerre com Ctrl+C para descartar a sessão.');

let closing = false;
const close = async () => {
  if (closing) return;
  closing = true;
  await server.close();
  await fixture.close();
  await db.close();
};
process.once('SIGINT', () => void close());
process.once('SIGTERM', () => void close());
