import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createFixture, knownUsers } from './dbFixture.mjs';
import { parseStatement, statementKeys } from '../src/finance/statementImport.ts';
import { scenes, replayStory } from '../src/learning/lifeStory.ts';
import { monthlyIndicators, healthIndicators } from '../src/finance/indicators.ts';

test('extratos em CSV e OFX são validados e evitam duplicações do mesmo arquivo', async () => {
  const csv = 'Extrato mensal\r\nData;Tipo;Descrição;Categoria;Valor (R$)\r\n29/02/2024;Despesa;"Mercado; padaria";Alimentação;49,50\r\n29/02/2023;Receita;Pix;Outros;10,00';
  const entry = parseStatement(csv, 'csv');
  assert.equal(entry.ignored, 1);
  assert.deepEqual(entry.valid[0], { date: '2024-02-29', description: 'Mercado; padaria', category: 'Alimentação', amount: 49.5, type: 'expense', reference: '' });
  const csvKeys = await statementKeys([entry.valid[0], entry.valid[0]]);
  assert.notEqual(csvKeys[0], csvKeys[1]);
  assert.equal(csvKeys[0], (await statementKeys(entry.valid))[0]);
  const ofx = '<OFX><BANKID>001<ACCTID>A234<BANKTRANLIST><STMTTRN><DTPOSTED>20260102000000[-3:BRT]<TRNAMT>-50.10<FITID>D1<NAME>Padaria</BANKTRANLIST>';
  const imported = parseStatement(ofx, 'ofx');
  assert.equal(imported.valid[0].date, '2026-01-02');
  assert.equal(imported.valid[0].type, 'expense');
  assert.equal(imported.valid[0].amount, 50.1);
  assert.deepEqual(await statementKeys(imported.valid), await statementKeys(parseStatement(ofx.replace('Padaria', 'Padaria central'), 'ofx').valid));
});

test('os indicadores usam lançamentos do período e a história tem finais diferentes', () => {
  const input = [
    { type: 'income', amount: 2500, date: '2026-11-01' },
    { type: 'expense', amount: 1300, date: '2026-11-02', categoryId: 'mercado' },
    { type: 'expense', amount: 700, date: '2026-11-03', categoryId: 'desconhecida' },
    { type: 'income', amount: 100, date: '2026-12-01' },
  ];
  const stats = monthlyIndicators(input, [{ id: 'mercado', type: 'expense', name: 'Mercado', budgetLimit: 1500 }], '2026-11');
  assert.equal(stats.income, 2500);
  assert.equal(stats.expenses, 2000);
  assert.equal(stats.rate, .2);
  assert.equal(stats.byCategory[1].name, 'Sem categoria');
  assert.equal(healthIndicators(stats, 1)?.total, 73);
  assert.equal(healthIndicators(monthlyIndicators([], [], '2026-11'), 1), null);
  const safe = replayStory(scenes.map(scene => scene.options[0].id));
  const risky = replayStory(['sozinho', 'carro', 'adiar-curso', 'credito', 'parcelar-imprevisto', 'emprego', 'meta-familia', 'longo-prazo']);
  assert.equal(safe.scene, undefined);
  assert.notEqual(safe.ending, risky.ending);
  assert.ok(risky.result.debt > safe.result.debt);
  assert.throws(() => replayStory(['dado-não-valido']), /escolha salva/);
});

test('migração com UUID em metas, transações atômicas e separação por conta', async t => {
  const db = await createFixture({ uuidSavings: true });
  t.after(() => db.close());
  const { player, friend } = knownUsers;
  const [goal, category] = [randomUUID(), randomUUID()];
  await db.query("INSERT INTO public.savings_goals(id,user_id,name,target_amount,saved_amount) VALUES ($1,$2,'Reserva',1000,35)", [goal, player]);
  await db.query("INSERT INTO public.categories(id,user_id,name,type) VALUES ($1,$2,'Alimentação','expense')", [category, player]);
  await db.exec('GRANT SELECT ON public.categories TO authenticated; GRANT SELECT,INSERT ON public.transactions TO authenticated; SET ROLE authenticated');
  await db.query("SELECT set_config('test.user_id',$1,false)", [player]);
  const move = async (type, amount, request) => Number((await db.query('SELECT public.fin_cofrinho_lancar($1,$2,$3,$4) AS value', [goal, type, amount, request])).rows[0].value);
  const request = randomUUID();
  assert.equal(await move('aporte', 25.5, request), 60.5);
  assert.equal(await move('aporte', 25.5, request), 60.5);
  assert.equal(await move('retirada', 5, randomUUID()), 55.5);
  await assert.rejects(move('retirada', 56, randomUUID()), /Saldo insuficiente/);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM public.movimentos_cofrinho')).rows[0].count, 2);
  const line = { tipo: 'expense', valor: 10, data: '2026-11-01', descricao: 'Mercado', categoria: category, chave: 'a'.repeat(64) };
  const bulk = async list => Number((await db.query('SELECT public.fin_importar_extrato($1) AS value', [JSON.stringify(list)])).rows[0].value);
  assert.equal(await bulk([line]), 1);
  assert.equal(await bulk([line]), 0);
  await assert.rejects(bulk([{ ...line, chave: 'b'.repeat(64) }, { ...line, categoria: 'inexistente' }]), /categoria/);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM public.transactions')).rows[0].count, 1);
  await db.query("SELECT set_config('test.user_id',$1,false)", [friend]);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM public.movimentos_cofrinho')).rows[0].count, 0);
  await assert.rejects(move('aporte', 10, randomUUID()), /indisponível/);
  await assert.rejects(bulk([line]), /categoria/);
});
