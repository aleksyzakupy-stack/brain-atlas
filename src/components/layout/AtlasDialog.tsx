import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDialogFocus } from '../../hooks/useDialogFocus'
import { searchAtlas } from '../../utils/searchIndex'
import { CloseIcon, SearchIcon } from '../common/Icons'

export function AtlasDialog({ title, onClose, children, className = '' }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useDialogFocus(ref, onClose)
  return <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose() }}><div ref={ref} className={`atlas-dialog ${className}`} role="dialog" aria-modal="true" aria-label={title}>
    <div className="dialog-heading"><h2>{title}</h2><button onClick={onClose} aria-label="Zamknij okno"><CloseIcon /></button></div>{children}
  </div></div>
}

export function AtlasSearch({ onClose, returnTo }: { onClose: () => void; returnTo?: string }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate(), results = searchAtlas(query)
  return <AtlasDialog title="Szukaj w atlasie" onClose={onClose} className="search-modal">
    <div className="search-input"><SearchIcon /><input aria-label="Szukaj struktur, funkcji, lekcji i powiązań" placeholder="Hipokamp, pamięć robocza, regulacja…" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); document.querySelector<HTMLButtonElement>('.search-results button')?.focus() } }} /></div>
    <p className="search-tip">Nazwy PL / EN / LAT, funkcje, lekcje i powiązania. Możesz pomijać polskie znaki.</p>
    <div className="search-results"><p role="status">{query.trim() ? `${results.length} wyników` : 'Zacznij od nazwy struktury lub funkcji.'}</p>{results.map(result => <button key={`${result.type}-${result.id}`} onClick={() => {
      navigate(result.to + (result.type === 'structure' && returnTo ? `?powrot=${encodeURIComponent(returnTo)}` : '')); onClose()
    }}><span><strong>{result.title}</strong><small>{result.subtitle}</small></span><span className="result-type">{result.type === 'structure' ? 'Struktura' : result.type === 'lesson' ? 'Lekcja' : 'Powiązanie'} ↗</span></button>)}</div>
  </AtlasDialog>
}

export function AboutAtlas({ onClose }: { onClose: () => void }) {
  return <AtlasDialog title="O atlasie" onClose={onClose}>
    <p>Interaktywny atlas do samodzielnej nauki neurobiologii w psychiatrii: 28 struktur i trzy trasy po sześć kroków.</p>
    <h3>Jak korzystać</h3><p>Tryb Nauka prowadzi od anatomii do mechanizmów. W trybie Atlas możesz wybierać dowolne struktury. Postęp jest zapisywany na tym urządzeniu; po wyczyszczeniu danych przeglądarki znika.</p>
    <h3>Materiały i ograniczenia</h3><p>Kontury pochodzą z atlasów DK i aseg, udostępnionych przez ggseg.formats. Pola funkcjonalne są osobnymi, orientacyjnymi nakładkami. Schematy powiązań nie odtwarzają przebiegu włókien.</p>
    <p>Treści służą nauce mechanizmów, nie diagnostyce konkretnej osoby. Nie przypisano daty ani autora zewnętrznej recenzji klinicznej.</p>
    <div className="about-links"><a href="https://nncionline.org/classroom/" target="_blank" rel="noreferrer">NNCI — inspiracja dydaktyczna ↗</a><a href="https://surfer.nmr.mgh.harvard.edu/fswiki/CorticalParcellation" target="_blank" rel="noreferrer">FreeSurfer — parcellacja korowa ↗</a><a href={`${import.meta.env.BASE_URL}licenses/THIRD_PARTY_NOTICES.md`} target="_blank" rel="noreferrer">Źródła geometrii, rewizja i licencje ↗</a></div>
    <h3>Dalszy rozwój</h3><p>Kolejne trasy, zadania sprawdzające i bardziej szczegółowe sieci mózgowe. Obecna wersja skupia się na pamięci, emocjach i kontroli poznawczej.</p>
  </AtlasDialog>
}
