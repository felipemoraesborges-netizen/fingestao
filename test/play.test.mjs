import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createFixture, knownUsers, play, root, saveStudy, study } from './dbFixture.mjs';
import { worlds, library } from '../src/learning/content/curriculum.ts';
import { makeSnapshot, planStudy, studyCalendar } from '../server/learningEngine.ts';
import { projectedSavings } from '../src/learning/contracts.ts';

test('currículo, Biblioteca e projeções de aportes', () => {
  assert.equal(worlds.length, 9);
  assert.equal(worlds.reduce((sum, item) => sum + item.lessons.length, 0), 46);
  assert.deepEqual(library.map(world => world.articles.length), worlds.map(world => world.lessons.length));
  assert.doesNotMatch(JSON.stringify(library), /"correct"|"options"|"tags"/);
  assert.equal(projectedSavings(100, 3, .01).at(-1), 303.01);
  assert.deepEqual(projectedSavings(60, 3, 0), [0, 60, 120, 180]);
  assert.deepEqual(studyCalendar(new Date('2026-11-30T01:30:00.000Z')), { day: '2026-11-29', week: '2026-11-23' });
});

test('migrações, progressão, economia virtual, privacidade e saldo da Trilha', async t => {
  const db = await createFixture();
  t.after(() => db.close());
  const { player, friend, neighbor } = knownUsers;
  const now = new Date();
  const { day } = studyCalendar(now);
  const firstLesson = worlds[0].lessons[0];
  const load = (id = player, date = now) => {
    const period = studyCalendar(date);
    return study(db, id, period.day, period.week);
  };

  await t.test('reaplica migração, preserva dados e mantém investimentos fora da Trilha', async () => {
    assert.equal((await db.query('SELECT frase_pessoal FROM public.conquistas WHERE user_id=$1', [player])).rows[0].frase_pessoal, 'Frase anterior');
    assert.equal((await db.query('SELECT current_value FROM public.investments WHERE user_id=$1', [player])).rows[0].current_value, '1555.00');
    assert.equal((await db.query('SELECT * FROM public.total_trilha WHERE user_id=$1', [player])).rows.length, 0);
    await db.query("INSERT INTO public.aportes_trilha (user_id,valor,tipo,data) VALUES ($1,100,'aporte',$2),($3,300,'aporte',$2)", [player, day, neighbor]);
    await assert.rejects(db.query("INSERT INTO public.aportes_trilha (user_id,valor,tipo,data) VALUES ($1,101,'retirada',$2)", [player, day]), /Saldo insuficiente/);
    await db.query("SELECT set_config('test.user_id',$1,false)", [player]);
    await db.exec('SET ROLE authenticated');
    assert.equal((await db.query('SELECT user_id FROM public.total_trilha')).rows[0].user_id, player);
    await assert.rejects(play(db, neighbor, 'state'), error => error.code === '42501');
    await assert.rejects(db.query('SELECT * FROM public.fin_pratica_estado($1,$2)', [neighbor, day]), error => error.code === '42501');
    await db.exec('RESET ROLE; SET ROLE service_role');
  });

  await t.test('bloqueia acesso fora de ordem, retoma e registra erro uma única vez', async () => {
    const data = await load();
    assert.throws(() => planStudy(data, { action: 'start', lessonId: worlds[1].lessons[0].id, mode: 'normal' }, now), /anteriores/);
    const start = planStudy(data, { action: 'start', lessonId: firstLesson.id, mode: 'normal' }, now);
    assert.equal(await saveStudy(db, player, data, start), true);
    assert.equal(await saveStudy(db, player, data, start), false);
    const command = async (action, gradeDate = now) => {
      const previous = await load(player, gradeDate);
      const batch = planStudy(previous, action, gradeDate);
      if (batch) assert.equal(await saveStudy(db, player, previous, batch), true);
      return makeSnapshot(await load(player, gradeDate), action.lessonId, gradeDate);
    };
    let state = makeSnapshot(await load(), firstLesson.id, now);
    const position = () => ({ lessonId: firstLesson.id, sessionId: state.active.sessionId, cursor: state.active.cursor });
    state = await command({ action: 'next', ...position() });
    const mistake = { action: 'answer', ...position(), answer: 'op-2' };
    state = await command(mistake);
    assert.equal(state.player.lives, 4);
    assert.equal(state.active.length, firstLesson.steps.length + 1);
    assert.equal((await command(mistake)).player.lives, 4);
    while (!state.active.done) {
      if (!state.active.feedback) {
        const point = firstLesson.steps.find(item => item.id === state.active.step.id);
        assert.equal('correct' in state.active.step, false);
        state = await command({ action: 'answer', ...position(), answer: point.correct });
      }
      state = await command({ action: 'next', ...position() });
    }
    assert.equal(state.active.score, 75);
    assert.equal(state.player.streak, 1);
    assert.equal(state.player.coins, 17);
    assert.equal(makeSnapshot(await load(), firstLesson.id, new Date(now.valueOf() + 86_400_000)).lessons[0].reviewDue, 1);
  });

  await t.test('reconhece registros da conta e impede recompensas duplicadas', async () => {
    const data = await load();
    assert.equal(data.pratica.aporte, true);
    const batch = planStudy(data, { action: 'expense' }, now);
    assert.equal(batch.eventos.filter(event => event.tipo === 'desafio').length, 1);
    assert.equal(await saveStudy(db, player, data, batch), true);
    assert.equal(await saveStudy(db, player, data, batch), false);
    assert.equal(planStudy(await load(), { action: 'expense' }, now), null);
    assert.equal(makeSnapshot(await load(), undefined, now).challenges.find(item => item.id === 'primeiro-aporte').done, true);
  });

  await t.test('constrói, move e compra usando apenas o saldo virtual', async () => {
    const initial = await play(db, player, 'state');
    assert.equal(initial.catalogo.filter(item => item.tipo === 'construcao').length, 29);
    assert.equal(initial.ranking, false);
    assert.equal(initial.catalogo.filter(item => item.tipo === 'pet').length, 20);
    for (const item of initial.catalogo.filter(item => item.arte)) {
      const directory = item.tipo === 'pet' ? 'companheiros' : 'cidade';
      await access(new URL('public/' + directory + '/' + item.arte + '.webp', root));
    }
    for (let stage = 1; stage <= 10; stage++) {
      await access(new URL('public/cidade/casa-' + stage + '.webp', root));
      await access(new URL('public/cidade/arvore-' + stage + '.webp', root));
    }
    const command = { item: 'escola', row: 0, col: 1, request: randomUUID() };
    const built = await play(db, player, 'build', command);
    assert.equal(built.construcoes.length, 1);
    assert.deepEqual(await play(db, player, 'build', command), built);
    await assert.rejects(play(db, player, 'build', { ...command, item: 'parque', request: randomUUID() }), /terreno livre/);
    await assert.rejects(play(db, neighbor, 'move', { id: built.construcoes[0].id, row: 0, col: 1, request: randomUUID() }), /indisponível/);
    const moved = await play(db, player, 'move', { id: built.construcoes[0].id, row: 1, col: 1, request: randomUUID() });
    assert.equal(moved.construcoes[0].linha, 1);
    const purchased = await play(db, player, 'buy', { item: 'coloracao-mar', request: randomUUID() });
    assert.equal(purchased.moedas, initial.moedas - 12);
    assert.deepEqual([...purchased.inventario].sort(), ['coloracao-mar', 'finny']);
    assert.equal((await play(db, player, 'buy', { item: 'coloracao-mar', request: randomUUID() })).moedas, purchased.moedas);
    await assert.rejects(play(db, player, 'equip', { item: 'dragao' }), /coleção/);
    await play(db, player, 'buy', { item: 'porquinho', request: randomUUID() });
    assert.equal((await play(db, player, 'equip', { item: 'porquinho' })).pet, 'porquinho');
    await db.query('UPDATE public.progresso_usuario SET xp=999999,nivel=100 WHERE user_id=$1', [player]);
    assert.equal((await play(db, player, 'state')).nivel, initial.nivel);
    await assert.rejects(play(db, player, 'upgrade', { id: moved.construcoes[0].id, tier: 2, request: randomUUID() }), /melhoria/);
    await db.query("INSERT INTO public.eventos_jogo(id,user_id,chave_evento,tipo,xp) VALUES ($1,$2,'etapa:fixture','etapa',380)", [randomUUID(), player]);
    await db.query('UPDATE public.progresso_usuario SET moedas=40 WHERE user_id=$1', [player]);
    const upgraded = await play(db, player, 'upgrade', { id: moved.construcoes[0].id, tier: 2, request: randomUUID() });
    assert.equal(upgraded.construcoes[0].melhoria, 2);
    assert.equal(upgraded.moedas, 24);
    await assert.rejects(play(db, neighbor, 'buy', { item: 'solar', request: randomUUID() }), /insuficiente/);
  });

  await t.test('envia convite por código consentido e oculta jogador ao sair do ranking', async () => {
    await play(db, player, 'profile', { ranking: true, alias: 'Ipê' });
    const publicFriend = await play(db, friend, 'profile', { ranking: true, alias: 'Araucária' });
    const request = await play(db, player, 'invite', { code: publicFriend.codigo });
    assert.equal(request.placar.length, 1);
    const inbound = await play(db, friend, 'state');
    assert.equal(inbound.amigos[0].recebida, true);
    assert.equal(inbound.amigos[0].apelido, 'Ipê');
    assert.equal('user_id' in inbound.amigos[0], false);
    const accepted = await play(db, friend, 'friend', { id: inbound.amigos[0].id, decision: 'accept' });
    assert.equal(accepted.placar.length, 2);
    assert.doesNotMatch(JSON.stringify(accepted.placar), /amount|saldo|email|invest/i);
    await play(db, player, 'profile', { ranking: false });
    assert.equal((await play(db, friend, 'state')).placar.length, 1);
    await play(db, player, 'profile', { reminder: true, time: '00:00' });
    assert.equal((await play(db, player, 'state')).notificar, false);
    await play(db, friend, 'profile', { reminder: true, time: '00:00' });
    assert.equal((await play(db, friend, 'state')).notificar, true);
    assert.equal((await play(db, friend, 'reminded')).notificar, false);
    await db.query('UPDATE public.progresso_usuario SET jogo_ativo=false WHERE user_id=$1', [player]);
    await assert.rejects(play(db, player, 'state'), /Ative o Modo Jogo/);
  });
});
