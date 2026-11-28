import { useState } from 'react';
import { Coins, Snowflake } from 'lucide-react';
import { defaultAvatar, oceanHair } from '../../data/avatarOptions';
import type { AvatarConfig } from '../../data/avatarOptions';
import type { PlayAction, PlayState } from '../../learning/playContracts';
import { Personagem } from '../trail/Personagem';
import { trailButton, trailSecondary } from '../trail/TrailDialog';

const previews: Record<string, Partial<AvatarConfig>> = {
  solar: { cima_estilo: 'solar' }, 'coloracao-mar': { cabelo_cor: oceanHair },
  'oculos-cobre': { acessorios: ['oculos-cobre'] }, 'capa-jardim': { acessorios: ['capa-jardim'] },
};

export function PlayShop({ state, busy, run, openAvatar }: {
  state: PlayState; busy: boolean; run: (action: PlayAction) => Promise<boolean>; openAvatar: () => void;
}) {
  const [pets, setPets] = useState(false);
  const evolution = Math.min(5, 1 + Math.floor((state.nivel - 1) / 8));
  return <section className="space-y-4">
    <header className="flex flex-wrap items-start justify-between gap-2">
      <div><h1 className="text-2xl font-black">Loja do personagem</h1><p className="text-sm">FinCoins são virtuais e são ganhas no jogo.</p></div>
      <p className="inline-flex items-center gap-2 rounded-xl bg-amber-100 px-3 py-2 font-bold text-amber-950"><Coins size={18} aria-hidden="true" />{state.moedas} FinCoins</p>
    </header>
    <div className="flex flex-wrap gap-2" aria-label="Categorias da loja">
      <button type="button" className={!pets ? trailButton : trailSecondary} aria-pressed={!pets} onClick={() => setPets(false)}>Roupas e itens</button>
      <button type="button" className={pets ? trailButton : trailSecondary} aria-pressed={pets} onClick={() => setPets(true)}>Companheiros</button>
    </div>
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {state.catalogo.filter(item => pets ? item.tipo === 'pet' : item.tipo !== 'construcao' && item.tipo !== 'pet').map(item => {
        const owned = state.inventario.includes(item.item_id);
        return <li key={item.item_id} className="grid content-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-28 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950">
            {item.tipo === 'pet' ? <img className="h-full w-full object-contain" alt="" loading="lazy" src={'/companheiros/' + item.arte + '.webp'} /> :
              item.tipo === 'congelamento' ? <Snowflake size={38} className="text-sky-800 dark:text-sky-300" aria-hidden="true" /> :
              <Personagem config={{ ...defaultAvatar, ...previews[item.item_id] }} animacao="nenhuma" tamanho={64} />}
          </div>
          <h2 className="font-bold">{item.titulo}</h2><p className="text-sm">{item.descricao}</p>
          {owned ? item.tipo === 'pet' ? <>
            <p className="text-sm">Evolução {evolution} de 5</p>
            <button type="button" className={trailSecondary} disabled={busy || state.pet === item.item_id}
              onClick={() => void run({ type: 'equip', item: item.item_id })}>{state.pet === item.item_id ? 'Companheiro atual' : 'Escolher companheiro'}</button>
          </> : <button type="button" className={trailSecondary} onClick={openAvatar}>Usar no personagem</button> :
            item.item_id === 'capa-jardim' ? <p className="text-sm font-semibold">Conclua a prova do mundo para liberar.</p> :
              <button type="button" className={trailButton} disabled={busy || state.moedas < item.preco || state.nivel < item.nivel}
                onClick={() => void run({ type: 'buy', item: item.item_id, request: crypto.randomUUID() })}>Comprar por {item.preco} FinCoins</button>}
          {item.tipo === 'congelamento' && <p className="text-sm">Proteções disponíveis · {state.congelamentos}</p>}
        </li>;
      })}
    </ul>
  </section>;
}
