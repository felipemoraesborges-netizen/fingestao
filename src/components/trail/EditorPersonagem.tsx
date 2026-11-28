import { useState } from 'react';
import { Lock, Shuffle } from 'lucide-react';
import { accessories, bottomStyles, clothingColors, defaultAvatar, faces, hairColors, hairStyles, limitAvatar, oceanHair, shoeStyles, skinColors, topStyles } from '../../data/avatarOptions';
import type { AvatarConfig } from '../../data/avatarOptions';
import { ColorPicker } from './ColorPicker';
import { Personagem } from './Personagem';
import { TrailDialog, trailButton, trailSecondary } from './TrailDialog';

function Options<Key extends string>({ label, options, value, preview, onChange, locks = {} }: {
  label: string; options: Record<Key, string>; value: Key; preview: (key: Key) => AvatarConfig;
  onChange: (key: Key) => void; locks?: Record<string, string>;
}) {
  return <fieldset>
    <legend className="mb-2 text-sm font-semibold">{label}</legend>
    <div className="grid grid-cols-[repeat(auto-fill,minmax(5.4rem,1fr))] gap-2">
      {(Object.keys(options) as Key[]).map(key =>
        <button key={key} type="button" aria-pressed={key === value} disabled={Boolean(locks[key])} onClick={() => onChange(key)}
          className={trailSecondary + ' flex-col gap-0 text-xs ' + (key === value ? 'ring-2 ring-violet-500' : '')}>
          <Personagem config={preview(key)} tamanho={28} animacao="nenhuma" />
          {options[key]}{locks[key] && <span className="flex items-center gap-1"><Lock size={11} />{locks[key]}</span>}
        </button>)}
    </div>
  </fieldset>;
}

