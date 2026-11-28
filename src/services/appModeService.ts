import { getSupabaseClient } from '../lib/supabase';
import type { AppMode } from '../navigation/appRoutes';

export interface ModePreferences {
  mode: AppMode;
  gameEnabled: boolean;
  chosenAt: string | null;
  libraryVisible: boolean;
}

export const defaultModePreferences: ModePreferences = {
  mode: 'classico',
  gameEnabled: true,
  chosenAt: null,
  libraryVisible: false,
};

type ModeSchema = 'complete' | 'basic';
const basicColumns = 'modo_app,jogo_ativo';
const allColumns = basicColumns + ',modo_escolhido_em,biblioteca_visivel';

export async function readModePreferences(userId: string): Promise<{ preferences: ModePreferences; schema: ModeSchema }> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Conecte sua conta para salvar as preferências.');
  const read = (columns: string) => client.from('progresso_usuario').select(columns).eq('user_id', userId).maybeSingle();
  let schema: ModeSchema = 'complete';
  let result = await read(allColumns);
  if (result.error && ['42703', 'PGRST204'].includes(result.error.code) &&
      /modo_escolhido_em|biblioteca_visivel/.test(result.error.message)) {
    schema = 'basic';
    result = await read(basicColumns);
  }
  if (result.error) throw new Error('Não foi possível consultar as preferências da conta.');
  const row = result.data as Record<string, unknown> | null;
  return {
    schema,
    preferences: {
      mode: row?.modo_app === 'jogo' ? 'jogo' : 'classico',
      gameEnabled: row?.jogo_ativo !== false,
      chosenAt: typeof row?.modo_escolhido_em === 'string' ? row.modo_escolhido_em : null,
      libraryVisible: row?.biblioteca_visivel === true,
    },
  };
}

export async function writeModePreferences(userId: string, patch: Partial<ModePreferences>, schema: ModeSchema) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Conecte sua conta para salvar as preferências.');
  const fields = {
    ...(patch.mode !== undefined ? { modo_app: patch.mode } : {}),
    ...(patch.gameEnabled !== undefined ? { jogo_ativo: patch.gameEnabled } : {}),
    ...(schema === 'complete' && patch.chosenAt !== undefined ? { modo_escolhido_em: patch.chosenAt } : {}),
    ...(schema === 'complete' && patch.libraryVisible !== undefined ? { biblioteca_visivel: patch.libraryVisible } : {}),
  };
  if (!Object.keys(fields).length) return;
  const { error } = await client.from('progresso_usuario')
    .upsert({ user_id: userId, ...fields }, { onConflict: 'user_id' });
  if (error) throw new Error('A mudança vale nesta sessão. Não foi possível salvar na conta.');
}
