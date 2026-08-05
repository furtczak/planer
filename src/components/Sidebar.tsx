import { useState } from 'react'
import {
  IconArchive,
  IconClose,
  IconDownload,
  IconFolder,
  IconNotes,
  IconPin,
  IconPlus,
  IconSparkles,
  IconTag,
  IconTrash,
  IconUpload,
} from './Icons'
import type { Filter, Folder, Note } from '../types'
import { collectTags, countsByFilter } from '../store/notesReducer'

type Props = {
  notes: Note[]
  folders: Folder[]
  filter: Filter
  onFilter: (filter: Filter) => void
  onAddFolder: (name: string) => void
  onRemoveFolder: (id: string) => void
  onRenameFolder: (id: string, name: string) => void
  onExport: () => void
  onImport: () => void
  onLoadSample: () => void
  open: boolean
  onClose: () => void
}

function sameFilter(a: Filter, b: Filter): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'folder' && b.kind === 'folder') return a.folderId === b.folderId
  if (a.kind === 'tag' && b.kind === 'tag') return a.tag === b.tag
  return true
}

export function Sidebar({
  notes,
  folders,
  filter,
  onFilter,
  onAddFolder,
  onRemoveFolder,
  onRenameFolder,
  onExport,
  onImport,
  onLoadSample,
  open,
  onClose,
}: Props) {
  const [newFolder, setNewFolder] = useState('')
  const counts = countsByFilter(notes)
  const tags = collectTags(notes)

  const submitFolder = (event: React.FormEvent) => {
    event.preventDefault()
    if (!newFolder.trim()) return
    onAddFolder(newFolder)
    setNewFolder('')
  }

  const item = (target: Filter, label: string, icon: React.ReactNode, count: number) => (
    <button
      type="button"
      className={`nav-item${sameFilter(filter, target) ? ' is-active' : ''}`}
      onClick={() => {
        onFilter(target)
        onClose()
      }}
    >
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
      <span className="nav-count">{count}</span>
    </button>
  )

  return (
    <>
      <div className={`sidebar-backdrop${open ? ' is-open' : ''}`} onClick={onClose} />
      <aside className={`sidebar${open ? ' is-open' : ''}`}>
        <div className="sidebar-head">
          <div className="brand">
            <span className="brand-mark">🧠</span>
            <span>
              Mind<strong>Notes</strong>
            </span>
          </div>
          <button type="button" className="icon-btn only-mobile" onClick={onClose} aria-label="Zamknij menu">
            <IconClose />
          </button>
        </div>

        <nav className="nav-group">
          {item({ kind: 'all' }, 'Wszystkie notatki', <IconNotes />, counts.all)}
          {item({ kind: 'pinned' }, 'Przypięte', <IconPin />, counts.pinned)}
          {item({ kind: 'archive' }, 'Archiwum', <IconArchive />, counts.archive)}
          {item({ kind: 'trash' }, 'Kosz', <IconTrash />, counts.trash)}
        </nav>

        <div className="nav-group">
          <h2 className="nav-title">Foldery</h2>
          {folders.length === 0 && <p className="nav-empty">Brak folderów</p>}
          {folders.map((folder) => (
            <div key={folder.id} className="nav-row">
              <button
                type="button"
                className={`nav-item${
                  sameFilter(filter, { kind: 'folder', folderId: folder.id }) ? ' is-active' : ''
                }`}
                onClick={() => {
                  onFilter({ kind: 'folder', folderId: folder.id })
                  onClose()
                }}
                onDoubleClick={() => {
                  const name = window.prompt('Nowa nazwa folderu', folder.name)
                  if (name) onRenameFolder(folder.id, name)
                }}
                title="Kliknij dwukrotnie, aby zmienić nazwę"
              >
                <span className="nav-icon">{folder.emoji || <IconFolder />}</span>
                <span className="nav-label">{folder.name}</span>
                <span className="nav-count">{counts.byFolder(folder.id)}</span>
              </button>
              <button
                type="button"
                className="icon-btn nav-remove"
                aria-label={`Usuń folder ${folder.name}`}
                onClick={() => {
                  if (window.confirm(`Usunąć folder "${folder.name}"? Notatki zostaną zachowane.`)) {
                    onRemoveFolder(folder.id)
                  }
                }}
              >
                <IconClose size={14} />
              </button>
            </div>
          ))}

          <form className="folder-form" onSubmit={submitFolder}>
            <input
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              placeholder="Nowy folder"
              aria-label="Nazwa nowego folderu"
            />
            <button type="submit" className="icon-btn" aria-label="Dodaj folder">
              <IconPlus size={16} />
            </button>
          </form>
        </div>

        <div className="nav-group">
          <h2 className="nav-title">Tagi</h2>
          {tags.length === 0 && <p className="nav-empty">Brak tagów</p>}
          <div className="tag-cloud">
            {tags.map(({ tag, count }) => (
              <button
                key={tag}
                type="button"
                className={`tag-chip${
                  sameFilter(filter, { kind: 'tag', tag }) ? ' is-active' : ''
                }`}
                onClick={() => {
                  onFilter({ kind: 'tag', tag })
                  onClose()
                }}
              >
                <IconTag size={12} />
                {tag}
                <span className="tag-count">{count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-foot">
          <button type="button" className="ghost-btn" onClick={onExport}>
            <IconDownload size={16} /> Eksport
          </button>
          <button type="button" className="ghost-btn" onClick={onImport}>
            <IconUpload size={16} /> Import
          </button>
          <button type="button" className="ghost-btn" onClick={onLoadSample}>
            <IconSparkles size={16} /> Przykłady
          </button>
        </div>
      </aside>
    </>
  )
}
