import { useState } from 'react'
import { IconBack, IconCompose, IconSearch } from '../components/Icons'
import { relativeTime } from '../lib/date'
import { plainText } from '../lib/markdown'
import { liveNotes, searchNotes } from '../store/appReducer'
import type { AppData } from '../types'

type Props = {
  data: AppData
  onBack: () => void
  onOpenNote: (id: string) => void
  onNewNote: () => void
}

export function NotesScreen({ data, onBack, onOpenNote, onNewNote }: Props) {
  const [query, setQuery] = useState('')
  const notes = searchNotes(liveNotes(data), query)

  return (
    <div className="screen">
      <header className="sub-header">
        <button type="button" className="pill-btn solo" onClick={onBack} aria-label="Wstecz">
          <IconBack />
        </button>
        <div className="sub-title">
          <h1>Notatki</h1>
          <span className="muted">
            {notes.length}{' '}
            {notes.length === 1
              ? 'notatka'
              : notes.length > 1 && notes.length < 5
                ? 'notatki'
                : 'notatek'}
          </span>
        </div>
        <div className="float-inline">
          <button type="button" className="pill-btn" onClick={onNewNote} aria-label="Nowa notatka">
            <IconCompose />
          </button>
        </div>
      </header>

      {notes.length === 0 ? (
        <div className="empty">
          <p className="empty-icon">📝</p>
          <h2>{query ? 'Nic nie znalazłem' : 'Brak notatek'}</h2>
          {!query && (
            <button type="button" className="primary-btn" onClick={onNewNote}>
              Nowa notatka
            </button>
          )}
        </div>
      ) : (
        <div className="note-list">
          {notes.map((note) => {
            const done = note.checklist.filter((i) => i.done).length
            return (
              <button
                key={note.id}
                type="button"
                className="note-card"
                onClick={() => onOpenNote(note.id)}
              >
                <span className="note-card-title">{note.title || 'Bez tytułu'}</span>
                {note.body && <span className="note-card-preview">{plainText(note.body).slice(0, 140)}</span>}
                <span className="note-card-meta">
                  {relativeTime(note.updatedAt)}
                  {note.checklist.length > 0 && ` · ${done}/${note.checklist.length}`}
                  {note.tags.length > 0 && ` · ${note.tags.map((t) => `#${t}`).join(' ')}`}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="float-bottom wide">
        <IconSearch size={18} className="search-icon" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj w notatkach"
          aria-label="Szukaj w notatkach"
          className="search-input"
        />
      </div>
    </div>
  )
}
