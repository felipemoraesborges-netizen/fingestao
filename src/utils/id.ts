/**
 * Utilitário central para geração e validação de UUIDs (v4)
 * Garante compatibilidade total com colunas UUID no PostgreSQL / Supabase.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Verifica se uma string possui o formato canônico de UUID v4.
 */
export function isValidUUID(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  return UUID_REGEX.test(value.trim());
}

/**
 * Gera um UUID v4 canônico utilizando crypto.randomUUID() nativo do navegador/ambiente.
 * Possui fallback RFC4122 v4 determinístico caso o ambiente não suporte crypto.randomUUID().
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Garante que o ID seja um UUID válido.
 * Se o ID já for um UUID válido, retorna-o inalterado.
 * Se for um ID antigo/legado (ex: "goal-1795458559005-ytdm", "cat-alimentacao", "folder-praia"),
 * gera e retorna um novo UUID v4 válido.
 */
export function ensureUUID(value?: string | null): string {
  if (isValidUUID(value)) {
    return value!.trim();
  }
  return generateUUID();
}
