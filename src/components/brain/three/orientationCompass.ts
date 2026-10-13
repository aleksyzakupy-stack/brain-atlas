import { Quaternion, Vector3 } from 'three'
import type { PerspectiveCamera } from 'three'
import type { CameraPreset } from './modelTypes'

export function createOrientationCompass(host: HTMLElement, onPreset: (preset: CameraPreset) => void) {
  const root = document.createElement('div')
  root.className = 'orientation-compass'
  root.setAttribute('role', 'group')
  root.setAttribute('aria-label', 'Orientacja anatomiczna')
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 80 80')
  svg.setAttribute('aria-hidden', 'true')
  root.appendChild(svg)
  const axes: [string, string, CameraPreset, number, number, number][] = [
    ['L', 'Lewa strona', 'lateral', -1, 0, 0], ['R', 'Prawa strona', 'right', 1, 0, 0],
    ['A', 'Widok od przodu', 'front', 0, 0, -1], ['P', 'Widok od tyłu', 'back', 0, 0, 1],
    ['S', 'Widok od góry', 'top', 0, 1, 0], ['I', 'Widok od dołu', 'bottom', 0, -1, 0],
  ]
  const items = axes.map(([letter, label, preset, x, y, z]) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = letter
    button.title = label
    button.setAttribute('aria-label', label)
    button.addEventListener('click', () => onPreset(preset))
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', '40'); line.setAttribute('y1', '40')
    svg.appendChild(line); root.appendChild(button)
    return { direction: new Vector3(x, y, z), button, line }
  })
  host.appendChild(root)
  const inverse = new Quaternion(), projected = new Vector3()
  return {
    update(camera: PerspectiveCamera) {
      inverse.copy(camera.quaternion).invert()
      for (const { direction, button, line } of items) {
        projected.copy(direction).applyQuaternion(inverse)
        const x = 40 + projected.x * 27, y = 40 - projected.y * 27
        button.style.left = `${x}px`; button.style.top = `${y}px`
        button.style.opacity = projected.z > 0 ? '1' : '.42'
        button.style.zIndex = String(Math.round(projected.z * 10) + 11)
        line.setAttribute('x2', String(x)); line.setAttribute('y2', String(y))
        line.style.opacity = projected.z > 0 ? '.45' : '.18'
      }
    },
    dispose() { root.remove() },
  }
}
