import type { AvatarConfig } from '../../data/avatarOptions';
import { backHair, frontHair } from '../../data/avatarShapes';

type Layer = { config: AvatarConfig };

function Corpo({ config }: Layer) {
  return <g fill={config.pele}>
    <path d="M43 82H67V107H43Z" />
    <path d="M36 118L31 145H44L51 116ZM75 118L80 145H67L59 116Z" />
    <ellipse cx="55" cy="55" rx="34" ry="33" />
    <circle cx="23" cy="61" r="7" /><circle cx="87" cy="61" r="7" />
    <path d="M37 93Q26 97 21 119Q20 126 26 127Q30 128 33 122L43 101ZM73 93Q84 97 89 119Q90 126 84 127Q80 128 77 122L67 101Z" />
  </g>;
}

function Rosto({ config }: Layer) {
  const mouths = { sorriso: 'M48 67Q55 76 62 67', feliz: 'M46 65H64Q56 81 46 65Z', animado: 'M47 65Q55 68 63 65Q61 80 54 78Q48 76 47 65Z', tranquilo: 'M51 68Q55 71 59 68' };
  return <g stroke="#322439" strokeWidth="2.5" strokeLinecap="round">
    {config.rosto === 'feliz' ? <path d="M36 57Q40 51 44 57M66 57Q70 51 74 57" fill="none" /> :
      <><ellipse cx="40" cy="56" rx="2" ry="3.1" fill="#322439" /><ellipse cx="70" cy="56" rx="2" ry="3.1" fill="#322439" /></>}
    <path d={mouths[config.rosto]} fill={config.rosto === 'feliz' || config.rosto === 'animado' ? '#8f324b' : 'none'} />
    <path d="M30 64H34M76 64H80" stroke="#de776c" opacity=".7" />
  </g>;
}

function RoupaBaixo({ config }: Layer) {
  const paths = { calca: 'M37 111H73L79 139H65L55 122L45 139H31Z', bermuda: 'M37 111H73L76 131H63L55 123L48 131H34Z', saia: 'M40 110H70L82 132H28Z', short: 'M38 111H72L74 125H59L55 120L51 125H36Z' };
  return <g>
    <path d={paths[config.baixo_estilo]} fill={config.baixo_cor} />
    <path d="M37 140Q31 138 26 146V151H46V140ZM73 140Q79 138 84 146V151H64V140Z" fill={config.calcado_cor} />
    {config.calcado_estilo === 'tenis' && <path d="M28 149H45M65 149H82M34 144H42M67 144H75" stroke="#fff" strokeWidth="2" />}
    {config.calcado_estilo === 'bota' && <path d="M32 134H46V144H31ZM64 134H78L79 144H64Z" fill={config.calcado_cor} />}
    {config.calcado_estilo === 'sandalia' && <path d="M30 145L39 141M71 141L80 145" stroke={config.pele} strokeWidth="3" />}
    {config.calcado_estilo === 'sapato' && <path d="M30 147H44M67 147H81" stroke="#3b2c3b" strokeWidth="2" />}
  </g>;
}

