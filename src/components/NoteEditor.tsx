import { useEffect, useMemo, useRef, useState } from 'react'
import { fullDate } from '../lib/date'
import { renderMarkdown } from '../lib/markdown'
import type { Folder, Note, NoteColor } from '../types'
import { IconArchive, IconCheck, IconClose, IconPin, IconPlus, IconTrash } from './Icons'

const COLORS: NoteColor[] = ['default', 'yellow', 'green', 'blue', 'purple', 'pink', 'orange']

type Props = {
  note: Note
  folders: Folder[]
  onPatch: (patch: Partial<Note>) => void
  onClose: () => void
  onTogglePin: () => void
  onToggleArchive: () => void
  onTrash: () => void
  onAddChecklistItem: (text: string) => void
  onUpdateChecklistItem: (itemId: string, text: string) => void
  onToggleChecklistItem: (itemId: string) => void
  onRemoveChecklistItem: (itemId: string) => void
}

export function NoteEditor({
  note,
  folders,
  onPatch,
  onClose,
  onTogglePin,
  onToggleArchive,
  onTrash,
  onAddChecklistItem,
  onUpdateChecklistItem,
  onToggleChecklistItem,
  onRemoveChecklistItem,
}: Props) {
  const [preview, setPreview] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [tagDraft, setTagDraft] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (!note.title && !note.body) titleRef.current?.focus()
    // celowo tylko przy zmianie notatki - nie chcemy kraść fokusu przy każdym znaku
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id])

  const html = useMemo(() => renderMarkdown(note.body), [note.body])
  const doneCount = note.checklist.filter((i) => i.done).length

  const addTag = (event: React.FormEvent) => {
    event.preventDefault()
    const tag = tagDraft.trim().replace(/^#/, '').toLowerCase()
    if (!tag || note.tags.includes(tag)) {
      setTagDraft('')
      return
    }
    onPatch({ tags: [...note.tags, tag] })
    setTagDraft('')
  }

  const addItem = (event: React.FormEvent) => {
    event.preventDefault()
    if (!newItem.trim()) return
    onAddChecklistItem(newItem)
    setNewItem('')
  }

  return (
    <div className="editor-backdrop" onMouseDown={onClose}>
      <div
        className={`editor color-${note.color}`}
        role="dialog"
        aria-modal="true"
        aria-label="Edytor notatki"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="editor-head">
          <input
            ref={titleRef}
            className="editor-title"
            value={note.title}
            onChange={(e) => onPatch({ title: e.target.value })}
            placeholder="Tytuł notatki"
            aria-label="Tytuł notatki"
          />
          <div className="editor-head-actions">
            <button
              type="button"
              className={`icon-btn${note.pinned ? ' is-on' : ''}`}
              onClick={onTogglePin}
              aria-label="Przypnij"
              title="Przypnij"
            >
              <IconPin />
            </button>
            <button
              type="button"
              className={`icon-btn${note.archived ? ' is-on' : ''}`}
              onClick={onToggleArchive}
              aria-label="Archiwizuj"
              title="Archiwizuj"
            >
              <IconArchive />
            </button>
            <button
              type="button"
              className="icon-btn danger"
              onClick={() => {
                onTrash()
                onClose()
              }}
              aria-label="Do kosza"
              title="Do kosza"
            >
              <IconTrash />
            </button>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Zamknij" title="Zamknij (Esc)">
              <IconClose />
            </button>
          </div>
        </header>

        <div className="editor-toolbar">
          <select
            className="select"
            value={note.folderId ?? ''}
            onChange={(e) => onPatch({ folderId: e.target.value || null })}
            aria-label="Folder"
          >
            <option value="">Bez folderu</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.emoji} {f.name}
              </option>
            ))}
          </select>

          <div className="color-picker" role="group" aria-label="Kolor notatki">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`swatch swatch-${color}${note.color === color ? ' is-active' : ''}`}
                onClick={() => onPatch({ color })}
                aria-label={`Kolor ${color}`}
              />
            ))}
          </div>

          <button
            type="button"
            className={`ghost-btn${preview ? ' is-active' : ''}`}
            onClick={() => setPreview((p) => !p)}
          >
            {preview ? 'Edytuj' : 'Podgląd'}
          </button>
        </div>

        <div className="editor-body">
          {preview ? (
            <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <textarea
              className="editor-textarea"
              value={note.body}
              onChange={(e) => onPatch({ body: e.target.value })}
              placeholder={'Treść notatki…\n\nObsługiwany Markdown: # nagłówki, **pogrubienie**, - listy, > cytat, `kod`, #tagi'}
              aria-label="Treść notatki"
            />
          )}

          <section className="checklist-section">
            <h4>
              Lista zadań
              {note.checklist.length > 0 && (
                <span className="muted">
                  {' '}
                  {doneCount}/{note.checklist.length}
                </span>
              )}
            </h4>

            <ul className="checklist">
              {note.checklist.map((item) => (
                <li key={item.id} className={item.done ? 'is-done' : ''}>
                  <button
                    type="button"
                    className={`check${item.done ? ' is-on' : ''}`}
                    onClick={() => onToggleChecklistItem(item.id)}
                    aria-label={item.done ? 'Odznacz' : 'Zaznacz'}
                  >
                    {item.done && <IconCheck size={13} />}
                  </button>
                  <input
                    value={item.text}
                    onChange={(e) => onUpdateChecklistItem(item.id, e.target.value)}
                    aria-label="Treść zadania"
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onRemoveChecklistItem(item.id)}
                    aria-label="Usuń zadanie"
                  >
                    <IconClose size={14} />
                  </button>
                </li>
              ))}
            </ul>

            <form className="inline-form" onSubmit={addItem}>
              <input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Dodaj zadanie"
                aria-label="Nowe zadanie"
              />
              <button type="submit" className="icon-btn" aria-label="Dodaj zadanie">
                <IconPlus size={16} />
              </button>
            </form>
          </section>
        </div>

        <footer className="editor-foot">
          <div className="editor-tags">
            {note.tags.map((tag) => (
              <span key={tag} className="tag-pill">
                #{tag}
                <button
                  type="button"
                  onClick={() => onPatch({ tags: note.tags.filter((t) => t !== tag) })}
                  aria-label={`Usuń tag ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <form className="inline-form tag-form" onSubmit={addTag}>
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                placeholder="+ tag"
                aria-label="Nowy tag"
              />
            </form>
          </div>
          <span className="muted small">Zmieniono: {fullDate(note.updatedAt)}</span>
        </footer>
      </div>
    </div>
  )
}
