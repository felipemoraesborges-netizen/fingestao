import { Check, Flag, Lock } from 'lucide-react';
import type { AvatarConfig } from '../../data/avatarOptions';
import { productIcon } from '../../data/achievementIcons';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { TrailProduct } from '../../utils/trail';
import { Personagem } from './Personagem';
import { ProductArt } from './ProductArt';

export function TrailHouse({ house, product, x, y, current, passed, walking, avatar, onAvatar, onProduct, highlighted }: {
  house: number; product?: TrailProduct; x: number; y: number; current: boolean; passed: boolean;
  walking: boolean; avatar: AvatarConfig; onAvatar: () => void; onProduct: (product: TrailProduct) => void; highlighted: boolean;
}) {
  const milestone = house > 0 && house % 10 === 0;
  const locked = product && !product.achievement && !passed;
  const skin = 'trail-house ' + (current || passed || product?.achievement ? 'trail-house-passed ' : '') +
    (product ? 'trail-house-product ' : '') + (milestone ? 'trail-house-milestone ' : '') + (highlighted ? 'trail-house-highlight ' : '');
  const name = 'Casa ' + house.toLocaleString('pt-BR');
  return <div className="trail-house-anchor" style={{ left: x + '%', top: y }} data-trail-current={current || undefined}>
    {product ? <button type="button" className={skin} onClick={() => onProduct(product)}
      aria-label={name + ' · ' + product.goal.nome + (locked ? ' · bloqueada' : '')}>
      <ProductArt url={product.goal.imagemUrl} icon={productIcon(product.goal.nome, product.goal.categoria)}
        className={'rounded-full ' + (locked ? 'grayscale opacity-55' : '')} />
      <span className="trail-product-number">{house.toLocaleString('pt-BR')}</span>
      {locked && <Lock size={15} className="trail-house-tag" />}
      {product.achievement && <Check size={15} className="trail-house-tag text-emerald-700" />}
      {milestone && <Flag size={14} className="trail-milestone-tag" />}
    </button> : <div aria-label={name + (current ? ' · posição atual' : milestone ? ' · marco de 15 XP' : '')}
      aria-current={current ? 'step' : undefined} className={skin}>
      {milestone && <Flag size={16} />}
      <span>{house.toLocaleString('pt-BR')}</span>
    </div>}
    {product && <button type="button" className={'trail-product-label ' + (x > 50 ? 'trail-label-left' : 'trail-label-right')}
      onClick={() => onProduct(product)}>
      <span className="line-clamp-2 font-bold">{product.goal.nome}</span>
      <span className="text-xs opacity-75">{formatCurrency(product.goal.preco)}</span>
      {product.expectedOn && <span className="block text-xs opacity-75">Prev. {formatDate(product.expectedOn)}</span>}
    </button>}
    {milestone && current && walking && <span key={house} className="trail-milestone-pop">Marco da trilha</span>}
    {current && <button type="button" className="trail-map-avatar" title="Editar personagem" aria-label="Editar personagem"
      onClick={onAvatar}><Personagem config={avatar} tamanho={58} animacao={walking ? 'andando' : 'parado'} /></button>}
  </div>;
}
