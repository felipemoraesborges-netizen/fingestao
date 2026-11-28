import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

export const root = new URL('../', import.meta.url);
export const knownUsers = {
  player: '20bf16aa-acf7-4898-bbb1-1255cd211ec7',
  friend: '20bf16aa-acf7-4898-bbb1-1255cd211ec8',
  neighbor: '20bf16aa-acf7-4898-bbb1-1255cd211ec9',
};

export async function createFixture({ uuidSavings = false } = {}) {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('test.user_id', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;
  `);
  const read = async relative => (await readFile(new URL(relative, root), 'utf8')).replace(/^CREATE EXTENSION .*;\r?$/gm, '');
  await db.exec(await read('src/database/schema.sql'));
  if (uuidSavings) await db.exec(`ALTER TABLE public.savings_goals ALTER COLUMN id DROP DEFAULT,
    ALTER COLUMN id TYPE uuid USING id::uuid; ALTER TABLE public.savings_goals ALTER COLUMN id SET DEFAULT gen_random_uuid();`);
  for (const [name, id] of Object.entries(knownUsers)) {
    await db.query('INSERT INTO auth.users (id, email) VALUES ($1, $2)', [id, name + '@example.invalid']);
  }
  await db.query("INSERT INTO public.investments(user_id,name,type,current_value,amount_invested) VALUES ($1,'Investimento antigo','outro',1555,1200)", [knownUsers.player]);
  await db.query("INSERT INTO public.conquistas(user_id,titulo,frase_pessoal) VALUES ($1,'Histórico','Frase anterior')", [knownUsers.player]);
  const files = (await readdir(new URL('supabase/migrations/', root)))
    .filter(filename => filename.endsWith('.sql')).sort().map(filename => 'supabase/migrations/' + filename);
  for (let repeat = 0; repeat < 2; repeat++) for (const file of files) await db.exec(await read(file));
  return db;
}

export async function play(db, userId, type, fields = {}) {
  return (await db.query('SELECT public.fin_play_operar($1,$2,$3) AS value', [userId, type, JSON.stringify(fields)])).rows[0].value;
}

export async function study(db, userId, day, week, withPractice = true) {
  const data = (await db.query('SELECT public.fin_aprendizado_ler($1,$2,$3) AS value', [userId, day, week])).rows[0].value;
  if (withPractice) data.pratica = (await db.query('SELECT public.fin_pratica_estado($1,$2) AS value', [userId, day])).rows[0].value;
  return data;
}

export async function saveStudy(db, userId, previous, batch) {
  return (await db.query('SELECT public.fin_aprendizado_salvar($1,$2,$3,$4) AS value',
    [userId, previous.perfil.aprendizado_revisao, randomUUID(), JSON.stringify(batch)])).rows[0].value;
}