function RoupaCima({ config }: Layer) {
  const base = config.cima_estilo === 'regata' ? 'M39 89Q55 98 71 89L73 119H37Z'
    : config.cima_estilo === 'vestido' ? 'M39 88Q55 98 71 88L82 102L73 109L68 104L83 132H27L42 104L36 109L28 102Z'
    : 'M39 88Q55 97 71 88L85 102L75 110L71 105L74 121H36L39 104L35 110L25 102Z';
  return <g>
    <path d={base} fill={config.cima_cor} />
    {config.cima_estilo === 'moletom' && <path d="M40 90Q55 108 70 90M52 98V108M58 98V108M48 113H62" fill="none" stroke="#fff" strokeWidth="2" opacity=".7" />}
    {config.cima_estilo === 'social' && <path d="M42 91L50 102L55 96L60 102L68 91M55 102V120" fill="none" stroke="#fff" strokeWidth="2" opacity=".75" />}
    {config.cima_estilo === 'jaqueta' && <path d="M48 93L50 120H60L62 93Z" fill="#e7e6f4" />}
    {config.cima_estilo === 'solar' && <path d="M30 102L40 94L55 117L70 94L80 102M55 110V120" fill="none" stroke="#ffd45e" strokeWidth="3" />}
    {config.cima_estilo === 'uniforme' && <path d="M55 98L60 100V105L55 108L50 105V100Z" fill="#ffe195" />}
    {config.cima_estilo === 'armadura' && <path d="M29 100L39 92L48 99L55 112L62 99L71 92L82 100M39 111H71M39 117H71" fill="none" stroke="#ecf3ff" strokeWidth="3" opacity=".7" />}
    {config.cima_estilo === 'vestido' && <path d="M42 108H68" stroke="#fff" opacity=".7" strokeWidth="2" />}
    {config.cima_estilo === 'camiseta' && <path d="M55 99L58 103L55 107L52 103Z" fill="#fff" opacity=".8" />}
  </g>;
}

function Acessorios({ config, behind = false }: Layer & { behind?: boolean }) {
  const has = (item: AvatarConfig['acessorios'][number]) => config.acessorios.includes(item);
  if (behind) return <g>
    {has('capa') && <path fill="#a73661" d="M39 86H71L96 135Q75 149 14 135Z" />}
    {has('capa-jardim') && <path fill="#187759" stroke="#98cb65" strokeWidth="2" d="M39 86H71L97 135Q72 150 13 134ZM27 131Q70 116 82 133" />}
    {has('mochila') && <rect x="26" y="91" width="57" height="35" rx="13" fill="#bc7944" />}
  </g>;
  return <g>
    {has('oculos') && <path d="M32 51H48V62H32ZM62 51H78V62H62ZM48 54H62" fill="none" stroke="#31304a" strokeWidth="2.8" strokeLinejoin="round" />}
    {has('oculos-cobre') && <path d="M32 56A8 7 0 0 0 48 56A8 7 0 0 0 32 56ZM62 56A8 7 0 0 0 78 56A8 7 0 0 0 62 56ZM48 55Q55 49 62 55" fill="none" stroke="#9e482f" strokeWidth="2.5" />}
    {has('fone') && <g fill="#36304e"><path d="M20 51Q17 17 55 16Q94 17 90 51" fill="none" stroke="#36304e" strokeWidth="5" /><rect x="16" y="49" width="9" height="18" rx="4" /><rect x="85" y="49" width="9" height="18" rx="4" /></g>}
    {has('bone') && <path fill="#318bb6" d="M19 36Q19 11 55 11Q85 11 88 36L104 42Q99 50 74 43Z" />}
    {has('chapeu') && <path fill="#896145" d="M14 34L29 29L36 10H74L82 28L97 34L93 41H16Z" />}
    {has('coroa') && <path fill="#ffd563" stroke="#bf842b" strokeWidth="2" d="M32 10L45 19L55 5L65 19L78 10L74 33H36Z" />}
    {has('mochila') && <path d="M39 92L43 113M71 92L67 113" stroke="#bc7944" strokeWidth="3" strokeLinecap="round" />}
  </g>;
}

export function Personagem({ config, tamanho = 82, animacao = 'parado' }: {
  config: AvatarConfig; tamanho?: number; animacao?: 'parado' | 'andando' | 'comemorando' | 'nenhuma';
}) {
  return <svg className={'trail-avatar trail-avatar-' + animacao} width={tamanho} height={tamanho * 1.4}
    viewBox="0 0 110 154" aria-hidden="true" focusable="false">
    <Acessorios config={config} behind />
    <path d={backHair[config.cabelo_estilo]} fill={config.cabelo_cor} />
    <Corpo config={config} />
    <g className="trail-avatar-steps"><RoupaBaixo config={config} /></g>
    <RoupaCima config={config} />
    <Rosto config={config} />
    <path d={frontHair[config.cabelo_estilo]} fill={config.cabelo_cor} />
    <Acessorios config={config} />
  </svg>;
}
