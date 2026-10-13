import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { loadNeuroGuide, loadNeuroReference } from '../../data/neuroanatomy'
import { Sources } from '../panels/Sources'
import type { NeuroSource } from '../../types/neuroanatomy'
import '../../styles/neuroanatomy.css'
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean).map((part,i) => {
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2,-2)}</strong>
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
    if (!link) return part
    if (link[2].startsWith('NEUROANATOMIA_KOMPENDIUM.md#source-')) return <a key={i} href={'#guide-source-' + link[2].split('#source-')[1]} onClick={event => { event.preventDefault(); const target = document.getElementById('guide-source-' + link[2].split('#source-')[1]); const details = target?.closest('details'); if (details) details.open = true; target?.scrollIntoView({block:'start'}) }}>{link[1]}</a>
    return <a key={i} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>
  })
}
function blocks(text: string) {
  return text.trim().split(/\n\n+/).filter(block => !block.trim().startsWith('Źródła:')).map((block,i) => {
    const lines = block.split('\n')
    if (lines[0].startsWith('|')) {
      const rows = lines.filter(line => !/^\|[\s|:-]+\|$/.test(line)).map(line => line.split('|').slice(1,-1).map(cell => cell.trim()))
      return <div className="guide-table" key={i}><table><thead><tr>{rows[0].map((cell,j) => <th key={j}>{inline(cell)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row,j) => <tr key={j}>{row.map((cell,k) => <td key={k}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>
    }
    if (/^\d+\. /.test(lines[0])) return <ol key={i}>{lines.map((line,j) => <li key={j}>{inline(line.replace(/^\d+\. /,''))}</li>)}</ol>
    return <p key={i}>{inline(block)}</p>
  })
}
export function NeuroGuide() {
  const [data,setData] = useState<{markdown:string;sources:NeuroSource[]} | null>(null)
  const [failed,setFailed] = useState(false)
  const [attempt,setAttempt] = useState(0)
  useEffect(() => { let active = true; Promise.all([loadNeuroGuide(),loadNeuroReference()]).then(([markdown,reference]) => { if (active) { setData({markdown,sources:reference.sources}); setFailed(false) } }).catch(() => { if (active) setFailed(true) }); return () => { active = false } },[attempt])
  if (!data) return <p role={failed ? 'alert' : 'status'}>{failed ? <>Nie udało się wczytać przewodnika. <button onClick={() => setAttempt(value => value + 1)}>Spróbuj ponownie</button></> : 'Wczytywanie przewodnika…'}</p>
  const parts = data.markdown.split(/^## /m)
  const headings: Record<string,string> = { 'Co właściwie przedstawia model': 'Struktury i granice', 'Pięć różnych znaczeń słowa „szlak”': 'Rodzaje szlaków', 'Dlaczego unaczynienie zmienia obraz kliniczny': 'Unaczynienie', 'Wzorce objawów: od mechanizmu do możliwej lokalizacji': 'Lokalizacja objawów' }
  const sections = parts.slice(1).map(part => ({title:headings[part.split('\n')[0]] ?? part.split('\n')[0], text:part.slice(part.indexOf('\n'))}))
  const ids = [...data.markdown.matchAll(/#source-([\w-]+)/g)].map(match => match[1])
  return <article className="neuro-guide"><Link to="/kompendium">← Kompendium</Link><h1>Anatomia i lokalizacja kliniczna</h1>{sections.map((section,i) => <details className="neuro-section" key={i} id={'guide-section-' + i} open={i===0}><summary>{section.title}</summary>{blocks(section.text)}</details>)}<Sources references={[]}>{data.sources.filter(source => ids.includes(source.id)).map(source => <section key={source.id} id={'guide-source-' + source.id}><h3>{source.title}</h3><p>{[source.authors,source.year,source.edition].filter(Boolean).join(' · ')}</p>{source.url && <a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>}</section>)}</Sources></article>
}
