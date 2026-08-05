import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MindMap } from './components/MindMap'
import { NoteCard } from './components/NoteCard'
import { NoteEditor } from './components/NoteEditor'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { useAppData } from './hooks/useAppData'
import { useTheme } from './hooks/useTheme'
import { exportData, normalizeData } from './lib/storage'
import { sampleData } from './lib/sample'
import { selectNotes } from './store/notesReducer'
import type { Filter, Note, SortMode, ViewMode } from './types'

function filterTitle(filter: Filter, folderName: (id: string) => string): string {
  switch (filter.kind) {
    case 'pinned':
      return 'Przypięte'
    case 'archive':
      return 'Archiwum'
    case 'trash':
      return 'Kosz'
    case 'folder':
      return folderName(filter.folderId)
    case 'tag':
      return `#${filter.tag}`
    case 'all':
    default:
      return 'Wszystkie notatki'
  }
}

export default function App() {
  const { data, dispatch } = useAppData()
  const { theme, toggleTheme } = useTheme()

  const [filter, setFilter] = useState<Filter>({ kind: 'all' })
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortMode>('updated')
  const [view, setView] = useState<ViewMode>('grid')
  const [openId, setOpenId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const visible = useMemo(
    () => selectNotes(data.notes, filter, query, sort),
    [data.notes, filter, query, sort],
  )

  const openNote = data.notes.find((n) => n.id === openId) ?? null
  const folderName = useCallback(
    (id: string) => data.folders.find((f) => f.id === id)?.name ?? 'Folder',
    [data.folders],
  )

  const createNote = useCallback(() => {
    const draft: Partial<Note> = {
      folderId: filter.kind === 'folder' ? filter.folderId : null,
      tags: filter.kind === 'tag' ? [filter.tag] : [],
    }
    const id = `n-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
    dispatch({ type: 'createNote', draft: { ...draft, id } })
    setOpenId(id)
    if (filter.kind === 'archive' || filter.kind === 'trash') setFilter({ kind: 'all' })
  }, [dispatch, filter])

  // skróty klawiszowe: "/" - szukaj, "n" - nowa notatka
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return

      if (event.key === '/') {
        event.preventDefault()
        document.querySelector<HTMLInputElement>('[data-search-input]')?.focus()
      }
      if (event.key.toLowerCase() === 'n' && !openId) {
        event.preventDefault()
        createNote()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [createNote, openId])

  const handleExport = () => {
    const blob = new Blob([exportData(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mind-notes-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const parsed = normalizeData(JSON.parse(await file.text()))
      if (!parsed) {
        window.alert('Nie rozpoznaję tego pliku - oczekuję eksportu z Mind Notes.')
        return
      }
      if (window.confirm(`Zaimportować ${parsed.notes.length} notatek? Bieżące dane zostaną zastąpione.`)) {
        dispatch({ type: 'load', data: parsed })
        setFilter({ kind: 'all' })
      }
    } catch {
      window.alert('Nie udało się odczytać pliku JSON.')
    }
  }

  const loadSample = () => {
    if (window.confirm('Wczytać przykładowe notatki? Bieżące dane zostaną zastąpione.')) {
      dispatch({ type: 'load', data: sampleData() })
      setFilter({ kind: 'all' })
    }
  }

  const title = filterTitle(filter, folderName)

  return (
    <div className="app">
      <Sidebar
        notes={data.notes}
        folders={data.folders}
        filter={filter}
        onFilter={setFilter}
        onAddFolder={(name) => dispatch({ type: 'addFolder', name })}
        onRemoveFolder={(id) => {
          dispatch({ type: 'removeFolder', id })
          if (filter.kind === 'folder' && filter.folderId === id) setFilter({ kind: 'all' })
        }}
        onRenameFolder={(id, name) => dispatch({ type: 'renameFolder', id, name })}
        onExport={handleExport}
        onImport={() => fileInput.current?.click()}
        onLoadSample={loadSample}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <main className="main">
        <Topbar
          title={title}
          count={visible.length}
          query={query}
          onQuery={setQuery}
          view={view}
          onView={setView}
          sort={sort}
          onSort={setSort}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNewNote={createNote}
          onOpenMenu={() => setMenuOpen(true)}
        />

        {filter.kind === 'trash' && visible.length > 0 && (
          <div className="banner">
            <span>Notatki w koszu można przywrócić lub usunąć na zawsze.</span>
            <button
              type="button"
              className="ghost-btn danger"
              onClick={() => {
                if (window.confirm('Opróżnić kosz? Tej operacji nie da się cofnąć.')) {
                  dispatch({ type: 'emptyTrash' })
                }
              }}
            >
              Opróżnij kosz
            </button>
          </div>
        )}

        <section className="content">
          {visible.length === 0 ? (
            <div className="empty">
              <p className="empty-icon">🧠</p>
              <h2>{query ? 'Nic nie znalazłem' : 'Pusto tutaj'}</h2>
              <p className="muted">
                {query
                  ? 'Spróbuj innej frazy albo wyczyść wyszukiwanie.'
                  : 'Dodaj pierwszą notatkę - klawisz "n" też działa.'}
              </p>
              {!query && (
                <button type="button" className="primary-btn" onClick={createNote}>
                  Nowa notatka
                </button>
              )}
            </div>
          ) : view === 'map' ? (
            <MindMap
              notes={visible}
              folders={data.folders}
              rootLabel={title}
              onOpenNote={setOpenId}
            />
          ) : (
            <div className={view === 'grid' ? 'note-grid' : 'note-list'}>
              {visible.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  folderName={note.folderId ? folderName(note.folderId) : undefined}
                  onOpen={() => setOpenId(note.id)}
                  onTogglePin={() => dispatch({ type: 'toggleFlag', id: note.id, flag: 'pinned' })}
                  onToggleArchive={() =>
                    dispatch({ type: 'toggleFlag', id: note.id, flag: 'archived' })
                  }
                  onTrash={() => dispatch({ type: 'trashNote', id: note.id })}
                  onRestore={() => dispatch({ type: 'restoreNote', id: note.id })}
                  onDelete={() => dispatch({ type: 'deleteNote', id: note.id })}
                  onToggleChecklistItem={(itemId) =>
                    dispatch({ type: 'toggleChecklistItem', noteId: note.id, itemId })
                  }
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {openNote && (
        <NoteEditor
          note={openNote}
          folders={data.folders}
          onPatch={(patch) => dispatch({ type: 'updateNote', id: openNote.id, patch })}
          onClose={() => setOpenId(null)}
          onTogglePin={() => dispatch({ type: 'toggleFlag', id: openNote.id, flag: 'pinned' })}
          onToggleArchive={() => dispatch({ type: 'toggleFlag', id: openNote.id, flag: 'archived' })}
          onTrash={() => dispatch({ type: 'trashNote', id: openNote.id })}
          onAddChecklistItem={(text) =>
            dispatch({ type: 'addChecklistItem', noteId: openNote.id, text })
          }
          onUpdateChecklistItem={(itemId, text) =>
            dispatch({ type: 'updateChecklistItem', noteId: openNote.id, itemId, text })
          }
          onToggleChecklistItem={(itemId) =>
            dispatch({ type: 'toggleChecklistItem', noteId: openNote.id, itemId })
          }
          onRemoveChecklistItem={(itemId) =>
            dispatch({ type: 'removeChecklistItem', noteId: openNote.id, itemId })
          }
        />
      )}

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden-input"
        onChange={handleImportFile}
      />
    </div>
  )
}
