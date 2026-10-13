import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { App } from '../app/App'
import Brain3DScene from '../components/brain/Brain3DScene'
import { learningPaths } from '../data/learningPaths'
import { structureById } from '../data/structures'
import { lessonUrl } from '../utils/learningProgress'

describe('model 3D i dostępny schemat zastępczy', () => {
  it('otwiera model 3D i pozwala przejść do działającego schematu bez WebGL', async () => {
    window.location.hash = '#/atlas'
    const { container } = render(<App />)

    expect(screen.getByRole('button', { name: 'Model 3D' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(await screen.findByRole('button', { name: 'Otwórz schemat 2D' }, { timeout: 15000 }))

    expect(screen.getByRole('button', { name: 'Schemat 2D' })).toHaveAttribute('aria-pressed', 'true')
    const visualCortex = container.querySelector<SVGPathElement>('[data-structure-id="visual-cortex"]')
    expect(visualCortex).not.toBeNull()
    fireEvent.keyDown(visualCortex!, { key: 'Enter' })

    await screen.findByRole('heading', { name: 'Kora wzrokowa', level: 1 })
    expect(window.location.hash).toBe('#/struktury/kora-wzrokowa')
  }, 20000)

  it('zachowuje powrót do lekcji po wybraniu struktury w schemacie zastępczym', async () => {
    const path = learningPaths[0]
    const step = path.steps.find(item => item.scene === 'anatomy' && item.view === 'deep')!
    const returnTo = lessonUrl(path.slug, step.id)
    window.location.hash = `#${returnTo}`
    const { container } = render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Otwórz schemat 2D' }))

    const hippocampus = container.querySelector<SVGPathElement>('[data-structure-id="hippocampus"]')
    expect(hippocampus).not.toBeNull()
    fireEvent.click(hippocampus!)

    await screen.findByRole('heading', { name: structureById.hippocampus.names.pl, level: 1 })
    expect(new URLSearchParams(window.location.hash.split('?')[1]).get('powrot')).toBe(returnTo)
    fireEvent.click(screen.getByRole('link', { name: '← Wróć do lekcji' }))
    await screen.findByRole('heading', { name: step.title, level: 1 })
    expect(window.location.hash).toBe(`#${returnTo}`)
  })

  it('zachowuje schemat powiązań jako początkowy widok lekcji o połączeniach', async () => {
    const path = learningPaths.find(item => item.steps.some(step => step.scene === 'connections'))!
    const step = path.steps.find(item => item.scene === 'connections')!
    window.location.hash = `#${lessonUrl(path.slug, step.id)}`
    render(<App />)

    expect(screen.getByRole('img', { name: 'Schemat powiązań, położenie węzłów umowne' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Schemat 2D' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Model 3D' }))
    await screen.findByRole('button', { name: 'Otwórz schemat 2D' })
    fireEvent.click(screen.getByRole('button', { name: 'Schemat 2D' }))

    await waitFor(() => expect(screen.getByRole('img', { name: 'Schemat powiązań, położenie węzłów umowne' })).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: step.title, level: 1 })).toBeInTheDocument()
    expect(window.location.hash).toBe(`#${lessonUrl(path.slug, step.id)}`)
  })

  it('udostępnia schemat 2D także po błędzie pobierania modelu', async () => {
    const contextDescriptor = Object.getOwnPropertyDescriptor(window, 'WebGL2RenderingContext')
    Object.defineProperty(window, 'WebGL2RenderingContext', { configurable: true, value: class {} })
    const fetchModel = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'))
    const onFallback = vi.fn()
    try {
      render(<Brain3DScene language="pl" onSelect={vi.fn()} onFallback={onFallback} />)
      fireEvent.click(await screen.findByRole('button', { name: 'Otwórz schemat 2D' }))

      expect(fetchModel).toHaveBeenCalledWith(`${import.meta.env.BASE_URL}models/brain-detailed.json${typeof DecompressionStream !== 'undefined' ? '.gz' : ''}`)
      expect(onFallback).toHaveBeenCalledOnce()
      expect(screen.getByText('Model 3D jest niedostępny')).toBeInTheDocument()
    } finally {
      fetchModel.mockRestore()
      if (contextDescriptor) Object.defineProperty(window, 'WebGL2RenderingContext', contextDescriptor)
      else Reflect.deleteProperty(window, 'WebGL2RenderingContext')
    }
  })
})
