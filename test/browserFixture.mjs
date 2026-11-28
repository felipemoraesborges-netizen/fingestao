import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { knownUsers, play, saveStudy, study } from './dbFixture.mjs';

const tables = new Set(['profiles', 'categories', 'folders', 'transactions', 'investments', 'savings_goals', 'progresso_usuario',
  'patentes', 'historico_patentes', 'conquistas', 'metas_compra', 'aportes_trilha', 'total_trilha', 'eventos_jogo', 'total_guardado',
  'historias_finplay', 'reflexoes_compra', 'movimentos_cofrinho']);
const identifier = name => { assert.match(name, /^[a-z_]+$/); return '"' + name + '"'; };

export async function startBrowserFixture(db) {
  const userId = knownUsers.player;
  const user = { id: userId, email: 'avaliacao@example.invalid', aud: 'authenticated', role: 'authenticated',
    user_metadata: { name: 'Conta de avaliação' }, app_metadata: {}, created_at: new Date().toISOString() };
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const accessToken = encode({ alg: 'HS256', typ: 'JWT' }) + '.' + encode({ sub: userId, exp: expires, aud: 'authenticated' }) + '.fixture';
  const session = { access_token: accessToken, refresh_token: 'fixture', expires_at: expires, expires_in: 3600, token_type: 'bearer', user };
  const serverKey = 'chave-exclusiva-de-teste';
  const exceptions = [];
  const server = createServer(async (request, response) => {
    const send = (status, payload) => response.writeHead(status, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': '*', 'Content-Type': 'application/json' }).end(payload === undefined ? '' : JSON.stringify(payload));
    try {
      const url = new URL(request.url, 'http://localhost');
      if (request.method === 'OPTIONS') return send(204);
      if (url.pathname === '/auth/v1/user') return request.headers.authorization === 'Bearer ' + accessToken ? send(200, user) : send(401, { message: 'Sessão inválida' });
      if (!(request.headers.authorization === 'Bearer ' + accessToken || request.headers.apikey === serverKey)) return send(401, { message: 'Sessão inválida' });
      if (url.pathname === '/auth/v1/logout') return send(204);
      let body = {};
      if (['POST', 'PATCH'].includes(request.method)) {
        const chunks = await Array.fromAsync(request);
        body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
      }
      const name = url.pathname.split('/').at(-1);
      if (url.pathname.startsWith('/rest/v1/rpc/')) {
        if (name === 'fin_importar_extrato' || name === 'fin_cofrinho_lancar') {
          assert.equal(request.headers.authorization, 'Bearer ' + accessToken);
          await db.query("SELECT set_config('test.user_id',$1,false)", [userId]);
          const output = name === 'fin_importar_extrato'
            ? await db.query('SELECT public.fin_importar_extrato($1) AS value', [JSON.stringify(body.p_lote)])
            : await db.query('SELECT public.fin_cofrinho_lancar($1,$2,$3,$4) AS value', [body.p_meta, body.p_tipo, body.p_valor, body.p_id]);
          return send(200, output.rows[0].value);
        }
        assert.equal(request.headers.apikey, serverKey);
        assert.equal(body.p_usuario, userId);
        if (name === 'fin_aprendizado_ler') return send(200, await study(db, userId, body.p_dia, body.p_semana, false));
        if (name === 'fin_pratica_estado') return send(200, (await db.query('SELECT public.fin_pratica_estado($1,$2) AS value', [userId, body.p_dia])).rows[0].value);
        if (name === 'fin_aprendizado_salvar') return send(200, await saveStudy(db, userId, { perfil: { aprendizado_revisao: body.p_anterior } }, body.p_lote));
        if (name === 'fin_play_operar') return send(200, await play(db, userId, body.p_acao, body.p_dados));
        if (name === 'inicializar_patentes') return send(200, null);
        return send(404, { code: 'PGRST202', message: 'Função de teste não disponível' });
      }
      assert.ok(tables.has(name), name);
      const table = 'public.' + identifier(name);
      const ownerField = name === 'profiles' ? 'id' : 'user_id';
      const filters = [];
      const values = [];
      const param = value => '$' + values.push(value && typeof value === 'object' && !Array.isArray(value) ? JSON.stringify(value) : value);
      const selected = url.searchParams.get('select') ?? '*';
      const projection = selected === '*' ? selected : selected.split(',').map(identifier).join(',');
      const prefer = request.headers.prefer ?? '';
      const returning = prefer.includes('return=representation') ? ' RETURNING ' + projection : '';
      const filtersSql = () => {
        filters.push(identifier(ownerField) + '=' + param(userId));
        for (const [field, value] of url.searchParams) {
          if (value.startsWith('eq.')) filters.push(identifier(field) + '=' + param(value.slice(3)));
          if (value === 'is.null') filters.push(identifier(field) + ' IS NULL');
          if (value.startsWith('in.(')) filters.push(identifier(field) + ' IN (' + value.slice(4, -1).split(',').map(param).join(',') + ')');
        }
        return ' WHERE ' + filters.join(' AND ');
      };
      let rows;
      if (request.method === 'GET') {
        const order = url.searchParams.get('order')?.split(',').map(spec => {
          const [field, direction] = spec.split('.');
          return identifier(field) + (direction === 'desc' ? ' DESC' : ' ASC');
        });
        rows = (await db.query('SELECT ' + projection + ' FROM ' + table + filtersSql() + (order?.length ? ' ORDER BY ' + order.join(',') : ''), values)).rows;
      } else if (request.method === 'POST') {
        assert.equal(body[ownerField], userId);
        const names = Object.keys(body);
        const conflict = url.searchParams.get('on_conflict') ?? 'id';
        const onConflict = prefer.includes('resolution=ignore-duplicates') ? ' ON CONFLICT (' + identifier(conflict) + ') DO NOTHING'
          : prefer.includes('resolution=merge-duplicates') ? ' ON CONFLICT (' + identifier(conflict) + ') DO UPDATE SET ' +
            names.filter(field => field !== conflict).map(field => identifier(field) + '=EXCLUDED.' + identifier(field)).join(',') : '';
        rows = (await db.query('INSERT INTO ' + table + '(' + names.map(identifier).join(',') + ') VALUES (' +
          Object.values(body).map(param).join(',') + ')' + onConflict + returning, values)).rows;
      } else if (request.method === 'PATCH') {
        const fields = Object.entries(body).map(([field, value]) => identifier(field) + '=' + param(value));
        rows = (await db.query('UPDATE ' + table + ' SET ' + fields.join(',') + filtersSql() + returning, values)).rows;
      } else if (request.method === 'DELETE') {
        rows = (await db.query('DELETE FROM ' + table + filtersSql() + returning, values)).rows;
      } else return send(405, { message: 'Operação de teste indisponível' });
      if (request.method !== 'GET' && !returning) return send(204);
      if (request.headers.accept?.includes('vnd.pgrst.object')) {
        return rows.length === 1 ? send(200, rows[0]) : send(406, { code: 'PGRST116', message: 'Esperava uma linha' });
      }
      send(200, rows);
    } catch (error) {
      if (!['P0001', '42703'].includes(error.code)) exceptions.push(error.message);
      send(error.code === 'P0001' ? 409 : 400, { code: error.code, message: error.message });
    }
  });
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', resolve).on('error', reject));
  return { endpoint: 'http://127.0.0.1:' + server.address().port, session, serverKey, exceptions,
    close: () => new Promise(resolve => server.close(resolve)) };
}
