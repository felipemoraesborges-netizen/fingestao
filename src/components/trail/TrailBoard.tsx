import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, LocateFixed } from 'lucide-react';
import type { AvatarConfig } from '../../data/avatarOptions';
import type { TrailProduct } from '../../utils/trail';
import { TrailHouse } from './TrailHouse';
import { trailSecondary } from './TrailDialog';

const pageSize = 28;
const pitch = 92;
const padding = 120;
const lanes = [46, 56, 64, 69, 64, 55, 44, 36, 31, 36];

export function TrailBoard({ products, house, target, avatar, onAvatar, onProduct, highlight }: {
  products: TrailProduct[]; house: number; target: number; avatar: AvatarConfig;
  onAvatar: () => void; onProduct: (product: TrailProduct) => void; highlight?: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{ page: number; target: number }>();
  const manualPage = selection?.target === target ? selection.page : undefined;
  const lastHouse = Math.max(target + 12, products.at(-1)?.house ?? 0, 12);
  const characterPage = Math.floor(house / pageSize);
  const lastPage = Math.floor(lastHouse / pageSize);
  const page = Math.min(lastPage, manualPage ?? characterPage);
  const first = page * pageSize;
  const last = Math.min(first + pageSize - 1, lastHouse);
  const points = Array.from({ length: last - first + 1 }, (_, index) => {
    const number = last - index;
    return { number, x: lanes[number % lanes.length], y: padding + index * pitch };
  });
  const height = 2 * padding + (points.length - 1) * pitch;
  const byHouse = new Map(products.filter(item => item.house >= first && item.house <= last).map(item => [item.house, item]));
  const line = points.reduce((path, point, index) => {
    const previous = points[index - 1];
    if (!previous) return 'M' + point.x + ',' + point.y;
    const middle = (point.y + previous.y) / 2;
    return path + ' C' + previous.x + ',' + middle + ' ' + point.x + ',' + middle + ' ' + point.x + ',' + point.y;
  }, '');

  useLayoutEffect(() => {
    if (selection && selection.target !== target) setSelection(undefined);
  }, [selection, target]);

  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    if (manualPage !== undefined) {
      element.scrollTop = 0;
      return;
    }
    const node = element.querySelector<HTMLElement>('[data-trail-current]');
    if (node) element.scrollTop = node.offsetTop - element.clientHeight * .55;
  }, [house, page, manualPage, last]);

  const focusAvatar = () => {
    setSelection(undefined);
    const element = viewport.current;
    const node = element?.querySelector<HTMLElement>('[data-trail-current]');
    if (node && element) element.scrollTop = node.offsetTop - element.clientHeight * .55;
  };

  return <section className="overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-sm dark:border-violet-900 dark:bg-slate-900" aria-label="Tabuleiro de conquistas">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-100 p-3 dark:border-violet-900">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={trailSecondary} onClick={() => setSelection({ page: page + 1, target })} disabled={page >= lastPage}><ArrowUp size={16} /> Adiante</button>
        <button type="button" className={trailSecondary} onClick={() => setSelection({ page: page - 1, target })} disabled={page === 0}><ArrowDown size={16} /> Voltar</button>
      </div>
      <button type="button" className={trailSecondary} onClick={focusAvatar}><LocateFixed size={16} /> Ir para o boneco</button>
    </div>
    <div className="trail-map" ref={viewport} tabIndex={0} aria-label={'Casas ' + first + ' a ' + last}>
      <div className="trail-map-inner" style={{ height }}>
        <svg viewBox={'0 0 100 ' + height} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <path d={line} className="trail-line" vectorEffect="non-scaling-stroke" />
        </svg>
        {points.map(point => {
          const product = byHouse.get(point.number);
          return <TrailHouse key={point.number} house={point.number} product={product} x={point.x} y={point.y}
            current={point.number === house} passed={point.number <= house} walking={house !== target}
            avatar={avatar} onAvatar={onAvatar} onProduct={onProduct} highlighted={Boolean(product && product.goal.id === highlight)} />;
        })}
      </div>
    </div>
  </section>;
}
