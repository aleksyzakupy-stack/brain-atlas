import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react'
import { useRef, useState } from 'react'
import { useAtlas } from '../../../hooks/useAtlas'
import { useBrainNavigation } from '../../../hooks/useBrainNavigation'
import { useReducedMotion } from '../../../hooks/useReducedMotion'
import { BrainLabels } from '../BrainLabels'
import { StructureOverlay } from '../overlays/StructureOverlay'

type Point = { x: number; y: number }

const brainSilhouette = 'M101 326 C73 280 88 219 129 186 C130 132 181 91 240 101 C284 62 357 62 403 91 C453 52 526 70 563 111 C619 87 689 111 719 157 C769 167 805 216 793 266 C823 309 803 364 759 394 C739 431 686 451 630 444 C594 480 537 490 489 471 C443 503 378 510 330 482 C273 500 214 480 188 443 C135 434 92 386 101 326 Z'

export function LateralBrainView() {
  const { state, dispatch } = useAtlas()
  const { selectStructure, deselectStructure, zoomToStructure } = useBrainNavigation()
  const reducedMotion = useReducedMotion()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const pointers = useRef(new Map<number, Point>())
  const lastPoint = useRef<Point | null>(null)
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null)
  const dragged = useRef(false)
  const selectedId = state.primarySelection?.type === 'structure' ? state.primarySelection.id : null

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    const pointerTarget = event.target as Element
    if ('setPointerCapture' in pointerTarget) {
      pointerTarget.setPointerCapture(event.pointerId)
    }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    lastPoint.current = { x: event.clientX, y: event.clientY }
    dragged.current = false
    if (pointers.current.size === 2) {
      const [first, second] = Array.from(pointers.current.values())
      pinchStart.current = {
        distance: Math.hypot(first.x - second.x, first.y - second.y),
        zoom: state.viewport.zoom,
      }
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointers.current.size === 2 && pinchStart.current) {
      const [first, second] = Array.from(pointers.current.values())
      const distance = Math.hypot(first.x - second.x, first.y - second.y)
      const nextZoom = pinchStart.current.zoom * (distance / pinchStart.current.distance)
      if (Math.abs(distance - pinchStart.current.distance) > 4) dragged.current = true
      dispatch({ type: 'SET_ZOOM', zoom: nextZoom })
      return
    }

    if (state.viewport.zoom > 1 && lastPoint.current) {
      const rect = event.currentTarget.getBoundingClientRect()
      const dx = (event.clientX - lastPoint.current.x) * (900 / rect.width)
      const dy = (event.clientY - lastPoint.current.y) * (620 / rect.height)
      if (Math.abs(dx) + Math.abs(dy) > 1.5) dragged.current = true
      dispatch({ type: 'PAN_BY', dx, dy })
      lastPoint.current = { x: event.clientX, y: event.clientY }
    }
  }

  const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    pointers.current.delete(event.pointerId)
    pinchStart.current = null
    lastPoint.current = pointers.current.size === 1 ? Array.from(pointers.current.values())[0] : null
  }

  const handleWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    event.preventDefault()
    const delta = event.deltaY > 0 ? -0.16 : 0.16
    dispatch({ type: 'SET_ZOOM', zoom: state.viewport.zoom + delta })
  }

  return (
    <svg
      className={`lateral-brain ${reducedMotion ? 'reduced-motion' : ''}`}
      viewBox="0 0 900 620"
      role="img"
      aria-labelledby="brain-title brain-description"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onClick={() => {
        if (!dragged.current) deselectStructure()
        dragged.current = false
      }}
    >
      <title id="brain-title">Interaktywny boczny widok mózgu</title>
      <desc id="brain-description">Schematyczny widok lewej półkuli. Wybierz oznaczoną strukturę, aby otworzyć jej opis.</desc>
      <defs>
        <linearGradient id="brain-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1b2a3d" />
          <stop offset="0.48" stopColor="#121e2e" />
          <stop offset="1" stopColor="#0b1421" />
        </linearGradient>
        <radialGradient id="deep-window-fill" cx="50%" cy="50%" r="58%">
          <stop offset="0" stopColor="#07101d" stopOpacity="0.96" />
          <stop offset="0.76" stopColor="#0a1320" stopOpacity="0.88" />
          <stop offset="1" stopColor="#101b2a" stopOpacity="0.18" />
        </radialGradient>
        <filter id="brain-shadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="22" stdDeviation="22" floodColor="#00040a" floodOpacity="0.72" />
        </filter>
        <filter id="selected-glow" x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id="brain-clip"><path d={brainSilhouette} /></clipPath>
      </defs>

      <g
        className="brain-viewport"
        style={{ transition: reducedMotion ? 'none' : undefined }}
        transform={`translate(${state.viewport.pan.x} ${state.viewport.pan.y}) scale(${state.viewport.zoom})`}
      >
        <g id="brain-base" filter="url(#brain-shadow)">
          <path className="brain-silhouette" d={brainSilhouette} />
          <path className="brainstem-base" d="M552 387 C590 389 626 409 643 444 C649 472 635 523 611 550 C591 559 571 548 573 528 L580 472 C560 452 545 419 552 387 Z" />
          <path className="cerebellum-base" d="M629 399 C670 369 727 372 761 398 C797 426 793 473 762 501 C727 528 674 522 638 498 C611 479 608 429 629 399 Z" />
        </g>

        <g id="anatomical-regions" clipPath="url(#brain-clip)">
          <path className="lobe-tone frontal" d="M101 326 C73 280 88 219 129 186 C130 132 181 91 240 101 C282 65 329 69 356 103 C340 157 336 215 348 269 C337 329 306 387 253 427 C188 457 123 418 101 326 Z" />
          <path className="lobe-tone parietal" d="M356 103 C410 62 477 72 511 111 C568 83 642 101 686 144 C702 193 694 252 671 302 C624 333 562 345 503 329 C457 303 407 284 348 269 C336 215 340 157 356 103 Z" />
          <path className="lobe-tone temporal" d="M253 327 C316 308 385 319 438 352 C497 331 570 337 623 374 C635 418 607 462 558 482 C510 491 466 486 430 470 C372 502 301 498 253 462 C220 424 219 367 253 327 Z" />
          <path className="lobe-tone occipital" d="M686 144 C742 151 786 207 793 266 C823 309 803 364 759 394 C739 431 686 451 630 444 C647 397 643 350 623 314 C665 267 688 210 686 144 Z" />
          <g className="cortical-contours">
            <path d="M145 205 C190 179 242 177 289 193" />
            <path d="M127 251 C174 228 232 229 280 246" />
            <path d="M130 306 C179 285 238 289 275 310" />
            <path d="M169 352 C214 339 262 346 292 366" />
            <path d="M244 139 C280 129 310 139 329 163" />
            <path d="M378 113 C365 158 365 204 378 244" />
            <path d="M440 111 C424 163 426 211 441 250" />
            <path d="M488 130 C541 111 603 121 646 151" />
            <path d="M480 177 C531 160 594 170 638 201" />
            <path d="M489 229 C547 212 610 225 653 258" />
            <path d="M507 282 C561 267 622 279 665 307" />
            <path d="M295 397 C362 369 439 369 500 392" />
            <path d="M288 443 C352 421 421 424 474 448" />
            <path d="M535 346 C589 331 642 339 683 367" />
            <path d="M700 194 C738 215 758 251 752 286" />
            <path d="M699 321 C727 336 738 356 733 377" />
          </g>
        </g>

        {state.activeLayerIds.includes('deep-anatomy') && !state.anatomyFocusId && (
          <g id="deep-structures" className="deep-window" aria-hidden="true">
            <path d="M278 158 C354 115 487 111 589 160 C666 199 690 293 652 371 C625 427 566 465 489 475 C407 485 326 449 286 384 C246 320 235 217 278 158 Z" />
            <text x="607" y="185">PRZEKRÓJ GŁĘBOKI</text>
          </g>
        )}

        <StructureOverlay
          selectedId={selectedId}
          focusId={state.anatomyFocusId}
          deepAnatomyVisible={state.activeLayerIds.includes('deep-anatomy')}
          terminologyLanguage={state.terminologyLanguage}
          onSelect={(id) => selectStructure(id, { zoom: false })}
          onZoom={(id) => {
            if (selectedId !== id) selectStructure(id, { zoom: false })
            zoomToStructure(id)
          }}
          onHover={setHoveredId}
        />
        <BrainLabels hoveredId={hoveredId} selectedId={selectedId} terminologyLanguage={state.terminologyLanguage} focusId={state.anatomyFocusId} zoom={state.viewport.zoom} />
      </g>
    </svg>
  )
}
