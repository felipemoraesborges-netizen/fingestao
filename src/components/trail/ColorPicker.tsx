export function ColorPicker({ label, value, palette, onChange, blocked }: {
  label: string; value: string; palette: string[]; onChange: (color: string) => void; blocked?: Record<string, string>;
}) {
  return <fieldset className="min-w-0">
    <legend className="mb-2 text-sm font-semibold">{label}</legend>
    <div className="flex flex-wrap items-center gap-2">
      {palette.map(color => <button type="button" key={color} title={blocked?.[color] ?? color} aria-label={blocked?.[color] ?? color}
        aria-pressed={value === color} disabled={Boolean(blocked?.[color])}
        onClick={() => onChange(color)} style={{ background: color }}
        className={'h-8 w-8 rounded-full border border-slate-400 disabled:opacity-40 ' + (value === color ? 'ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-slate-900' : '')} />)}
      <label className="inline-flex items-center gap-1 text-xs">Cor livre
        <input type="color" className="h-8 w-8" value={value} onChange={event => {
          if (!blocked?.[event.target.value]) onChange(event.target.value);
        }} />
      </label>
    </div>
  </fieldset>;
}
