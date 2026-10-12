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
    <div className="search-results">{query.trim() && <p role="status">{results.length} wyników</p>}{results.map(result => <button key={`${result.type}-${result.id}`} onClick={() => {
      navigate(result.to + (result.type === 'structure' && returnTo ? `?powrot=${encodeURIComponent(returnTo)}` : '')); onClose()
    }}><span><strong>{result.title}</strong></span><span className="result-type">{result.type === 'structure' ? 'Struktura' : result.type === 'lesson' ? 'Lekcja' : 'Powiązanie'} ↗</span></button>)}</div>
  </AtlasDialog>
}

export function AboutAtlas({ onClose }: { onClose: () => void }) {
  return <AtlasDialog title="O atlasie" onClose={onClose}>
    <h3>Sterowanie</h3><p>Przeciągnij model, aby go obrócić. Kółko myszy lub gest szczypania zmieniają powiększenie. Kliknięcie struktury otwiera jej kartę. Po ustawieniu fokusu na modelu: strzałki obracają, + / − przybliżają i oddalają, Home przywraca widok.</p>
    <p>„Odsłoń wnętrze” włącza przezroczystość kory. Możesz wybrać półkulę i rozsunąć obie półkule. Wyszukiwarka działa dla nazw PL / EN / LAT, także bez polskich znaków. Postęp nauki jest zapisywany na tym urządzeniu.</p>
    <h3>Materiały i ograniczenia</h3><p>Model 3D powstał z powierzchni pial, parcellacji DK i segmentacji aseg wzorca FreeSurfer fsaverage5. Kontury 2D pochodzą z ggseg.formats. Przypisania obszarów funkcjonalnych do parcel są przybliżone. Drobne jądra bez osobnej segmentacji pozostają opisane w kartach i schematach 2D. Schematy powiązań nie odtwarzają przebiegu włókien.</p>
    <p>Treści służą nauce mechanizmów, nie diagnostyce konkretnej osoby.</p>
    <div className="about-links"><a href="https://nncionline.org/classroom/" target="_blank" rel="noreferrer">NNCI — inspiracja dydaktyczna ↗</a><a href="https://surfer.nmr.mgh.harvard.edu/fswiki/CorticalParcellation" target="_blank" rel="noreferrer">FreeSurfer — parcellacja korowa ↗</a><a href={`${import.meta.env.BASE_URL}licenses/THIRD_PARTY_NOTICES.md`} target="_blank" rel="noreferrer">Źródła geometrii, rewizja i licencje ↗</a></div>
  </AtlasDialog>
}
