import { useState } from 'react'
import { MapThumb } from '../components/MapThumb'
import {
  IconBack,
  IconCompose,
  IconGrid,
  IconList,
  IconRestore,
  IconSearch,
  IconTrash,
} from '../components/Icons'
import { relativeTime } from '../lib/date'
import { branchCount, searchMaps, searchNotes } from '../store/appReducer'
import type { AppData, MindMap, Note } from '../types'

type Props = {
  data: AppData
  scope: 'all' | 'recent' | 'trash'
  onBack: () => void
  onOpenMap: (id: string) => void
  onNewMap: () => void
  onRestoreMap: (id: string) => void
  onDeleteMap: (id: string) => void
  onRestoreNote: (id: string) => void
  onDeleteNote: (id: string) => void
}

const TITLES = {
  all: 'Wszystkie mapy',
  recent: 'Ostatnie',
  trash: 'Kosz',
}

export function MapsScreen({
  data,
  scope,
  onBack,
  onOpenMap,
  onNewMap,
  onRestoreMap,
  onDeleteMap,
  onRestoreNote,
  onDeleteNote,
}: Props) {
  const [query, setQuery] = useState('')
  const [grid, setGrid] = useState(true)

  let maps: MindMap[]
  let trashedNotes: Note[] = []

  if (scope === 'trash') {
    maps = data.maps.filter((m) => m.trashed)
    trashedNotes = data.notes.filter((n) => n.trashed)
  } else {
    maps = data.maps
      .filter((m) => !m.trashed)
      .sort((a, b) =>
        scope === 'recent'
          ? b.updatedAt - a.updatedAt
          : Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt,
      )
  }

  const visible = searchMaps(maps, query)
  const visibleNotes = searchNotes(trashedNotes, query)
  const total = visible.length + visibleNotes.length

  return (
    <div className="screen">
      <header className="sub-header">
        <button type="button" className="pill-btn solo" onClick={onBack} aria-label="Wstecz">
          <IconBack />
        </button>
        <div className="sub-title">
          <h1>{TITLES[scope]}</h1>
          <span className="muted">
            {total} {total === 1 ? 'dokument' : total > 1 && total < 5 ? 'dokumenty' : 'dokumentów'}
          </span>
        </div>
        <div className="float-inline">
          {scope !== 'trash' && (
            <>
              <button type="button" className="pill-btn" onClick={onNewMap} aria-label="Nowa mapa">
                <IconCompose />
              </button>
              <span className="pill-sep" />
            </>
          )}
          <button
            type="button"
            className="pill-btn"
            onClick={() => setGrid((g) => !g)}
            aria-label={grid ? 'Lista' : 'Kafelki'}
          >
            {grid ? <IconList /> : <IconGrid />}
          </button>
        </div>
      </header>

      {total === 0 ? (
        <div className="empty">
          <p className="empty-icon">{scope === 'trash' ? '🗑️' : '🧠'}</p>
          <h2>{query ? 'Nic nie znalazłem' : scope === 'trash' ? 'Kosz jest pusty' : 'Brak map'}</h2>
          {!query && scope !== 'trash' && (
            <button type="button" className="primary-btn" onClick={onNewMap}>
              Nowa mapa
            </button>
          )}
        </div>
      ) : (
        <div className={grid ? 'thumb-grid' : 'thumb-list'}>
          {visible.map((map) =>
            scope === 'trash' ? (
              <div key={map.id} className="trash-row">
                <span className="trash-info">
                  <strong>
                    {map.emoji ? `${map.emoji} ` : ''}
                    {map.title}
                  </strong>
                  <span className="muted">
                    {relativeTime(map.updatedAt)} · {branchCount(map)} gałęzi
                  </span>
                </span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onRestoreMap(map.id)}
                  aria-label="Przywróć"
                >
                  <IconRestore size={18} />
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => {
                    if (window.confirm(`Usunąć mapę "${map.title}" na zawsze?`)) onDeleteMap(map.id)
                  }}
                  aria-label="Usuń trwale"
                >
                  <IconTrash size={18} />
                </button>
              </div>
            ) : grid ? (
              <MapThumb key={map.id} map={map} onOpen={() => onOpenMap(map.id)} />
            ) : (
              <button
                key={map.id}
                type="button"
                className="list-row"
                onClick={() => onOpenMap(map.id)}
              >
                <span className="row-emoji">{map.emoji || '🧠'}</span>
                <span className="row-label">
                  {map.title}
                  <span className="muted small">
                    {relativeTime(map.updatedAt)} · {branchCount(map)} gałęzi
                  </span>
                </span>
              </button>
            ),
          )}

          {visibleNotes.map((note) => (
            <div key={note.id} className="trash-row">
              <span className="trash-info">
                <strong>📝 {note.title || 'Bez tytułu'}</strong>
                <span className="muted">{relativeTime(note.updatedAt)}</span>
              </span>
              <button
                type="button"
                className="icon-btn"
                onClick={() => onRestoreNote(note.id)}
                aria-label="Przywróć"
              >
                <IconRestore size={18} />
              </button>
              <button
                type="button"
                className="icon-btn danger"
                onClick={() => {
                  if (window.confirm('Usunąć notatkę na zawsze?')) onDeleteNote(note.id)
                }}
                aria-label="Usuń trwale"
              >
                <IconTrash size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="float-bottom wide">
        <IconSearch size={18} className="search-icon" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj"
          aria-label="Szukaj"
          className="search-input"
        />
      </div>

      {scope === 'trash' && total > 0 && (
        <p className="hint">Elementy w koszu można przywrócić albo usunąć na zawsze.</p>
      )}
    </div>
  )
}
