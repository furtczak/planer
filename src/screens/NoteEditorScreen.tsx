import { useMemo, useState } from 'react'
import { IconBack, IconCheck, IconClose, IconPlus, IconTrash } from '../components/Icons'
import { fullDate } from '../lib/date'
import { renderMarkdown } from '../lib/markdown'
import type { Note } from '../types'

type Props = {
  note: Note
  onBack: () => void
  onPatch: (patch: Partial<Note>) => void
  onTrash: () => void
  onAddChecklistItem: (text: string) => void
  onToggleChecklistItem: (itemId: string) => void
  onRemoveChecklistItem: (itemId: string) => void
}

export function NoteEditorScreen({
  note,
  onBack,
  onPatch,
  onTrash,
  onAddChecklistItem,
  onToggleChecklistItem,
  onRemoveChecklistItem,
}: Props) {
  const [preview, setPreview] = useState(false)
  const [item, setItem] = useState('')
  const [tag, setTag] = useState('')
  const html = useMemo(() => renderMarkdown(note.body), [note.body])
  const done = note.checklist.filter((i) => i.done).length

  const addTag = (event: React.FormEvent) => {
    event.preventDefault()
    const clean = tag.trim().replace(/^#/, '').toLowerCase()
    setTag('')
    if (!clean || note.tags.includes(clean)) return
    onPatch({ tags: [...note.tags, clean] })
  }

  return (
    <div className="screen note-screen">
      <header className="sub-header">
        <button type="button" className="pill-btn solo" onClick={onBack} aria-label="Wstecz">
          <IconBack />
        </button>
        <div className="float-inline">
          <button
            type="button"
            className={`pill-btn text${preview ? ' is-on' : ''}`}
            onClick={() => setPreview((p) => !p)}
          >
            {preview ? 'Edytuj' : 'Podgląd'}
          </button>
          <span className="pill-sep" />
          <button
            type="button"
            className="pill-btn danger"
            onClick={() => {
              if (window.confirm('Przenieść notatkę do kosza?')) {
                onTrash()
                onBack()
              }
            }}
            aria-label="Do kosza"
          >
            <IconTrash />
          </button>
        </div>
      </header>

      <input
        className="note-title-input"
        value={note.title}
        onChange={(e) => onPatch({ title: e.target.value })}
        placeholder="Tytuł"
        aria-label="Tytuł notatki"
      />

      {preview ? (
        <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <textarea
          className="note-body-input"
          value={note.body}
          onChange={(e) => onPatch({ body: e.target.value })}
          placeholder={'Treść notatki…\n\nMarkdown: # nagłówek, **pogrubienie**, - lista, > cytat'}
          aria-label="Treść notatki"
        />
      )}

      <section className="checklist-block">
        <h2 className="section-title">
          Zadania {note.checklist.length > 0 && <span className="muted">{done}/{note.checklist.length}</span>}
        </h2>
        <ul className="checklist">
          {note.checklist.map((i) => (
            <li key={i.id} className={i.done ? 'is-done' : ''}>
              <button
                type="button"
                className={`check${i.done ? ' is-on' : ''}`}
                onClick={() => onToggleChecklistItem(i.id)}
                aria-label={i.done ? 'Odznacz' : 'Zaznacz'}
              >
                {i.done && <IconCheck size={13} />}
              </button>
              <span>{i.text}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={() => onRemoveChecklistItem(i.id)}
                aria-label="Usuń zadanie"
              >
                <IconClose size={15} />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault()
            onAddChecklistItem(item)
            setItem('')
          }}
        >
          <input
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="Dodaj zadanie"
            aria-label="Nowe zadanie"
          />
          <button type="submit" className="icon-btn" aria-label="Dodaj zadanie">
            <IconPlus size={18} />
          </button>
        </form>
      </section>

      <section className="tag-block">
        <div className="tag-row">
          {note.tags.map((t) => (
            <span key={t} className="tag-pill">
              #{t}
              <button
                type="button"
                onClick={() => onPatch({ tags: note.tags.filter((x) => x !== t) })}
                aria-label={`Usuń tag ${t}`}
              >
                ×
              </button>
            </span>
          ))}
          <form className="inline-form tag-form" onSubmit={addTag}>
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="+ tag"
              aria-label="Nowy tag"
            />
          </form>
        </div>
        <p className="muted small">Zmieniono: {fullDate(note.updatedAt)}</p>
      </section>
    </div>
  )
}
