import { useEffect, useMemo, useRef, useState } from 'react'
import type { Folder, Note } from '../types'
import { IconPlus } from './Icons'

type Props = {
  notes: Note[]
  folders: Folder[]
  rootLabel: string
  onOpenNote: (id: string) => void
}

const CENTER = { x: 0, y: 0 }
const GROUP_RADIUS = 300
const NOTE_RADIUS = 215
/** Węzły notatek i folderów - potrzebne do liczenia obszaru rysunku. */
const NOTE_BOX = { w: 168, h: 40 }
const GROUP_BOX = { w: 176, h: 52 }
const ROOT_R = 62
const PADDING = 60

type Point = { x: number; y: number }

type GroupNode = {
  id: string
  label: string
  emoji: string
  angle: number
  pos: Point
  notes: { note: Note; pos: Point }[]
}

function polar(origin: Point, radius: number, angle: number): Point {
  return {
    x: origin.x + radius * Math.cos(angle),
    y: origin.y + radius * Math.sin(angle),
  }
}

function truncate(text: string, max: number): string {
  const clean = text.trim() || 'Bez tytułu'
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

/**
 * Układ promienisty: w środku bieżący widok, wokół foldery,
 * a przy każdym folderze wachlarz jego notatek.
 */
function buildLayout(notes: Note[], folders: Folder[]): GroupNode[] {
  const byFolder = new Map<string, Note[]>()
  for (const note of notes) {
    const key = note.folderId ?? '__none__'
    const list = byFolder.get(key)
    if (list) list.push(note)
    else byFolder.set(key, [note])
  }

  const keys = [...byFolder.keys()].sort((a, b) => {
    if (a === '__none__') return 1
    if (b === '__none__') return -1
    return (byFolder.get(b)?.length ?? 0) - (byFolder.get(a)?.length ?? 0)
  })

  const step = (Math.PI * 2) / Math.max(keys.length, 1)

  return keys.map((key, index) => {
    const folder = folders.find((f) => f.id === key)
    const groupNotes = byFolder.get(key) ?? []
    const angle = index * step - Math.PI / 2
    // pierścień folderów jest lekko spłaszczony - lepiej wypełnia poziomy ekran
    const pos = {
      x: CENTER.x + GROUP_RADIUS * 1.35 * Math.cos(angle),
      y: CENTER.y + GROUP_RADIUS * 0.8 * Math.sin(angle),
    }

    const count = groupNotes.length
    const span = Math.min(Math.PI * 0.9, 0.5 * count)
    // im więcej notatek, tym szerszy wachlarz - inaczej etykiety wchodzą na siebie
    const base = NOTE_RADIUS + Math.max(0, count - 4) * 14
    const laid = groupNotes.map((note, i) => {
      const noteAngle = count === 1 ? angle : angle - span / 2 + (span * i) / (count - 1)
      // co druga notatka nieco dalej - mniej nakładania przy dużych folderach
      const radius = base + (i % 2) * 70
      return { note, pos: polar(pos, radius, noteAngle) }
    })

    return {
      id: key,
      label: folder?.name ?? 'Bez folderu',
      emoji: folder?.emoji ?? '🗒️',
      angle,
      pos,
      notes: laid,
    }
  })
}

/** Obszar rysunku dopasowany do rozłożonych węzłów - mapa nigdy nie jest przycięta. */
function computeViewBox(groups: GroupNode[]): string {
  let minX = CENTER.x - ROOT_R
  let minY = CENTER.y - ROOT_R
  let maxX = CENTER.x + ROOT_R
  let maxY = CENTER.y + ROOT_R

  const extend = (pos: Point, box: { w: number; h: number }) => {
    minX = Math.min(minX, pos.x - box.w / 2)
    maxX = Math.max(maxX, pos.x + box.w / 2)
    minY = Math.min(minY, pos.y - box.h / 2)
    maxY = Math.max(maxY, pos.y + box.h / 2)
  }

  for (const group of groups) {
    extend(group.pos, GROUP_BOX)
    for (const { pos } of group.notes) extend(pos, NOTE_BOX)
  }

  return [
    minX - PADDING,
    minY - PADDING,
    maxX - minX + PADDING * 2,
    maxY - minY + PADDING * 2,
  ].join(' ')
}

export function MindMap({ notes, folders, rootLabel, onOpenNote }: Props) {
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

  const groups = useMemo(() => buildLayout(notes, folders), [notes, folders])
  const viewBox = useMemo(() => computeViewBox(groups), [groups])

  const zoom = (delta: number) =>
    setView((v) => ({ ...v, scale: Math.min(2.5, Math.max(0.35, v.scale + delta)) }))

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return
    // przeliczenie pikseli ekranu na jednostki viewBox, żeby mapa nie "uciekała" spod kursora
    const width = event.currentTarget.getBoundingClientRect().width || 1
    const ratio = Number(viewBox.split(' ')[2]) / width
    drag.current = {
      x: view.x,
      y: view.y,
      startX: event.clientX,
      startY: event.clientY,
      ratio: ratio / view.scale,
      moved: false,
    }
    setDragging(true)
  }

  // przeciąganie obsługujemy na oknie zamiast przez setPointerCapture,
  // bo przechwycony wskaźnik zjadałby kliknięcia w węzły mapy
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

  /** Po przeciągnięciu mapy nie otwieramy notatki, która akurat wylądowała pod kursorem. */
  const activate = (id: string) => {
    if (drag.current?.moved) return
    onOpenNote(id)
  }

  if (notes.length === 0) {
    return (
      <div className="empty">
        <p>Brak notatek do pokazania na mapie.</p>
      </div>
    )
  }

  return (
    <div className="mindmap">
      <div className="mindmap-controls">
        <button type="button" className="icon-btn" onClick={() => zoom(0.2)} aria-label="Przybliż">
          <IconPlus size={16} />
        </button>
        <button type="button" className="icon-btn" onClick={() => zoom(-0.2)} aria-label="Oddal">
          <span className="minus">−</span>
        </button>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => setView({ x: 0, y: 0, scale: 1 })}
        >
          Wyśrodkuj
        </button>
      </div>

      <svg
        className={`mindmap-canvas${dragging ? ' is-dragging' : ''}`}
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onPointerDown}
        onWheel={(e) => zoom(e.deltaY > 0 ? -0.12 : 0.12)}
        role="tree"
        aria-label="Mapa myśli"
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          {groups.map((group) => (
            <g key={group.id}>
              <path
                className="link link-main"
                d={`M ${CENTER.x} ${CENTER.y} Q ${(CENTER.x + group.pos.x) / 2} ${
                  (CENTER.y + group.pos.y) / 2 + 24
                } ${group.pos.x} ${group.pos.y}`}
              />
              {group.notes.map(({ note, pos }) => (
                <path
                  key={`link-${note.id}`}
                  className={`link link-note color-${note.color}`}
                  d={`M ${group.pos.x} ${group.pos.y} Q ${(group.pos.x + pos.x) / 2} ${
                    (group.pos.y + pos.y) / 2 + 14
                  } ${pos.x} ${pos.y}`}
                />
              ))}
            </g>
          ))}

          {groups.map((group) =>
            group.notes.map(({ note, pos }) => (
              <g
                key={note.id}
                className={`map-node map-note color-${note.color}`}
                transform={`translate(${pos.x} ${pos.y})`}
                onClick={() => activate(note.id)}
                role="treeitem"
                aria-label={note.title || 'Bez tytułu'}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onOpenNote(note.id)
                }}
              >
                <rect x={-84} y={-20} width={168} height={40} rx={12} />
                <text x={0} y={5} textAnchor="middle">
                  {truncate(note.title || note.body, 22)}
                </text>
                {note.checklist.length > 0 && (
                  <text className="map-badge" x={70} y={-24}>
                    {note.checklist.filter((i) => i.done).length}/{note.checklist.length}
                  </text>
                )}
              </g>
            )),
          )}

          {groups.map((group) => (
            <g key={`g-${group.id}`} className="map-node map-group" transform={`translate(${group.pos.x} ${group.pos.y})`}>
              <rect x={-88} y={-26} width={176} height={52} rx={16} />
              <text x={0} y={6} textAnchor="middle">
                {group.emoji} {truncate(group.label, 16)}
              </text>
            </g>
          ))}

          <g className="map-node map-root" transform={`translate(${CENTER.x} ${CENTER.y})`}>
            <circle r={62} />
            <text x={0} y={0} textAnchor="middle">
              {truncate(rootLabel, 14)}
            </text>
            <text className="map-sub" x={0} y={20} textAnchor="middle">
              {notes.length} notatek
            </text>
          </g>
        </g>
      </svg>
    </div>
  )
}
