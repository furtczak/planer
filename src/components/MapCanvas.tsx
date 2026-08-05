import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  IMAGE_HEIGHT,
  IMAGE_WIDTH,
  UNDERLINE_OFFSET,
  fitViewBox,
  layoutMap,
} from '../lib/mapLayout'
import type { MapNode } from '../types'

type Props = {
  nodes: MapNode[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onToggleCollapse?: (id: string) => void
  interactive?: boolean
  padding?: number
  className?: string
}

export function MapCanvas({
  nodes,
  selectedId = null,
  onSelect,
  onToggleCollapse,
  interactive = false,
  padding = 48,
  className = '',
}: Props) {
  const layout = useMemo(() => layoutMap(nodes), [nodes])
  const viewBox = useMemo(() => fitViewBox(layout.bounds, padding), [layout.bounds, padding])
  // identyfikatory przycinania muszą być unikalne - na stronie bywa kilka map naraz
  const clipPrefix = useId()

  const [view, setView] = useState({ x: 0, y: 0, scale: 1 })
  const drag = useRef<{
    x: number
    y: number
    startX: number
    startY: number
    ratio: number
    moved: boolean
  } | null>(null)
  const [dragging, setDragging] = useState(false)

  // przeciąganie na oknie zamiast pointer capture - inaczej ginęłyby kliknięcia w węzły
  useEffect(() => {
    if (!dragging) return

    const onMove = (event: PointerEvent) => {
      const state = drag.current
      if (!state) return
      const dx = event.clientX - state.startX
      const dy = event.clientY - state.startY
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) state.moved = true
      setView((v) => ({ ...v, x: state.x + dx * state.ratio, y: state.y + dy * state.ratio }))
    }
    const onUp = () => setDragging(false)

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragging])

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive || event.button !== 0) return
    const width = event.currentTarget.getBoundingClientRect().width || 1
    drag.current = {
      x: view.x,
      y: view.y,
      startX: event.clientX,
      startY: event.clientY,
      ratio: Number(viewBox.split(' ')[2]) / width / view.scale,
      moved: false,
    }
    setDragging(true)
  }

  const activate = (id: string) => {
    if (drag.current?.moved) return
    onSelect?.(id)
  }

  return (
    <svg
      className={`map-canvas${dragging ? ' is-dragging' : ''} ${className}`.trim()}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={onPointerDown}
      onClick={(e) => {
        if (interactive && e.target === e.currentTarget && !drag.current?.moved) onSelect?.(null)
      }}
      onWheel={
        interactive
          ? (e) =>
              setView((v) => ({
                ...v,
                scale: Math.min(2.6, Math.max(0.4, v.scale + (e.deltaY > 0 ? -0.1 : 0.1))),
              }))
          : undefined
      }
      role={interactive ? 'tree' : 'img'}
      aria-label="Mapa myśli"
    >
      <defs>
        {layout.nodes
          .filter((item) => item.node.image)
          .map((item) => (
            <clipPath key={item.node.id} id={`${clipPrefix}-${item.node.id}`}>
              <rect
                x={0}
                y={-item.height / 2}
                width={IMAGE_WIDTH}
                height={IMAGE_HEIGHT}
                rx={10}
              />
            </clipPath>
          ))}
      </defs>

      <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
        {layout.connectors.map((c) => (
          <path key={c.id} className={`branch branch-${c.color}`} d={c.path} />
        ))}

        {layout.nodes.map((item) => {
          const selected = item.node.id === selectedId
          const textOffset = item.imageBlock / 2

          const picture = item.node.image ? (
            <image
              className="node-image"
              href={item.node.image}
              x={0}
              y={-item.height / 2}
              width={IMAGE_WIDTH}
              height={IMAGE_HEIGHT}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${clipPrefix}-${item.node.id})`}
            />
          ) : null

          if (item.isRoot) {
            const pillHeight = item.height - item.imageBlock
            return (
              <g
                key={item.node.id}
                className={`map-root${selected ? ' is-selected' : ''}`}
                transform={`translate(${item.x} ${item.y})`}
                onClick={() => activate(item.node.id)}
              >
                {picture}
                <rect
                  x={0}
                  y={textOffset - pillHeight / 2}
                  width={item.width}
                  height={pillHeight}
                  rx={14}
                />
                <text x={item.width / 2} y={textOffset + 1} textAnchor="middle">
                  {item.node.text || 'Bez tytułu'}
                </text>
              </g>
            )
          }

          return (
            <g
              key={item.node.id}
              className={`map-node color-${item.color}${selected ? ' is-selected' : ''}`}
              transform={`translate(${item.x} ${item.y})`}
              onClick={() => activate(item.node.id)}
            >
              <rect
                className="hit"
                x={-8}
                y={-item.height / 2}
                width={item.width + 16}
                height={item.height}
                rx={9}
              />
              {picture}
              <text x={0} y={textOffset}>
                {item.node.text || 'Nowy węzeł'}
              </text>
              {item.node.note && (
                <circle className="note-dot" cx={item.width + 8} cy={textOffset - 7} r={2.6} />
              )}
              {item.hasHiddenChildren && (
                <g
                  className="collapsed-badge"
                  transform={`translate(${item.width + 16} ${textOffset + UNDERLINE_OFFSET})`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleCollapse?.(item.node.id)
                  }}
                >
                  <circle r={10} />
                  <text y={1} textAnchor="middle">
                    {item.childCount}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
