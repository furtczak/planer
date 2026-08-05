import { useEffect, useMemo, useRef, useState } from 'react'
import { MapCanvas } from '../components/MapCanvas'
import {
  IconBack,
  IconChild,
  IconClose,
  IconCollapse,
  IconExpand,
  IconNote,
  IconPalette,
  IconPin,
  IconPlus,
  IconSibling,
  IconTrash,
} from '../components/Icons'
import { childrenOf, findRoot } from '../lib/mapLayout'
import type { BranchColor, MindMap } from '../types'
import { BRANCH_COLORS } from '../types'

type Props = {
  map: MindMap
  onBack: () => void
  onAddNode: (parentId: string, nodeId: string, text?: string) => void
  onUpdateNode: (nodeId: string, patch: { text?: string; note?: string }) => void
  onRemoveNode: (nodeId: string) => void
  onToggleCollapse: (nodeId: string) => void
  onSetColor: (nodeId: string, color: BranchColor) => void
  onTogglePin: () => void
  onTrash: () => void
}

function newId() {
  return `n-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function MapEditorScreen({
  map,
  onBack,
  onAddNode,
  onUpdateNode,
  onRemoveNode,
  onToggleCollapse,
  onSetColor,
  onTogglePin,
  onTrash,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showColors, setShowColors] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const textRef = useRef<HTMLInputElement>(null)

  const root = useMemo(() => findRoot(map.nodes), [map.nodes])
  const selected = map.nodes.find((n) => n.id === selectedId) ?? null
  const isRoot = selected?.parentId === null
  const childCount = selected ? childrenOf(map.nodes, selected.id).length : 0

  useEffect(() => {
    setShowColors(false)
    setNoteOpen(false)
  }, [selectedId])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target && ['INPUT', 'TEXTAREA'].includes(target.tagName)
      if (event.key === 'Escape') {
        if (typing) target?.blur()
        else if (selectedId) setSelectedId(null)
        else onBack()
      }
      if (typing || !selected) return
      if (event.key === 'Tab') {
        event.preventDefault()
        addChild(selected.id)
      }
      if (event.key === 'Enter' && selected.parentId) {
        event.preventDefault()
        addSibling()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const addChild = (parentId: string) => {
    const id = newId()
    onAddNode(parentId, id)
    setSelectedId(id)
    // pole tekstowe pojawia się razem z panelem, więc fokus po najbliższym renderze
    requestAnimationFrame(() => textRef.current?.focus())
  }

  const addSibling = () => {
    if (!selected?.parentId) return
    addChild(selected.parentId)
  }

  return (
    <div className="screen editor-screen">
      <div className="float-top left">
        <button type="button" className="pill-btn" onClick={onBack} aria-label="Wstecz">
          <IconBack />
        </button>
      </div>

      <div className="float-top">
        <button
          type="button"
          className={`pill-btn${map.pinned ? ' is-on' : ''}`}
          onClick={onTogglePin}
          aria-label="Przypnij mapę"
        >
          <IconPin />
        </button>
        <span className="pill-sep" />
        <button
          type="button"
          className="pill-btn danger"
          onClick={() => {
            if (window.confirm(`Przenieść mapę "${map.title}" do kosza?`)) {
              onTrash()
              onBack()
            }
          }}
          aria-label="Do kosza"
        >
          <IconTrash />
        </button>
      </div>

      <MapCanvas
        nodes={map.nodes}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onToggleCollapse={onToggleCollapse}
        interactive
        padding={30}
        className="editor-canvas"
      />

      {selected ? (
        <div className="node-sheet">
          <div className="sheet-grip" />

          <div className="sheet-row">
            <input
              ref={textRef}
              className="sheet-input"
              value={selected.text}
              onChange={(e) => onUpdateNode(selected.id, { text: e.target.value })}
              placeholder={isRoot ? 'Temat mapy' : 'Treść gałęzi'}
              aria-label="Tekst węzła"
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => setSelectedId(null)}
              aria-label="Zamknij"
            >
              <IconClose size={18} />
            </button>
          </div>

          {noteOpen && (
            <textarea
              className="sheet-note"
              value={selected.note ?? ''}
              onChange={(e) => onUpdateNode(selected.id, { note: e.target.value })}
              placeholder="Notatka do tego węzła…"
              aria-label="Notatka węzła"
            />
          )}

          {showColors && (
            <div className="swatch-row" role="group" aria-label="Kolor gałęzi">
              {BRANCH_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`swatch tone-${color}`}
                  onClick={() => {
                    onSetColor(selected.id, color)
                    setShowColors(false)
                  }}
                  aria-label={`Kolor ${color}`}
                />
              ))}
            </div>
          )}

          <div className="sheet-actions">
            <button type="button" className="sheet-btn" onClick={() => addChild(selected.id)}>
              <IconChild size={18} />
              Gałąź
            </button>
            {!isRoot && (
              <button type="button" className="sheet-btn" onClick={addSibling}>
                <IconSibling size={18} />
                Obok
              </button>
            )}
            <button
              type="button"
              className={`sheet-btn${noteOpen ? ' is-on' : ''}`}
              onClick={() => setNoteOpen((n) => !n)}
            >
              <IconNote size={18} />
              Notatka
            </button>
            {!isRoot && (
              <button
                type="button"
                className={`sheet-btn${showColors ? ' is-on' : ''}`}
                onClick={() => setShowColors((s) => !s)}
              >
                <IconPalette size={18} />
                Kolor
              </button>
            )}
            {childCount > 0 && (
              <button
                type="button"
                className="sheet-btn"
                onClick={() => onToggleCollapse(selected.id)}
              >
                {selected.collapsed ? <IconExpand size={18} /> : <IconCollapse size={18} />}
                {selected.collapsed ? 'Rozwiń' : 'Zwiń'}
              </button>
            )}
            {!isRoot && (
              <button
                type="button"
                className="sheet-btn danger"
                onClick={() => {
                  const label = selected.text || 'ten węzeł'
                  const question =
                    childCount > 0
                      ? `Usunąć "${label}" razem z ${childCount} podgałęziami?`
                      : `Usunąć "${label}"?`
                  if (window.confirm(question)) {
                    onRemoveNode(selected.id)
                    setSelectedId(null)
                  }
                }}
              >
                <IconTrash size={18} />
                Usuń
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="float-bottom">
          <button
            type="button"
            className="pill-btn wide-btn"
            onClick={() => root && addChild(root.id)}
          >
            <IconPlus size={18} />
            Nowa gałąź
          </button>
        </div>
      )}
    </div>
  )
}
