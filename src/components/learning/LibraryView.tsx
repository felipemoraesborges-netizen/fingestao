import { useState } from 'react';
import library from 'virtual:biblioteca-financeira';
import { educationNotice } from '../../learning/contracts';
import { classicPaths, navigateApp, useAppSearch } from '../../navigation/appRoutes';

const plainButton = 'inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800';
const searchable = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');

export default function LibraryView() {
  const search = useAppSearch();
  const [query, setQuery] = useState('');
  const selectedId = new URLSearchParams(search).get('licao');
  const selected = library.flatMap(world => world.articles).find(article => article.id === selectedId);
  const filter = searchable(query.trim());
  const groups = library.map(world => ({ ...world, articles: world.articles.filter(article =>
    searchable([world.title, article.title, article.objective, ...article.sections.map(section => section.body)].join(' ')).includes(filter)) }));

  return <section className="space-y-5">
    <header>
      <h1 className="text-2xl font-bold">Biblioteca de educação financeira</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{educationNotice}</p>
    </header>
    {selected ? <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <a className={plainButton} href={classicPaths.library} onClick={event => { event.preventDefault(); navigateApp(classicPaths.library); }}>Voltar ao índice</a>
      <h2 className="text-xl font-bold">{selected.title}</h2><p>{selected.objective}</p>
      {selected.sections.map(section => <section className="space-y-2" key={section.heading}>
        <h3 className="font-semibold">{section.heading}</h3><p>{section.body}</p>
        <p className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">{section.example}</p>
      </section>)}
      <button type="button" className={plainButton} onClick={() => navigateApp(classicPaths[selected.practice])}>Abrir ferramenta relacionada</button>
    </article> : <>
      <label className="grid max-w-lg gap-1 text-sm font-semibold">Buscar por tema
        <input type="search" value={query} onChange={event => setQuery(event.currentTarget.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
      </label>
      {groups.every(world => world.articles.length === 0) && <p role="status">Nenhum artigo encontrado.</p>}
      <div className="grid gap-3 sm:grid-cols-2">{groups.filter(world => world.articles.length).map(world =>
        <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900" key={world.id}>
          <h2 className="font-bold">{world.title}</h2><p className="text-sm text-slate-600 dark:text-slate-300">{world.description}</p>
          <ul className="space-y-1 text-sm">{world.articles.map(article => {
            const params = new URLSearchParams({ licao: article.id });
            return <li key={article.id}><a href={classicPaths.library + '?' + params} className="inline-block py-1 font-semibold text-emerald-800 underline dark:text-emerald-300"
              onClick={event => { if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigateApp(classicPaths.library, false, params); }}>{article.title}</a></li>;
          })}</ul>
        </section>)}</div>
    </>}
  </section>;
}
