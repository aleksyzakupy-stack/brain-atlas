import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useDialogFocus } from '../../hooks/useDialogFocus'
import { searchAtlas } from '../../utils/searchIndex'
import { CloseIcon, SearchIcon } from '../common/Icons'

export function AtlasDialog({ title, onClose, children, className = '' }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useDialogFocus(ref, onClose)
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>('.app-shell')
    if (!shell || shell.inert) return
    shell.inert = true
    return () => { shell.inert = false }
  }, [])
  return createPortal(<div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose() }}><div ref={ref} className={`atlas-dialog ${className}`} role="dialog" aria-modal="true" aria-label={title}>
    <div className="dialog-heading"><h2>{title}</h2><button onClick={onClose} aria-label="Zamknij okno"><CloseIcon /></button></div>{children}
  </div></div>, document.body)
}

export function AtlasSearch({ onClose, returnTo }: { onClose: () => void; returnTo?: string }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate(), results = searchAtlas(query)
  return <AtlasDialog title="Szukaj w atlasie" onClose={onClose} className="search-modal">
    <div className="search-input"><SearchIcon /><input aria-label="Szukaj struktur, funkcji i szlaków" placeholder="Hipokamp, bruzda środkowa, BA 4…" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); document.querySelector<HTMLButtonElement>('.search-results button')?.focus() } }} /></div>
    <div className="search-results">{query.trim() && <p role="status">{results.length} wyników</p>}{results.map(result => <button key={`${result.type}-${result.id}`} onClick={() => {
      navigate(result.to + (result.type === 'structure' && returnTo ? `?powrot=${encodeURIComponent(returnTo)}` : '')); onClose()
    }}><span><strong>{result.title}</strong></span><span className="result-type">{result.type === 'structure' || result.type === 'atlas-region' ? 'Struktura' : result.type === 'lesson' ? 'Lekcja' : result.type === 'circuit' ? 'Szlak' : result.type === 'brodmann' ? 'Pole BA' : result.type === 'article' ? 'Artykuł' : result.type === 'guide' ? 'Przewodnik' : 'Powiązanie'} ↗</span></button>)}</div>
  </AtlasDialog>
}

export function AboutAtlas({ onClose }: { onClose: () => void }) {
  return <AtlasDialog title="Źródła" onClose={onClose}>
    <div className="about-links"><a href="https://search.worldcat.org/isbn/9781451186253" target="_blank" rel="noreferrer">Haines — Neuroanatomy in Clinical Context, wyd. 9 ↗</a><a href="https://pubmed.ncbi.nlm.nih.gov/20547229/" target="_blank" rel="noreferrer">Destrieux — zakręty i bruzdy ↗</a><a href="https://surfer.nmr.mgh.harvard.edu/fswiki/PALS_B12" target="_blank" rel="noreferrer">PALS-B12 — pola Brodmanna ↗</a><a href="https://surfer.nmr.mgh.harvard.edu/fswiki/SubcorticalSegmentation" target="_blank" rel="noreferrer">FreeSurfer — ASEG ↗</a><a href="https://nncionline.org/classroom/" target="_blank" rel="noreferrer">NNCI ↗</a><a href={`${import.meta.env.BASE_URL}models/brain-high-resolution-provenance.json`} target="_blank" rel="noreferrer">Dane modelu HQ ↗</a><a href={`${import.meta.env.BASE_URL}models/brain-detailed-provenance.json`} target="_blank" rel="noreferrer">Dane modelu Standard ↗</a><a href={`${import.meta.env.BASE_URL}licenses/THIRD_PARTY_NOTICES.md`} target="_blank" rel="noreferrer">Licencje ↗</a></div>
  </AtlasDialog>
}
