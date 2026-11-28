import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { createFixture, knownUsers } from './dbFixture.mjs';
import { startBrowserFixture } from './browserFixture.mjs';

test('finanças, lições, mapa e Loja no Chrome móvel', async t => {
  const db = await createFixture();
  t.after(() => db.close());
  const category = randomUUID();
  await db.query("INSERT INTO public.categories (id,user_id,name,type) VALUES ($1,$2,'Mercado','expense')", [category, knownUsers.player]);
  await db.query('INSERT INTO public.progresso_usuario (user_id, biblioteca_visivel, modo_escolhido_em) VALUES ($1,true,now()) ON CONFLICT (user_id) DO UPDATE SET biblioteca_visivel=true,modo_escolhido_em=now()', [knownUsers.player]);
  const fixture = await startBrowserFixture(db);
  t.after(fixture.close);
  Object.assign(process.env, { SUPABASE_URL: fixture.endpoint, SUPABASE_SECRET_KEY: fixture.serverKey,
    VITE_SUPABASE_URL: fixture.endpoint, VITE_SUPABASE_ANON_KEY: 'chave-publica-do-teste' });
  const vite = await createServer({ server: { host: '127.0.0.1', port: 0 } });
  await vite.listen();
  t.after(() => vite.close());
  const app = 'http://127.0.0.1:' + vite.httpServer.address().port;
  const request = (body, token) => fetch(app + '/api/aprendizado', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(body),
  });
  assert.equal((await request({ action: 'state' }, 'invalido')).status, 401);
  assert.equal((await request({ action: 'state', userId: knownUsers.friend }, fixture.session.access_token)).status, 400);
  const browser = await chromium.launch({ executablePath: process.env.FINGESTAO_CHROME_PATH, headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(12_000);
  await page.route('**/*', route => [app, fixture.endpoint].some(host => route.request().url().startsWith(host + '/')) ? route.continue() : route.abort());
  await page.addInitScript(({ session, endpoint }) => {
    localStorage.setItem('fingestao_supabase_url', endpoint);
    localStorage.setItem('fingestao_supabase_anon_key', 'chave-publica-do-teste');
    localStorage.setItem('sb-127-auth-token', JSON.stringify(session));
  }, { session: fixture.session, endpoint: fixture.endpoint });
  const button = name => page.getByRole('button', { name, exact: true });
  const click = name => button(name).click();
  const heading = name => page.getByRole('heading', { name, exact: true }).waitFor();

  await page.goto(app + '/classico/biblioteca');
  await heading('Biblioteca de educação financeira');
  await page.getByRole('searchbox').fill('CDB');
  await page.getByRole('link', { name: 'Leia as condições de um CDB' }).click();
  await heading('Leia as condições de um CDB');
  assert.equal(await page.getByRole('button', { name: 'Verificar resposta' }).count(), 0);
  await page.goto(app + '/classico/simuladores');
  await heading('Simuladores financeiros');
  await page.getByLabel('Simulação', { exact: true }).selectOption('compostos');
  await page.getByLabel('Saldo inicial (R$)', { exact: true }).fill('1000');
  await page.getByLabel('Aporte ao fim do mês (R$)', { exact: true }).fill('0');
  await page.getByLabel('Taxa mensal ilustrativa (%)', { exact: true }).fill('1');
  await page.getByLabel('Duração (meses)', { exact: true }).fill('2');
  await page.locator('dl').getByText(/1\.020,10/).waitFor();
  await page.goto(app + '/classico/transacoes');
  await click('Importar extrato');
  await page.getByLabel('Arquivo do extrato').setInputFiles({
    name: 'extrato.csv', mimeType: 'text/csv',
    buffer: Buffer.from('Data;Descrição;Valor;Categoria\n25/11/2026;Padaria do teste;-17,40;Mercado'),
  });
  await click('Confirmar importação');
  await page.getByText('1 importados', { exact: false }).waitFor();
  assert.equal((await db.query('SELECT count(*)::int AS total FROM public.transactions WHERE description=$1', ['Padaria do teste'])).rows[0].total, 1);
  const pdf = page.waitForEvent('download');
  await page.locator('button[title*="PDF"]').click();
  assert.match((await pdf).suggestedFilename(), /\.pdf$/);

  await click('Jogo');
  await heading('Primeiros passos');
  await click('Começar');
  await heading('O que é dinheiro?');
  await click('Continuar');
  await page.getByRole('radio', { name: 'Garantir que o preço nunca mude' }).check();
  await click('Verificar resposta');
  await page.getByRole('img', { name: '4 de 5 vidas' }).waitFor();
  await click('Profissional');
  assert.equal(await page.getByRole('heading', { name: 'Aprender' }).isVisible(), false);
  await click('Jogo');
  await page.getByText('Quase lá!', { exact: true }).waitFor();
  await click('Continuar');
  for (const label of ['Verdadeiro', 'valor', 'R$ 6', 'Comparar o valor de compras']) {
    await page.getByRole('radio', { name: label, exact: true }).check();
    await click('Verificar resposta');
    await page.getByText('Você acertou!', { exact: true }).waitFor();
    await click('Continuar');
  }
  await page.getByText('75% de acertos na primeira tentativa', { exact: true }).waitFor();
  await click('Cidade');
  await heading('Minha cidade');
  const plot = page.getByRole('button', { name: 'Pequena casa com jardim, terreno 1, 1' });
  await plot.focus();
  await plot.press('ArrowRight');
  await page.getByLabel('Construção', { exact: true }).selectOption('escola');
  await click('Construir sem custo');
  await heading('Escola');
  const image = page.locator('button:has(img[src="/cidade/escola.webp"]) img');
  await image.evaluate(element => element.decode());
  assert.ok(await image.evaluate(element => element.naturalWidth > 0));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  if (process.env.FINGESTAO_CITY_SCREENSHOT) await page.screenshot({ path: process.env.FINGESTAO_CITY_SCREENSHOT, fullPage: true });
  await click('Loja');
  await heading('Loja do personagem');
  await click('Comprar por 12 FinCoins');
  await click('Usar no personagem');
  await heading('Meu Personagem');
  await click('Personalizar personagem');
  await click('Cabelo');
  assert.equal(await page.getByRole('button', { name: /#08768d/i }).isEnabled(), true);
  await click('Cancelar');
  await click('História');
  await heading('Um lugar para morar');
  await page.getByRole('button', { name: /Dividir a moradia/ }).click();
  await heading('Ida e volta do trabalho');
  await page.reload();
  await heading('Ida e volta do trabalho');
  await page.goto(app + '/classico/configuracoes');
  const modeSaved = page.waitForResponse(response => response.url().includes('/rest/v1/progresso_usuario') && response.request().method() === 'POST');
  await click('Desativar o Modo Jogo');
  assert.equal((await modeSaved).ok(), true);
  await page.goto(app + '/jogo/aprender');
  await page.waitForURL('**/classico/**');
  assert.equal(await button('Jogo').isVisible(), false);
  assert.deepEqual(errors, []);
  assert.deepEqual(fixture.exceptions, []);
});
