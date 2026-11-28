export const skinColors = ['#fbe0c9', '#f6c9a7', '#e9aa80', '#ce8d64', '#ac6649', '#87503b', '#633a30', '#422924'];
export const oceanHair = '#08768d';
export const hairColors = ['#22202c', '#513327', '#815640', '#dbad56', '#b84e25', '#a29ba8', '#eee9f1', '#385bd6', '#d74788', '#813dc6', '#359866', '#d62c37', oceanHair];
export const clothingColors = ['#6152d8', '#217a91', '#2a915f', '#2670b9', '#dd803d', '#bf3c64', '#e4bf55', '#343956', '#eeeeff'];

export const hairStyles = {
  curto: 'Curto', raspado: 'Raspado', social: 'Social', moicano: 'Moicano', topete: 'Topete',
  cacheado: 'Cacheado', black: 'Black power', crespo: 'Crespo volumoso', liso: 'Longo liso',
  ondulado: 'Longo ondulado', longo: 'Cacheado longo', rabo: 'Rabo de cavalo', coque: 'Coque',
  trancas: 'Tranças', maria: 'Maria-chiquinha', careca: 'Careca',
};
export const topStyles = {
  camiseta: 'Camiseta', regata: 'Regata', moletom: 'Moletom', social: 'Camisa social', jaqueta: 'Jaqueta',
  vestido: 'Vestido', uniforme: 'Uniforme', armadura: 'Armadura', solar: 'Jaqueta solar',
};
export const bottomStyles = { calca: 'Calça', bermuda: 'Bermuda', saia: 'Saia', short: 'Short' };
export const shoeStyles = { tenis: 'Tênis', bota: 'Bota', sandalia: 'Sandália', sapato: 'Sapato' };
export const accessories = { oculos: 'Óculos', bone: 'Boné', chapeu: 'Chapéu', fone: 'Fone', mochila: 'Mochila', capa: 'Capa', coroa: 'Coroa', 'oculos-cobre': 'Óculos de cobre', 'capa-jardim': 'Capa jardim' };
export const faces = { sorriso: 'Sorriso', feliz: 'Feliz', animado: 'Animado', tranquilo: 'Tranquilo' };
export const unlockableItems = { armadura: 'Armadura', capa: 'Capa', coroa: 'Coroa', cabeloRaro: 'Cabelo roxo' };

export interface AvatarConfig {
  pele: string;
  cabelo_estilo: keyof typeof hairStyles;
  cabelo_cor: string;
  cima_estilo: keyof typeof topStyles;
  cima_cor: string;
  baixo_estilo: keyof typeof bottomStyles;
  baixo_cor: string;
  calcado_estilo: keyof typeof shoeStyles;
  calcado_cor: string;
  acessorios: (keyof typeof accessories)[];
  rosto: keyof typeof faces;
}

export const defaultAvatar: AvatarConfig = {
  pele: skinColors[2], cabelo_estilo: 'curto', cabelo_cor: hairColors[1],
  cima_estilo: 'moletom', cima_cor: clothingColors[0], baixo_estilo: 'calca',
  baixo_cor: '#41496a', calcado_estilo: 'tenis', calcado_cor: '#eeedff', acessorios: [], rosto: 'sorriso',
};

function option<Options extends Record<string, string>>(value: unknown, options: Options, fallback: keyof Options): keyof Options {
  return typeof value === 'string' && Object.hasOwn(options, value) ? value : fallback;
}

function color(value: unknown, fallback: string) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
}

export function validateAvatar(raw: unknown): AvatarConfig {
  const value = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const supported = Array.isArray(value.acessorios) ? value.acessorios.filter(
    (item): item is keyof typeof accessories => typeof item === 'string' && Object.hasOwn(accessories, item)
  ) : [];
  return {
    pele: color(value.pele, defaultAvatar.pele),
    cabelo_estilo: option(value.cabelo_estilo, hairStyles, defaultAvatar.cabelo_estilo),
    cabelo_cor: color(value.cabelo_cor, defaultAvatar.cabelo_cor),
    cima_estilo: option(value.cima_estilo, topStyles, defaultAvatar.cima_estilo),
    cima_cor: color(value.cima_cor, defaultAvatar.cima_cor),
    baixo_estilo: option(value.baixo_estilo, bottomStyles, defaultAvatar.baixo_estilo),
    baixo_cor: color(value.baixo_cor, defaultAvatar.baixo_cor),
    calcado_estilo: option(value.calcado_estilo, shoeStyles, defaultAvatar.calcado_estilo),
    calcado_cor: color(value.calcado_cor, defaultAvatar.calcado_cor),
    acessorios: [...new Set(supported)], rosto: option(value.rosto, faces, defaultAvatar.rosto),
  };
}

export function limitAvatar(config: AvatarConfig, locks: Record<string, string>) {
  return {
    ...config,
    cabelo_cor: (locks.cabeloRaro && config.cabelo_cor === '#813dc6') || (locks['coloracao-mar'] && config.cabelo_cor === oceanHair) ? defaultAvatar.cabelo_cor : config.cabelo_cor,
    cima_estilo: locks[config.cima_estilo] ? defaultAvatar.cima_estilo : config.cima_estilo,
    acessorios: config.acessorios.filter(item => !locks[item]),
  };
}
