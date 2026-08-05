import { relativeTime } from '../lib/date'
import { plainText } from '../lib/markdown'
import { noteTags } from '../store/notesReducer'
import type { Note } from '../types'
import { IconArchive, IconPin, IconRestore, IconTrash } from './Icons'

type Props = {
  note: Note
  folderName?: string
  onOpen: () => void
  onTogglePin: () => void
  onToggleArchive: () => void
  onTrash: () => void
  onRestore: () => void
  onDelete: () => void
  onToggleChecklistItem: (itemId: string) => void
}

export function NoteCard({
  note,
  folderName,
  onOpen,
  onTogglePin,
  onToggleArchive,
  onTrash,
  onRestore,
  onDelete,
  onToggleChecklistItem,
}: Props) {
  const preview = plainText(note.body)
  const tags = noteTags(note)
  const done = note.checklist.filter((i) => i.done).length
  const visibleItems = note.checklist.slice(0, 4)

  const stop = (event: React.MouseEvent) => event.stopPropagation()

  return (
    <article
      className={`note-card color-${note.color}${note.pinned ? ' is-pinned' : ''}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      <div className="note-card-head">
        <h3>{note.title || 'Bez tytułu'}</h3>
        {!note.trashed && (
          <button
            type="button"
            className={`icon-btn pin-btn${note.pinned ? ' is-on' : ''}`}
            onClick={(e) => {
              stop(e)
              onTogglePin()
            }}
            aria-label={note.pinned ? 'Odepnij' : 'Przypnij'}
            title={note.pinned ? 'Odepnij' : 'Przypnij'}
          >
            <IconPin size={16} />
          </button>
        )}
      </div>

      {preview && <p className="note-preview">{preview.slice(0, 220)}</p>}

      {note.checklist.length > 0 && (
        <ul className="note-checklist">
          {visibleItems.map((item) => (
            <li key={item.id} className={item.done ? 'is-done' : ''}>
              {/* klik w zadanie tylko je odhacza - notatkę otwiera reszta kafelka */}
              <label onClick={stop}>
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => onToggleChecklistItem(item.id)}
                />
                <span>{item.text}</span>
              </label>
            </li>
          ))}
          {note.checklist.length > visibleItems.length && (
            <li className="more">+{note.checklist.length - visibleItems.length} więcej</li>
          )}
        </ul>
      )}

      {note.checklist.length > 0 && (
        <div className="progress" title={`${done} z ${note.checklist.length} zrobione`}>
          <span style={{ width: `${(done / note.checklist.length) * 100}%` }} />
        </div>
      )}

      {tags.length > 0 && (
        <div className="note-tags">
          {tags.slice(0, 4).map((tag) => (
            <span key={tag} className="tag-pill">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <footer className="note-card-foot">
        <span className="muted">
          {folderName && <strong>{folderName} · </strong>}
          {relativeTime(note.updatedAt)}
        </span>

        <div className="note-actions" onClick={stop}>
          {note.trashed ? (
            <>
              <button type="button" className="icon-btn" onClick={onRestore} aria-label="Przywróć" title="Przywróć">
                <IconRestore size={16} />
              </button>
              <button
                type="button"
                className="icon-btn danger"
                onClick={() => {
                  if (window.confirm('Usunąć notatkę na zawsze?')) onDelete()
                }}
                aria-label="Usuń trwale"
                title="Usuń trwale"
              >
                <IconTrash size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`icon-btn${note.archived ? ' is-on' : ''}`}
                onClick={onToggleArchive}
                aria-label={note.archived ? 'Przywróć z archiwum' : 'Archiwizuj'}
                title={note.archived ? 'Przywróć z archiwum' : 'Archiwizuj'}
              >
                <IconArchive size={16} />
              </button>
              <button type="button" className="icon-btn" onClick={onTrash} aria-label="Do kosza" title="Do kosza">
                <IconTrash size={16} />
              </button>
            </>
          )}
        </div>
      </footer>
    </article>
  )
}
