import { BookIcon } from '../common/Icons'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { neuroCategories, neuroEntryName, neuroEntryUrl, searchNeuroEntries } from '../../data/neuroanatomy'
import type { TerminologyLanguage } from '../../types/atlas'
import '../../styles/neuroanatomy.css'
export function NeuroCatalog({ language }: { language: TerminologyLanguage }) {
  const [query,setQuery] = useState('')
  const [category,setCategory] = useState('all')
  const entries = searchNeuroEntries(query).filter(entry => category === 'all' || entry.category === category)
  const countForm = new Intl.PluralRules('pl').select(entries.length)
  return <section className="neuro-catalog">
    <h1>Kompendium neuroanatomii</h1>
    <div className="neuro-catalog-tools"><input aria-label="Szukaj w kompendium" placeholder="Nazwa, skrót lub BA…" value={query} onChange={event => setQuery(event.target.value)} /><select aria-label="Kategoria artykułów" value={category} onChange={event => setCategory(event.target.value)}><option value="all">Wszystkie artykuły</option>{Object.entries(neuroCategories).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></div>
    <div className="neuro-catalog-meta"><span role="status">{entries.length} {countForm === 'one' ? 'artykuł' : countForm === 'few' ? 'artykuły' : 'artykułów'}</span><Link to="/przewodnik">Przewodnik anatomii i lokalizacji klinicznej ↗</Link></div>
    <nav aria-label="Artykuły kompendium">{Object.entries(neuroCategories).map(([key,label]) => {
      const items = entries.filter(entry => entry.category === key)
      return items.length ? <details key={key} open={!!query || category !== 'all'}><summary>{label} <small>{items.length}</small></summary>{items.map(entry => <Link key={entry.id} to={neuroEntryUrl(entry)} className="neuro-catalog-link"><span>{neuroEntryName(entry,language)}</span>{entry.category === 'pathway' && !entry.projectCircuitIds.length && <span className="catalog-text-only" title="Artykuł bez modelu 3D" aria-label="Artykuł bez modelu 3D"><BookIcon /></span>}</Link>)}</details> : null
    })}</nav>
    {!entries.length && <p>Brak pasujących artykułów.</p>}
  </section>
}