export function EditorPersonagem({ initial, saved, locks, onSave, onClose }: {
  initial: AvatarConfig; saved: AvatarConfig[]; locks: Record<string, string>;
  onSave: (config: AvatarConfig, looks: AvatarConfig[]) => Promise<void>; onClose: () => void;
}) {
  const tabs = ['Pele', 'Cabelo', 'Roupas', 'Acessórios', 'Rosto'] as const;
  const [tab, setTab] = useState<typeof tabs[number]>('Pele');
  const [config, setConfig] = useState(initial);
  const [looks, setLooks] = useState(saved);
  const [walking, setWalking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const update = (fields: Partial<AvatarConfig>) => setConfig(value => ({ ...value, ...fields }));
  const choose = <Value,>(values: Value[]) => values[Math.floor(Math.random() * values.length)];
  const randomize = () => setConfig(limitAvatar({
    ...defaultAvatar, pele: choose(skinColors), cabelo_cor: choose(hairColors),
    cabelo_estilo: choose(Object.keys(hairStyles) as AvatarConfig['cabelo_estilo'][]),
    rosto: choose(Object.keys(faces) as AvatarConfig['rosto'][]),
    cima_estilo: choose(Object.keys(topStyles) as AvatarConfig['cima_estilo'][]),
    baixo_estilo: choose(Object.keys(bottomStyles) as AvatarConfig['baixo_estilo'][]),
    calcado_estilo: choose(Object.keys(shoeStyles) as AvatarConfig['calcado_estilo'][]),
    cima_cor: choose(clothingColors), baixo_cor: choose(clothingColors), calcado_cor: choose(clothingColors),
  }, locks));
  const save = async () => {
    setBusy(true);
    setError('');
    try { await onSave(limitAvatar(config, locks), looks); onClose(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar.'); }
    finally { setBusy(false); }
  };
  const clothing = [
    { label: 'Roupa de cima', field: 'cima_estilo', color: 'cima_cor', items: topStyles },
    { label: 'Roupa de baixo', field: 'baixo_estilo', color: 'baixo_cor', items: bottomStyles },
    { label: 'Calçado', field: 'calcado_estilo', color: 'calcado_cor', items: shoeStyles },
  ] as const;

  return <TrailDialog title="Meu Personagem" wide busy={busy} onClose={onClose}>
    <div className="grid gap-5 sm:grid-cols-[150px_1fr]">
      <div className="flex flex-col items-center justify-center gap-2 rounded-3xl bg-violet-100 p-3 dark:bg-violet-950/50 sm:self-start">
        <Personagem config={config} tamanho={100} animacao={walking ? 'andando' : 'parado'} />
        <button className={trailSecondary} type="button" onClick={() => setWalking(!walking)}>{walking ? 'Parar animação' : 'Ver caminhada'}</button>
      </div>
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap gap-2" aria-label="Categorias de personalização">
          {tabs.map(item => <button type="button" key={item} aria-pressed={tab === item} className={tab === item ? trailButton : trailSecondary} onClick={() => setTab(item)}>{item}</button>)}
        </div>
        <div className="space-y-4">
          {tab === 'Pele' && <ColorPicker label="Tom de pele" value={config.pele} palette={skinColors} onChange={pele => update({ pele })} />}
          {tab === 'Cabelo' && <>
            <Options label="Estilo" options={hairStyles} value={config.cabelo_estilo} preview={cabelo_estilo => ({ ...config, cabelo_estilo })} onChange={cabelo_estilo => update({ cabelo_estilo })} />
            <ColorPicker label="Cor do cabelo" value={config.cabelo_cor} palette={hairColors} onChange={cabelo_cor => update({ cabelo_cor })}
              blocked={{ ...(locks.cabeloRaro ? { '#813dc6': 'Desbloqueia em ' + locks.cabeloRaro } : {}),
                ...(locks['coloracao-mar'] ? { [oceanHair]: locks['coloracao-mar'] } : {}) }} />
            {locks.cabeloRaro && <p className="text-xs">🔒 Cabelo roxo · {locks.cabeloRaro}</p>}
          </>}
          {tab === 'Roupas' && clothing.map(({ label, field, color, items }) => <div key={field} className="space-y-2">
            <Options label={label} options={items as Record<string, string>} value={config[field]} locks={locks}
              preview={item => ({ ...config, [field]: item })} onChange={item => update({ [field]: item })} />
            <ColorPicker label={'Cor · ' + label.toLowerCase()} value={config[color]} palette={clothingColors} onChange={value => update({ [color]: value })} />
          </div>)}
          {tab === 'Rosto' && <Options label="Expressão" options={faces} value={config.rosto} preview={rosto => ({ ...config, rosto })} onChange={rosto => update({ rosto })} />}
          {tab === 'Acessórios' && <div className="flex flex-wrap gap-2">
            <button type="button" className={trailSecondary} aria-pressed={!config.acessorios.length} onClick={() => update({ acessorios: [] })}>Nenhum</button>
            {(Object.keys(accessories) as AvatarConfig['acessorios']).map(item => {
              const selected = config.acessorios.includes(item);
              return <button type="button" key={item} aria-pressed={selected} disabled={Boolean(locks[item])}
                className={selected ? trailButton : trailSecondary} onClick={() => update({
                  acessorios: selected ? config.acessorios.filter(value => value !== item) : [...config.acessorios, item],
                })}><Personagem config={{ ...config, acessorios: [item] }} tamanho={22} animacao="nenhuma" />
                {accessories[item]}{locks[item] && <><Lock size={13} /> {locks[item]}</>}
              </button>;
            })}
          </div>}
        </div>
      </div>
    </div>
    <div className="my-4 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700">
      <p className="text-sm font-bold">Looks salvos · {looks.length}/3</p>
      <div className="flex flex-wrap gap-2">
        {looks.map((look, index) => <div key={index} className="inline-flex">
          <button type="button" className={trailSecondary} onClick={() => setConfig(limitAvatar(look, locks))}>Usar look {index + 1}</button>
          <button type="button" className={trailSecondary} aria-label={'Remover look ' + (index + 1)} onClick={() => setLooks(items => items.filter((_, position) => position !== index))}>×</button>
        </div>)}
        <button type="button" className={trailSecondary} disabled={looks.length >= 3} onClick={() => setLooks(items => [...items, config])}>Guardar look atual</button>
      </div>
    </div>
    {error && <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
    <div className="flex flex-wrap gap-2">
      <button type="button" className={trailSecondary} onClick={randomize}><Shuffle size={15} /> Aleatório</button>
      <button type="button" className={trailSecondary} onClick={() => setConfig(defaultAvatar)}>Restaurar padrão</button>
      <button type="button" className={trailSecondary} onClick={onClose} disabled={busy}>Cancelar</button>
      <button type="button" className={trailButton} onClick={() => void save()} disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button>
    </div>
  </TrailDialog>;
}
