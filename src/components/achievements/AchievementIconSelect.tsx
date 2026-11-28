import { achievementIcons } from '../../data/achievementIcons';

export function AchievementIconSelect({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  return <fieldset>
    <legend className="mb-2 text-sm font-semibold">Ícone</legend>
    <div className="flex flex-wrap gap-2">
      {Object.entries(achievementIcons).map(([name, { Icon, label }]) => <button key={name} type="button" onClick={() => onChange(name)}
        aria-label={label} title={label} aria-pressed={value === name}
        className={'rounded-lg border border-slate-300 p-2 dark:border-slate-600 ' + (value === name ? 'bg-violet-100 ring-2 ring-violet-500 dark:bg-violet-900' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>
        <Icon size={18} />
      </button>)}
    </div>
  </fieldset>;
}
