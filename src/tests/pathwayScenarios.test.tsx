import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { App } from '../app/App'
import { PathwayScene } from '../components/brain/PathwayScene'
import { circuitById } from '../data/circuits'
import { pathwayScenarios } from '../data/pathwayScenarios'
import { referenceById } from '../data/references'

describe('porównanie fizjologii i scenariusza klinicznego', () => {
  it('oznacza wyłącznie opisany cel i zachowuje geometrię oraz tempo schematu', () => {
    const {container} = render(<PathwayScene circuit={circuitById.nigrostriatal} language="pl" onSelect={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', {name: 'Schemat'}))
    fireEvent.click(screen.getByRole('button', {name: 'Pauza'}))
    const paths = [...container.querySelectorAll('path[marker-end]')].map(path=>path.getAttribute('d'))
    const animation = container.querySelector('animateMotion')!
    fireEvent.click(screen.getByRole('button', {name: 'Schizofrenia'}))
    expect(container.querySelectorAll('.pathway-node[data-change]')).toHaveLength(1)
    expect(container.querySelector('.pathway-node[data-change]')).toHaveTextContent('Jądro ogoniaste')
    expect(container.querySelector('svg')).toHaveAttribute('data-playing', 'false')
    expect(container.querySelector('animateMotion')).toBe(animation)
    expect(animation).toHaveAttribute('dur', '2.6s')
    expect([...container.querySelectorAll('path[marker-end]')].map(path=>path.getAttribute('d'))).toEqual(paths)
    fireEvent.click(screen.getByRole('button', {name: 'Co się zmienia? ↗'}))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/PET nie określa częstotliwości/)).toBeInTheDocument()
    expect(within(dialog).getByRole('link', {name: /Increased Synaptic Dopamine/})).toHaveAttribute('href', referenceById['kegeles-striatum'].url)
    fireEvent.keyDown(document, {key:'Escape'})
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'Fizjologia'}))
    expect(container.querySelectorAll('.pathway-node[data-change]')).toHaveLength(0)
  })

  it('odróżnia hipotezę istotności od pomiaru i pokazuje opis połączenia z klawiatury', () => {
    render(<PathwayScene circuit={circuitById.mesolimbic} language="pl" onSelect={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', {name:'Schemat'}))
    fireEvent.click(screen.getByRole('button', {name:'Schizofrenia'}))
    expect(screen.getByText('Model mechanizmu')).toBeInTheDocument()
    const edge = screen.getByRole('button', {name:'Połączenie: VTA → Jądro półleżące · DA'})
    fireEvent.keyDown(edge, {key:'Enter'})
    const dialog = screen.getByRole('dialog', {name:'Połączenie'})
    expect(within(dialog).getByText(/dopamina \(DA\)/)).toBeInTheDocument()
    expect(within(dialog).getByText(/nie pomiar nadmiaru/)).toBeInTheDocument()
  })

  it('nie przenosi zmian na kolejny szlak i respektuje jawny odnośnik do scenariusza', async () => {
    window.location.hash = '#/szlaki/nigrostriatal?stan=schizofrenia'
    render(<App />)
    expect(screen.getByRole('button', {name:'Schizofrenia'})).toHaveAttribute('aria-pressed','true')
    fireEvent.click(screen.getByRole('button', {name:'Szlak guzowo-lejkowy'}))
    await screen.findByRole('heading', {name:'Szlak guzowo-lejkowy',level:1})
    expect(screen.queryByRole('button',{name:'Schizofrenia'})).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'Szlak mezokortykalny'}))
    await screen.findByRole('heading',{name:'Szlak mezokortykalny',level:1})
    expect(screen.getByRole('button',{name:'Fizjologia'})).toHaveAttribute('aria-pressed','true')
  })

  it('wiąże każdą adnotację z istniejącym węzłem i źródłem, bez domyślnego scenariusza dla innych szlaków', () => {
    for (const [id, scenario] of Object.entries(pathwayScenarios)) {
      const circuit = circuitById[id]
      expect(scenario).toBeDefined()
      scenario!.changes.forEach(change=>expect(circuit.nodes.some(node=>node.id===change.nodeId)).toBe(true))
      scenario!.referenceIds.forEach(id=>expect(referenceById[id]?.status).toBe('verified'))
    }
    expect(pathwayScenarios['serotonin-dorsal']).toBeUndefined()
  })
})
