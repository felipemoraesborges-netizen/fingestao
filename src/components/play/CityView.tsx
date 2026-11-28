import { useEffect, useId, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Coins, Minus, Plus } from 'lucide-react';
import { citySize, cityStages, houseStages, treeStages } from '../../learning/playContracts';
import type { PlayAction, PlayState } from '../../learning/playContracts';
import { trailButton, trailSecondary } from '../trail/TrailDialog';

const artPath = (key: string) => '/cidade/' + key + '.webp';
const panel = 'space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900';
const maxStage = 3;

export function CityView({ state, busy, run, onStudy }: {
  state: PlayState; busy: boolean; run: (action: PlayAction) => Promise<boolean>; onStudy: (id: string) => void;
}) {
  const [selected, setSelected] = useState({ row: 0, col: 0 });
  const [itemId, setItemId] = useState('');
  const [moving, setMoving] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const canvas = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const catalogId = useId();
  const cellFocus = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);
  const size = citySize(state.nivel);
  const homeStage = Math.min(10, 1 + Math.floor((state.nivel - 1) / 10));
  const home = selected.row === 0 && selected.col === 0;
  const map = new Map(state.construcoes.map(plot => [plot.linha + ':' + plot.coluna, plot]));
  const items = new Map(state.catalogo.map(item => [item.item_id, item]));
  const occupied = new Set(state.construcoes.map(item => item.item_id));
  const selectedBuilding = map.get(selected.row + ':' + selected.col);
  const chosen = selectedBuilding ? items.get(selectedBuilding.item_id) : undefined;
  const available = state.catalogo.filter(item => item.tipo === 'construcao' && !occupied.has(item.item_id));
  const candidate = available.find(item => item.item_id === itemId) ?? available.find(item => item.nivel <= state.nivel);
  const city = cityStages.find(stage => state.nivel >= stage.level)?.name;
  const mapWidth = (size - 1) * 164 + 188;
  const mapHeight = (size - 1) * 94 + 175;

  useEffect(() => {
    if (canvas.current) canvas.current.scrollLeft = Math.max(0, (canvas.current.scrollWidth - canvas.current.clientWidth) / 2);
  }, [size]);
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    cellFocus.current?.focus();
  }, [selected]);

  function changeZoom(amount: number) {
    setZoom(scale => Math.max(0.65, Math.min(1.5, Math.round((scale + amount) * 100) / 100)));
  }

  function selectAdjacent(key: string, row: number, col: number) {
    const next = { row: Math.max(0, Math.min(size - 1, row)), col: Math.max(0, Math.min(size - 1, col)) };
    if (next.row === selected.row && next.col === selected.col) return;
    if (key) moveFocus.current = true;
    setSelected(next);
  }

  return <section aria-labelledby={titleId} className="space-y-4">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 id={titleId} className="text-2xl font-black">Minha cidade</h1><p>{city} · Nível {state.nivel}</p></div>
      <p className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 font-bold text-amber-950"><Coins size={18} aria-hidden="true" />{state.moedas} FinCoins</p>
    </header>
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(16rem,1fr)]">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2" aria-label="Controles do mapa">
          <button type="button" className={trailSecondary} aria-label="Afastar mapa" disabled={zoom === 0.65} onClick={() => changeZoom(-0.15)}><Minus size={18} aria-hidden="true" /></button>
          <output aria-label="Zoom do mapa" className="min-w-12 text-center text-sm">{Math.round(zoom * 100)}%</output>
          <button type="button" className={trailSecondary} aria-label="Aproximar mapa" disabled={zoom === 1.5} onClick={() => changeZoom(0.15)}><Plus size={18} aria-hidden="true" /></button>
          {([{ label: 'Mover mapa para a esquerda', Icon: ArrowLeft, dx: -140, dy: 0 },
            { label: 'Mover mapa para a direita', Icon: ArrowRight, dx: 140, dy: 0 },
            { label: 'Mover mapa para cima', Icon: ArrowUp, dx: 0, dy: -140 },
            { label: 'Mover mapa para baixo', Icon: ArrowDown, dx: 0, dy: 140 }]).map(({ label, Icon, dx, dy }) =>
            <button key={label} type="button" className={trailSecondary} aria-label={label} onClick={() => canvas.current?.scrollBy(dx, dy)}><Icon size={18} aria-hidden="true" /></button>)}
        </div>
        <div ref={canvas} aria-label="Mapa de terrenos" role="region"
          className="isolate h-[min(68vh,37rem)] min-h-64 w-full overflow-auto rounded-2xl border border-emerald-700 bg-linear-to-b from-sky-100 via-emerald-100 to-lime-200 dark:border-emerald-800 dark:from-sky-950 dark:via-emerald-950 dark:to-green-950">
          <div className="relative mx-auto" style={{ width: mapWidth * zoom, height: mapHeight * zoom }}>
            <div className="absolute left-0 top-0 origin-top-left" style={{ width: mapWidth, height: mapHeight, transform: 'scale(' + zoom + ')' }}>
              {Array.from({ length: size * size }, (_, index) => {
                const row = Math.floor(index / size);
                const col = index % size;
                const coordinate = row + ':' + col;
                const building = map.get(coordinate);
                const item = building ? items.get(building.item_id) : undefined;
                const isHome = index === 0;
                const active = selected.row === row && selected.col === col;
                const property = isHome ? houseStages[homeStage - 1] : item?.titulo ?? 'Terreno livre';
                const asset = isHome ? 'casa-' + homeStage : item?.arte;
                return <button type="button" key={coordinate} tabIndex={active ? 0 : -1} ref={active ? cellFocus : undefined}
                  aria-label={property + ', terreno ' + (row + 1) + ', ' + (col + 1)} aria-pressed={active}
                  onClick={() => setSelected({ row, col })}
                  onKeyDown={event => {
                    const keys: Record<string, [number, number]> = { ArrowUp: [row - 1, col], ArrowDown: [row + 1, col], ArrowLeft: [row, col - 1], ArrowRight: [row, col + 1] };
                    const target = keys[event.key];
                    if (target) { event.preventDefault(); selectAdjacent(event.key, ...target); }
                  }}
                  className="absolute flex h-31 w-37 -translate-x-1/2 -translate-y-[82%] items-end focus-visible:z-100 focus-visible:rounded focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky-800 dark:focus-visible:outline-sky-200"
                  style={{ left: mapWidth / 2 + (col - row) * 82, top: 134 + (col + row) * 47, zIndex: active ? 80 : row + col + 1 }}>
                  <span aria-hidden="true" className={'absolute inset-x-0 bottom-0 h-19 [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)] ' + (active ? 'bg-amber-400' : 'bg-emerald-600/65 dark:bg-emerald-800')} />
                  {asset ? <img src={artPath(asset)} alt="" draggable={false} className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-full w-full object-contain object-bottom drop-shadow-md"
                    style={{ scale: 1 + 0.09 * ((building?.melhoria ?? 1) - 1), transformOrigin: 'bottom center' }} /> :
                    <span className="pointer-events-none absolute inset-x-0 bottom-2 h-15 bg-emerald-200/80 [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)] dark:bg-emerald-700/70" />}
                </button>;
              })}
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">Use as setas do teclado dentro do mapa para mudar de terreno.</p>
      </div>
      <aside className={panel} aria-label="Detalhes do terreno">
        {moving && <div role="status" className="space-y-2 rounded-lg bg-amber-100 p-3 text-amber-950">
          <p>Selecione o terreno de destino.</p>
          <button type="button" className={trailSecondary} onClick={() => setMoving(undefined)}>Cancelar mudança</button>
        </div>}
        {home ? <>
          <h2 className="font-bold">{houseStages[homeStage - 1]}</h2>
          <p>Residência · estágio {homeStage} de 10</p>
          {homeStage < houseStages.length && <p className="text-sm">Próxima residência no nível {homeStage * 10 + 1} da cidade.</p>}
        </> : chosen && selectedBuilding ? <>
          <h2 className="font-bold">{chosen.titulo}</h2><p>{chosen.descricao}</p>
          <p>Nível da construção {selectedBuilding.melhoria} de {maxStage}</p>
          <div className="flex flex-wrap gap-2">
            {chosen.licao_id && <button type="button" className={trailSecondary} onClick={() => chosen.licao_id && onStudy(chosen.licao_id)}>Abrir lição</button>}
            <button type="button" className={trailSecondary} disabled={busy} onClick={() => setMoving(selectedBuilding.id)}>Mover construção</button>
            {selectedBuilding.melhoria < maxStage && <button type="button" className={trailButton}
              disabled={busy || state.nivel < selectedBuilding.melhoria * 5 || state.moedas < (selectedBuilding.melhoria + 1) * 8}
              onClick={() => void run({ type: 'upgrade', id: selectedBuilding.id, tier: selectedBuilding.melhoria + 1, request: crypto.randomUUID() })}>
              Melhorar · {(selectedBuilding.melhoria + 1) * 8} FinCoins
            </button>}
          </div>
        </> : <>
          <h2 className="font-bold">Terreno livre · {selected.row + 1}, {selected.col + 1}</h2>
          {moving ? <button type="button" className={trailButton} disabled={busy} onClick={() => void run({
            type: 'move', id: moving, ...selected, request: crypto.randomUUID(),
          }).then(success => { if (success) setMoving(undefined); })}>Mover para cá</button> : <>
            <label className="block text-sm font-semibold" htmlFor={catalogId}>Construção</label>
            <select id={catalogId} className="w-full rounded-xl border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950"
              value={candidate?.item_id ?? ''} onChange={event => setItemId(event.currentTarget.value)}>
              <option value="" disabled>Escolha um prédio</option>
              {available.map(item => <option key={item.item_id} value={item.item_id}>{item.titulo} · nível {item.nivel} · {item.preco} FinCoins</option>)}
            </select>
            {candidate && <><p>{candidate.descricao}</p>
              {candidate.arte && <img src={artPath(candidate.arte)} className="h-28 w-full object-contain" alt="" />}
              <button type="button" className={trailButton} disabled={busy || state.nivel < candidate.nivel || state.moedas < candidate.preco}
                onClick={() => void run({ type: 'build', item: candidate.item_id, ...selected, request: crypto.randomUUID() })}>{candidate.preco ? 'Construir · ' + candidate.preco + ' FinCoins' : 'Construir sem custo'}</button></>}
          </>}
        </>}
      </aside>
    </div>
    <section className={panel}>
      <div className="grid items-center gap-3 sm:grid-cols-[auto_1fr]">
        <img className="mx-auto h-32 w-40 object-contain motion-safe:transition-transform motion-safe:hover:scale-105"
          src={'/cidade/arvore-' + state.arvore + '.webp'} alt="" loading="lazy" />
        <div><h2 className="text-lg font-bold">Árvore da Prosperidade</h2>
          <p>{treeStages[state.arvore - 1]} · estágio {state.arvore} de 10</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Ela cresce com lições, provas e desafios. O progresso conquistado permanece quando você faz uma pausa.</p>
        </div>
      </div>
    </section>
  </section>;
}
