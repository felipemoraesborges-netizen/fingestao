export interface StatementRow {
  date: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  reference: string;
}

const canonical = (value: string) => value.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');

function checkDate(value: string) {
  const local = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  const iso = local ? local[3] + '-' + local[2] + '-' + local[1] : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const epoch = Date.parse(iso + 'T00:00:00Z');
  return Number.isFinite(epoch) && new Date(epoch).toISOString().slice(0, 10) === iso ? iso : '';
}

function amountIn(value: string) {
  const raw = value.replace(/\s|R\$/gi, '');
  const decimal = raw.includes(',') ? raw.replaceAll('.', '').replace(',', '.') : raw;
  return /^[+-]?\d+(?:\.\d{1,2})?$/.test(decimal) ? Number(decimal) : Number.NaN;
}

function row(dateStr: string, description: string, value: number, type: string, category: string, ref: string): StatementRow | null {
  const date = checkDate(dateStr);
  const clean = description.replace(/\s+/g, ' ').trim();
  const kind = ['receita', 'income', 'credito'].includes(type) ? 'income' : ['despesa', 'expense', 'debito'].includes(type) ? 'expense'
    : type ? null : value > 0 ? 'income' : 'expense';
  if (!date || !clean || clean.length > 250 || !Number.isFinite(value) || value === 0 || Math.abs(value) > 9999999999.99 || !kind) return null;
  return { date, description: clean, amount: Math.abs(value), type: kind, category: category.trim(), reference: ref };
}

function scanCsv(content: string, delimiter: string) {
  const parsed: string[][] = [];
  let columns: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < content.length; index++) {
    const char = content[index];
    if (char === '"') {
      if (quoted && content[index + 1] === '"') { field += '"'; index++; }
      else if (quoted || !field) quoted = !quoted;
      else field += char;
    } else if (!quoted && (char === delimiter || char === '\n' || char === '\r')) {
      columns.push(field);
      field = '';
      if (char !== delimiter) {
        if (char === '\r' && content[index + 1] === '\n') index++;
        parsed.push(columns);
        columns = [];
      }
    } else field += char;
  }
  if (quoted) throw new Error('Há um campo entre aspas sem fechamento.');
  if (columns.length || field) parsed.push([...columns, field]);
  return parsed;
}

function parseCsv(content: string) {
  const header = content.split(/\r?\n/).find(line => /^["\s]*data["\s]*[;,]/i.test(line.trim()));
  const delimiter = header?.includes(';') ? ';' : ',';
  const records = scanCsv(content, delimiter);
  const headerIndex = records.findIndex(cells => canonical(cells[0]) === 'data' && cells.some(col => canonical(col).startsWith('valor')));
  if (headerIndex < 0) throw new Error('O CSV precisa ter as colunas Data, Descrição e Valor.');
  const fields = records[headerIndex].map(canonical);
  const date = fields.indexOf('data'), description = fields.indexOf('descricao'), amount = fields.findIndex(label => label.startsWith('valor'));
  if (description < 0 || amount < 0) throw new Error('O CSV precisa ter as colunas Data, Descrição e Valor.');
  const category = fields.indexOf('categoria'), type = fields.indexOf('tipo');
  return records.slice(headerIndex + 1).filter(cells => cells.some(Boolean)).map(cells =>
    row(cells[date]?.trim() ?? '', cells[description] ?? '', amountIn(cells[amount] ?? ''), canonical(cells[type] ?? ''), cells[category] ?? '', ''));
}

function parseOfx(content: string) {
  const read = (block: string, tag: string) => new RegExp('<' + tag + '\\s*>\\s*([^<\\r\\n]+)', 'i').exec(block)?.[1].trim() ?? '';
  const account = read(content, 'ACCTID');
  const bank = read(content, 'BANKID') || read(content, 'ORG');
  const entries = [...content.matchAll(/<STMTTRN\b[^>]*>([\s\S]*?)(?=<\/STMTTRN>|<STMTTRN\b|<\/BANKTRANLIST>)/gi)];
  if (!entries.length) throw new Error('O OFX não contém lançamentos reconhecíveis.');
  return entries.map(([, item]) => {
    const date = read(item, 'DTPOSTED').slice(0, 8).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');
    const reference = read(item, 'FITID');
    const description = [read(item, 'NAME'), read(item, 'MEMO')].filter(Boolean).join(' · ')
      .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
    return row(date, description || 'Movimentação do extrato', amountIn(read(item, 'TRNAMT')), '', '',
      reference && (account || bank) ? 'ofx:' + JSON.stringify([bank, account, reference]) : '');
  });
}

export function parseStatement(content: string, format: 'csv' | 'ofx') {
  const records = format === 'ofx' ? parseOfx(content) : parseCsv(content.replace(/^\uFEFF/, ''));
  if (records.length > 500) throw new Error('Divida o arquivo em extratos de até 500 linhas.');
  const valid = records.filter(item => item !== null);
  if (!valid.length) throw new Error('Nenhuma movimentação válida encontrada.');
  return { valid, ignored: records.length - valid.length };
}

export async function statementKeys(rows: StatementRow[]) {
  const repetitions = new Map<string, number>();
  return Promise.all(rows.map(async entry => {
    const canonicalRow = JSON.stringify([entry.date, entry.amount, entry.type, canonical(entry.description)]);
    const count = (repetitions.get(canonicalRow) ?? 0) + 1;
    repetitions.set(canonicalRow, count);
    const material = new TextEncoder().encode(entry.reference || canonicalRow + ':' + count);
    const digest = await crypto.subtle.digest('SHA-256', material);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }));
}
